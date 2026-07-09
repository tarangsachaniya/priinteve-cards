"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  Download,
  History,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Power,
  PowerOff,
  Trash2,
  CalendarDays,
  Images,
  ListChecks,
  Users,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { PlanForm, type PlanFormValues, EMPTY_PLAN_VALUES } from "@/components/admin/plan-form";
import { PlanDeleteDialog, type DeletablePlan } from "@/components/admin/plan-delete-dialog";
import { PlanAuditLogSheet } from "@/components/admin/plan-audit-log-sheet";
import { PlanStatsCards, type PlanStats } from "@/components/admin/plan-stats-cards";
import { PLAN_FEATURE_LABELS } from "@/lib/constants/plan-features";
import { formatCurrency } from "@/lib/format";

type AdminPlan = PlanFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
  subscriberCount: number;
  purchaseCount: number;
};

type Column = { key: string; label: string; sortable: boolean };

const COLUMNS: Column[] = [
  { key: "name", label: "Plan Name", sortable: true },
  { key: "cardType", label: "Card Type", sortable: false },
  { key: "price", label: "Price", sortable: true },
  { key: "validityDays", label: "Validity", sortable: true },
  { key: "maxGalleryImages", label: "Gallery Limit", sortable: false },
  { key: "featuresJson", label: "Features", sortable: false },
  { key: "subscriberCount", label: "Active Users", sortable: false },
  { key: "isActive", label: "Status", sortable: false },
  { key: "updatedAt", label: "Last Updated", sortable: true },
];

const CARD_TYPE_LABEL: Record<string, string> = { NFC: "NFC", QR: "QR", BOTH: "NFC + QR" };
const CARD_TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  NFC: "outline",
  QR: "secondary",
  BOTH: "default",
};

const LIMIT = 10;

function statusOf(plan: AdminPlan): "draft" | "active" | "disabled" {
  if (plan.isDraft) return "draft";
  return plan.isActive ? "active" : "disabled";
}

function planToDeletable(plan: AdminPlan): DeletablePlan {
  return {
    id: plan.id,
    name: plan.name,
    subscriberCount: plan.subscriberCount,
    purchaseCount: plan.purchaseCount,
  };
}

function toCsvValue(value: string | number | boolean) {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const CSV_COLUMNS: (keyof AdminPlan)[] = [
  "name",
  "cardType",
  "price",
  "validityDays",
  "featuresJson",
  "maxGalleryImages",
  "maxVideos",
  "maxPdfs",
  "storageLimitMb",
  "isActive",
  "isDraft",
  "recommended",
];

function plansToCsv(plans: AdminPlan[]) {
  const header = CSV_COLUMNS.join(",");
  const rows = plans.map((plan) =>
    CSV_COLUMNS.map((col) => {
      const value = plan[col];
      if (col === "featuresJson" && Array.isArray(value)) {
        return toCsvValue(value.join(";"));
      }
      return toCsvValue(value as string | number | boolean);
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  const header = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]));
  });
}

function csvRowToPayload(row: Record<string, string>) {
  return {
    name: row.name,
    cardType: row.cardType,
    price: Number(row.price) || 0,
    validityDays: Number(row.validityDays) || 1,
    featuresJson: row.featuresJson ? row.featuresJson.split(";").filter(Boolean) : [],
    maxGalleryImages: Number(row.maxGalleryImages) || 0,
    maxVideos: Number(row.maxVideos) || 0,
    maxPdfs: Number(row.maxPdfs) || 0,
    storageLimitMb: Number(row.storageLimitMb) || 0,
    isActive: row.isActive === "true",
    isDraft: row.isDraft === "true",
    recommended: row.recommended === "true",
  };
}

