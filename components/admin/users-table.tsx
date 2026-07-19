"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  planName: string | null;
  planExpiresAt: string | null;
  cardViews: number;
  referralsMade: number;
};

type Column = { key: string; label: string; sortable: boolean };

const COLUMNS: Column[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "planName", label: "Plan", sortable: false },
  { key: "planExpiresAt", label: "Expires", sortable: true },
  { key: "cardViews", label: "Card views", sortable: false },
  { key: "referralsMade", label: "Referrals made", sortable: false },
];

const LIMIT = 20;

export function UsersTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sortBy,
        sortDir,
      });
      if (search) params.set("search", search);

      fetch(`/api/admin/users?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setUsers(data.users ?? []);
          setTotal(data.total ?? 0);
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [page, search, sortBy, sortDir, refreshKey]);

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-card pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(24,24,20,0.04),0_8px_20px_-12px_rgba(24,24,20,0.10)]">
        <Table>
          <TableHeader>
            <TableRow>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="py-8 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.planName ?? "—"}</TableCell>
                <TableCell>{user.planExpiresAt ? formatDate(user.planExpiresAt) : "—"}</TableCell>
                <TableCell>{user.cardViews}</TableCell>
                <TableCell>{user.referralsMade}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} users)
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
