import type { Prisma, RestoOrderStatus } from "@prisma/client";

/**
 * Filters for the staff order history, shared by the page and the CSV export
 * so the file can never disagree with the list that produced it.
 *
 * Every parser here falls back rather than throwing, in the style of
 * parsePeriod() on the dashboard: a hand-edited query string should show the
 * default range, not a 500.
 */

/** Default rows per page; the length menu can override it per request. */
export const HISTORY_PAGE_SIZE = 25;

export const HISTORY_PAGE_SIZES = [10, 25, 50, 100];

/**
 * Sortable columns, as a whitelist.
 *
 * The keys double as Prisma field names, so this list is also what stops a
 * hand-edited `?sort=` from reaching the query builder as an arbitrary column.
 */
export const HISTORY_SORTS = [
  "orderNumber",
  "placedAt",
  "customerName",
  "type",
  "status",
  "paymentStatus",
  "total",
] as const;

export type HistorySort = (typeof HISTORY_SORTS)[number];

export type SortDirection = "asc" | "desc";

/**
 * Longer than any real name or dish; a cap keeps a pasted essay out of the LIKE.
 * The input enforces the same limit, so what the box holds and what the server
 * searched for can never disagree.
 */
export const HISTORY_SEARCH_MAX_LENGTH = 80;

export type HistoryStatus = "all" | RestoOrderStatus;

export type HistoryPreset = "today" | "7d" | "month" | "custom";

export const HISTORY_PRESETS: { key: HistoryPreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Custom" },
];