export function PlansTable() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [cardType, setCardType] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitialValues, setFormInitialValues] = useState<PlanFormValues | undefined>(undefined);
  const [formPlanId, setFormPlanId] = useState<string | undefined>(undefined);
  const [formDuplicateOf, setFormDuplicateOf] = useState<string | undefined>(undefined);

  const [deleteTarget, setDeleteTarget] = useState<DeletablePlan | null>(null);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlans = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      sortBy,
      sortDir,
      status,
      cardType,
    });
    if (search) params.set("search", search);

    return fetch(`/api/admin/plans?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPlans(data.plans ?? []);
        setTotal(data.total ?? 0);
        setStats(data.stats ?? null);
      })
      .finally(() => setIsLoading(false));
  }, [page, search, status, cardType, sortBy, sortDir]);

  useEffect(() => {
    const handle = setTimeout(fetchPlans, 300);
    return () => clearTimeout(handle);
  }, [fetchPlans]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (isTyping) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "c") {
        e.preventDefault();
        openCreate();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function openCreate() {
    setFormMode("create");
    setFormInitialValues(EMPTY_PLAN_VALUES);
    setFormPlanId(undefined);
    setFormDuplicateOf(undefined);
    setFormOpen(true);
  }

  function openEdit(plan: AdminPlan) {
    setFormMode("edit");
    setFormInitialValues(planToFormValues(plan));
    setFormPlanId(plan.id);
    setFormDuplicateOf(undefined);
    setFormOpen(true);
  }

  function openDuplicate(plan: AdminPlan) {
    setFormMode("create");
    setFormInitialValues({
      ...planToFormValues(plan),
      name: `${plan.name} (Copy)`,
      isDraft: true,
      isActive: false,
    });
    setFormPlanId(undefined);
    setFormDuplicateOf(plan.id);
    setFormOpen(true);
  }

  function planToFormValues(plan: AdminPlan): PlanFormValues {
    return {
      name: plan.name,
      cardType: plan.cardType,
      price: plan.price,
      validityDays: plan.validityDays,
      featuresJson: Array.isArray(plan.featuresJson) ? plan.featuresJson : [],
      maxGalleryImages: plan.maxGalleryImages,
      maxVideos: plan.maxVideos,
      maxPdfs: plan.maxPdfs,
      storageLimitMb: plan.storageLimitMb,
      isActive: plan.isActive,
      isDraft: plan.isDraft,
      recommended: plan.recommended,
    };
  }

  async function toggleActive(plan: AdminPlan) {
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive, isDraft: false }),
    });
    if (!res.ok) {
      toast.error("Could not update plan status");
      return;
    }
    toast.success(plan.isActive ? "Plan disabled" : "Plan enabled");
    fetchPlans();
  }

  async function handleDisableInstead(planId: string) {
    setDeleteTarget(null);
    const res = await fetch(`/api/admin/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false, isDraft: false }),
    });
    if (!res.ok) {
      toast.error("Could not disable plan");
      return;
    }
    toast.success("Plan disabled");
    fetchPlans();
  }

  async function bulkSetActive(active: boolean) {
    const ids = Array.from(selectedIds);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/plans/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: active, isDraft: false }),
        })
      )
    );
    const failed = results.filter((r) => !r.ok).length;
    toast[failed > 0 ? "error" : "success"](
      `${ids.length - failed} plan(s) ${active ? "enabled" : "disabled"}${failed ? `, ${failed} failed` : ""}`
    );
    setSelectedIds(new Set());
    fetchPlans();
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(plans.map((p) => p.id)) : new Set());
  }

  function toggleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleExport(scope: "page" | "all") {
    let exportPlans = plans;
    if (scope === "all") {
      const params = new URLSearchParams({ page: "1", limit: "1000", sortBy, sortDir, status, cardType });
      if (search) params.set("search", search);
      const data = await fetch(`/api/admin/plans?${params.toString()}`).then((r) => r.json());
      exportPlans = data.plans ?? [];
    }

    const csv = plansToCsv(exportPlans);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plans-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text).map(csvRowToPayload);
      const res = await fetch("/api/admin/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.created > 0) {
        toast.success(`${data.created} plan(s) created${data.failed ? `, ${data.failed} failed` : ""}`);
      } else {
        toast.error(`Import failed for all ${data.failed} row(s)`);
      }
      fetchPlans();
    } finally {
      setIsImporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const hasFilters = Boolean(search) || status !== "all" || cardType !== "all";

  return (
    <div className="flex flex-col gap-5">
      <PlanStatsCards stats={stats} isLoading={isLoading && plans.length === 0} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search plans…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56 pl-8"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              if (!v) return;
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={cardType}
            onValueChange={(v) => {
              if (!v) return;
              setCardType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Card type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All card types</SelectItem>
              <SelectItem value="NFC">NFC</SelectItem>
              <SelectItem value="QR">QR</SelectItem>
              <SelectItem value="BOTH">NFC + QR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAuditLogOpen(true)}>
            <History /> Activity Log
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload /> Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => handleExport("all")}>
            <Download /> Export
          </Button>
          <Button type="button" size="sm" onClick={openCreate} className="hidden sm:inline-flex">
            <Plus /> Create Plan
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
          <p className="text-sm font-medium">{selectedIds.size} selected</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => bulkSetActive(true)}>
              Enable selected
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => bulkSetActive(false)}>
              Disable selected
            </Button>
          </div>
        </div>
      )}

      <div className="hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={plans.length > 0 && selectedIds.size === plans.length}
                  onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                />
              </TableHead>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? "cursor-pointer select-none" : undefined}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && sortBy === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={COLUMNS.length + 2}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 2} className="py-10 text-center">
                  <p className="text-sm font-medium">
                    {hasFilters ? "No plans match your filters." : "No plans yet."}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasFilters ? "Try adjusting your search or filters." : "Create your first plan to get started."}
                  </p>
                  <div className="mt-3">
                    {hasFilters ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setStatus("all");
                          setCardType("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button type="button" size="sm" onClick={openCreate}>
                        <Plus /> Create Plan
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              plans.map((plan) => {
                const features = Array.isArray(plan.featuresJson) ? plan.featuresJson : [];
                const s = statusOf(plan);
                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(plan.id)}
                        onCheckedChange={(checked) => toggleSelectOne(plan.id, Boolean(checked))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1.5">
                        {plan.name}
                        {plan.recommended && (
                          <Tooltip>
                            <TooltipTrigger render={<Star className="size-3.5 fill-primary text-primary" />} />
                            <TooltipContent>Recommended</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={CARD_TYPE_VARIANT[plan.cardType]}>
                        {CARD_TYPE_LABEL[plan.cardType] ?? plan.cardType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(plan.price)}</span>
                      <span className="block text-xs text-muted-foreground">/{plan.validityDays >= 365 ? "year" : "cycle"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <CalendarDays className="size-3.5 text-muted-foreground" />
                        {plan.validityDays} Days
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Images className="size-3.5 text-muted-foreground" />
                        {plan.maxGalleryImages}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="flex items-center gap-1 text-sm">
                              <ListChecks className="size-3.5 text-muted-foreground" />
                              {features.length} Features
                            </span>
                          }
                        />
                        <TooltipContent>
                          {features.length > 0
                            ? features.map((f) => PLAN_FEATURE_LABELS[f] ?? f).join(", ")
                            : "No features"}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Users className="size-3.5 text-muted-foreground" />
                        {plan.subscriberCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s === "active" ? "default" : s === "draft" ? "secondary" : "outline"}>
                        {s === "active" ? "Active" : s === "draft" ? "Draft" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(plan.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button type="button" variant="ghost" size="icon-sm">
                              <MoreVertical />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(plan)}>
                            <Eye /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(plan)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDuplicate(plan)}>
                            <Copy /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(plan)}>
                            {plan.isActive ? <PowerOff /> : <Power />}
                            {plan.isActive ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(planToDeletable(plan))}
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}

        {!isLoading && plans.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm font-medium">{hasFilters ? "No plans match your filters." : "No plans yet."}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          plans.map((plan) => {
            const s = statusOf(plan);
            return (
              <Card key={plan.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 font-medium">
                        {plan.name}
                        {plan.recommended && <Star className="size-3.5 fill-primary text-primary" />}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant={CARD_TYPE_VARIANT[plan.cardType]}>
                          {CARD_TYPE_LABEL[plan.cardType]}
                        </Badge>
                        <Badge variant={s === "active" ? "default" : s === "draft" ? "secondary" : "outline"}>
                          {s === "active" ? "Active" : s === "draft" ? "Draft" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button type="button" variant="ghost" size="icon-sm">
                            <MoreVertical />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(plan)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDuplicate(plan)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(plan)}>
                          {plan.isActive ? <PowerOff /> : <Power />}
                          {plan.isActive ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(planToDeletable(plan))}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">{formatCurrency(plan.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Validity</p>
                      <p className="font-medium">{plan.validityDays} Days</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gallery Limit</p>
                      <p className="font-medium">{plan.maxGalleryImages} Images</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subscribers</p>
                      <p className="font-medium">{plan.subscriberCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {!isLoading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} plans)
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Button
        type="button"
        size="icon-lg"
        onClick={openCreate}
        className="fixed right-5 bottom-5 z-40 rounded-full shadow-lg md:hidden"
        aria-label="Create plan"
      >
        <Plus />
      </Button>

      <PlanForm
        mode={formMode}
        planId={formPlanId}
        initialValues={formInitialValues}
        duplicateOf={formDuplicateOf}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={fetchPlans}
      />

      <PlanDeleteDialog
        plan={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={fetchPlans}
        onDisableInstead={handleDisableInstead}
      />

      <PlanAuditLogSheet open={auditLogOpen} onOpenChange={setAuditLogOpen} />
    </div>
  );
}