export const HISTORY_STATUSES: { key: HistoryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export type HistoryFilters = {
  preset: HistoryPreset;
  /** Inclusive start instant. */
  from: Date;
  /** Exclusive end instant. */
  to: Date;
  /** The yyyy-mm-dd strings the date inputs render, in restaurant time. */
  fromDate: string;
  toDate: string;
  status: HistoryStatus;
  menuItemId: string | null;
  /** Free-text search across order number, customer, mobile and dish names. */
  q: string;
  sort: HistorySort;
  dir: SortDirection;
  page: number;
  pageSize: number;
};

/**
 * The calendar date it currently is *at the restaurant*, as yyyy-mm-dd.
 *
 * Vercel runs the server in UTC, so reading the date off a bare Date would put
 * an IST restaurant five and a half hours behind its own clock — orders placed
 * late evening would be filed under tomorrow, which on a page an owner
 * reconciles takings against is a wrong number, not a cosmetic one.
 */
function todayInZone(timezone: string, now: Date = new Date()): string {
  // en-CA formats as yyyy-mm-dd, which is the format the date input wants.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(now);
}

/**
 * How far the named zone sits from UTC at a given instant, in minutes.
 *
 * Derived by formatting the instant in that zone and reading the clock back,
 * rather than hardcoding +5:30 — a restaurant may set any IANA zone, and some
 * of them observe DST.
 */
function zoneOffsetMinutes(timezone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return (asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000;
}

/** Midnight at the start of a yyyy-mm-dd calendar date in the given zone. */
function startOfDayInZone(date: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const naive = Date.UTC(year, month - 1, day);
  // Two passes: the first offset is read at the wrong instant when the guess
  // lands on the far side of a DST change, the second corrects it.
  const first = new Date(naive - zoneOffsetMinutes(timezone, new Date(naive)) * 60_000);
  return new Date(naive - zoneOffsetMinutes(timezone, first) * 60_000);
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function isCalendarDate(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parsePreset(value: string | undefined): HistoryPreset {
  return HISTORY_PRESETS.some((p) => p.key === value) ? (value as HistoryPreset) : "7d";
}

function parseStatus(value: string | undefined): HistoryStatus {
  return HISTORY_STATUSES.some((s) => s.key === value) ? (value as HistoryStatus) : "all";
}

function parseSort(value: string | undefined): HistorySort {
  return HISTORY_SORTS.includes(value as HistorySort) ? (value as HistorySort) : "placedAt";
}

function parseDir(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function parsePageSize(value: string | undefined): number {
  const size = Number(value);
  return HISTORY_PAGE_SIZES.includes(size) ? size : HISTORY_PAGE_SIZE;
}

export type HistorySearchParams = {
  preset?: string;
  from?: string;
  to?: string;
  status?: string;
  menuItemId?: string;
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
  pageSize?: string;
};

export function parseHistoryFilters(
  searchParams: HistorySearchParams,
  timezone: string
): HistoryFilters {
  const today = todayInZone(timezone);

  // An explicit from/to always means a custom range, even without ?preset=,
  // so a hand-built or shared link behaves the way it reads.
  const hasCustomDates = isCalendarDate(searchParams.from) || isCalendarDate(searchParams.to);
  const preset = hasCustomDates ? "custom" : parsePreset(searchParams.preset);

  let fromDate: string;
  let toDate: string;

  if (preset === "custom") {
    fromDate = isCalendarDate(searchParams.from) ? searchParams.from : today;
    toDate = isCalendarDate(searchParams.to) ? searchParams.to : today;
    // A backwards range is a slip, not an error worth blocking on.
    if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];
  } else if (preset === "today") {
    fromDate = today;
    toDate = today;
  } else if (preset === "month") {
    fromDate = `${today.slice(0, 7)}-01`;
    toDate = today;
  } else {
    fromDate = addDays(today, -6);
    toDate = today;
  }

  const pageRaw = Number(searchParams.page);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  return {
    preset,
    from: startOfDayInZone(fromDate, timezone),
    // Exclusive: the day after `toDate` starts, so the whole of `toDate` counts.
    to: startOfDayInZone(addDays(toDate, 1), timezone),
    fromDate,
    toDate,
    status: parseStatus(searchParams.status),
    menuItemId: searchParams.menuItemId || null,
    q: (searchParams.q ?? "").trim().slice(0, HISTORY_SEARCH_MAX_LENGTH),
    sort: parseSort(searchParams.sort),
    dir: parseDir(searchParams.dir),
    page,
    pageSize: parsePageSize(searchParams.pageSize),
  };
}

/**
 * The search box, as SQL.
 *
 * One box over four fields, because the person using it is holding one fact —
 * a number on a receipt, a name, the last digits of a phone, a dish someone is
 * disputing — and shouldn't have to say which kind of fact it is.
 */
function buildSearchWhere(term: string): Prisma.RestoOrderWhereInput | null {
  if (!term) return null;

  const or: Prisma.RestoOrderWhereInput[] = [
    { customerName: { contains: term, mode: "insensitive" } },
    { items: { some: { name: { contains: term, mode: "insensitive" } } } },
  ];

  // Mobiles are stored canonically as +91XXXXXXXXXX, so a search has to be
  // reduced to digits before it can match "98765 43210" as typed on the phone.
  const digits = term.replace(/\D/g, "");
  if (digits) {
    or.push({ customerMobile: { contains: digits } });

    // "#42", "42" and "Order 42" all mean order forty-two. Guarded against
    // int4 overflow, which Postgres would raise as an error rather than a miss.
    const orderNumber = Number(digits);
    if (Number.isSafeInteger(orderNumber) && orderNumber <= 2_147_483_647) {
      or.push({ orderNumber });
    }
  }

  return { OR: or };
}

export function buildHistoryWhere(
  restaurantId: string,
  filters: HistoryFilters
): Prisma.RestoOrderWhereInput {
  const search = buildSearchWhere(filters.q);

  return {
    restaurantId,
    placedAt: { gte: filters.from, lt: filters.to },
    // "all" means every status, cancelled included — the point of this view.
    ...(filters.status === "all" ? {} : { status: filters.status }),
    ...(filters.menuItemId ? { items: { some: { menuItemId: filters.menuItemId } } } : {}),
    // AND rather than spreading OR, so the search narrows the range instead of
    // colliding with the dish filter's own `items: { some: ... }` key.
    ...(search ? { AND: [search] } : {}),
  };
}

/**
 * Column sort, with a tie-break that keeps paging honest.
 *
 * Sorting by status alone leaves hundreds of rows in an order Postgres is free
 * to choose differently on each query, which is how a row shows up on page 2
 * and page 3 and never on page 1. orderNumber is unique per restaurant, so
 * appending it makes the sequence total.
 */
export function buildHistoryOrderBy(
  filters: HistoryFilters
): Prisma.RestoOrderOrderByWithRelationInput[] {
  const primary = { [filters.sort]: filters.dir } as Prisma.RestoOrderOrderByWithRelationInput;
  return filters.sort === "orderNumber" ? [primary] : [primary, { orderNumber: "desc" }];
}

/**
 * One CSV cell.
 *
 * Customer names and kitchen notes are free text a guest typed, and a value
 * starting with =, +, - or @ is treated as a formula by Excel and Sheets when
 * the file is opened — so `=1+1` as a name would evaluate, and worse payloads
 * exist. Prefixing with an apostrophe forces it back to text. Everything is
 * quoted, with inner quotes doubled, so commas and newlines can't shift the
 * column layout either.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

/** Rebuilds the query string, dropping empties so shared links stay readable. */
export function historyQuery(
  filters: HistoryFilters,
  overrides: Partial<Record<keyof HistorySearchParams, string | null>> = {}
): string {
  const base: Record<string, string> = {
    preset: filters.preset,
    status: filters.status,
    ...(filters.preset === "custom" ? { from: filters.fromDate, to: filters.toDate } : {}),
    ...(filters.menuItemId ? { menuItemId: filters.menuItemId } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    // Defaults stay out of the URL, so an untouched table still shares as a
    // clean link rather than one carrying every implicit setting.
    ...(filters.sort === "placedAt" && filters.dir === "desc"
      ? {}
      : { sort: filters.sort, dir: filters.dir }),
    ...(filters.pageSize === HISTORY_PAGE_SIZE ? {} : { pageSize: String(filters.pageSize) }),
    ...(filters.page > 1 ? { page: String(filters.page) } : {}),
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === "") delete base[key];
    else base[key] = value;
  }

  return new URLSearchParams(base).toString();
}
