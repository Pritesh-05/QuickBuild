import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useRouteContext } from "@tanstack/react-router";
import { adminDeleteUser, adminListUsers, adminSetUserRole } from "@/lib/functions/admin-users.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

type SortKey = "joined" | "builds";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mono-label ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i} className="border-b border-border/60">
          <td className="py-3 pr-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-accent" />
            <div className="mt-1.5 h-3 w-40 animate-pulse rounded bg-accent/60" />
          </td>
          <td className="py-3 pl-4">
            <div className="ml-auto h-3 w-16 animate-pulse rounded bg-accent" />
          </td>
          <td className="py-3 pl-4">
            <div className="ml-auto h-3 w-6 animate-pulse rounded bg-accent" />
          </td>
          <td className="py-3 pl-4">
            <div className="h-3 w-14 animate-pulse rounded bg-accent" />
          </td>
          <td className="py-3 pl-4" />
        </tr>
      ))}
    </>
  );
}

function AdminUsersPage() {
  const { user: me } = useRouteContext({ from: "__root__" });
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
  });
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function toggleAdmin(email: string, makeAdmin: boolean) {
    if (
      !makeAdmin &&
      !window.confirm(`Remove admin access for ${email}? They'll lose access to this console.`)
    )
      return;
    try {
      await adminSetUserRole({ data: { email, makeAdmin } });
      toast.success(makeAdmin ? "Admin access granted" : "Admin access removed");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update access");
    }
  }

  async function deleteUser(id: string, email: string, buildCount: number) {
    const buildNote =
      buildCount > 0 ? ` and ${buildCount} saved build${buildCount === 1 ? "" : "s"}` : "";
    if (!window.confirm(`Permanently delete ${email}${buildNote}? This can't be undone.`)) return;
    try {
      await adminDeleteUser({ data: id });
      toast.success("User deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete user");
    }
  }

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (users ?? []).filter(
      (u) =>
        !q || u.email.toLowerCase().includes(q) || (u.displayName ?? "").toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      const cmp =
        sortKey === "joined"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : a.buildCount - b.buildCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, search, sortKey, sortDir]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.03em]">Users</h1>
          <p className="mono-label mt-1 text-muted-foreground">
            {isLoading
              ? "loading —"
              : `${visibleUsers.length}${visibleUsers.length !== (users?.length ?? 0) ? ` of ${users?.length}` : ""} accounts`}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-48 rounded-md border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="mono-label py-2 text-left font-normal">User</th>
              <th className="py-2 pl-4 text-right font-normal">
                <SortHeader
                  label="Joined"
                  active={sortKey === "joined"}
                  dir={sortDir}
                  onClick={() => toggleSort("joined")}
                />
              </th>
              <th className="py-2 pl-4 text-right font-normal">
                <SortHeader
                  label="Builds"
                  active={sortKey === "builds"}
                  dir={sortDir}
                  onClick={() => toggleSort("builds")}
                />
              </th>
              <th className="mono-label py-2 pl-4 text-left font-normal">Role</th>
              <th className="w-[220px] py-2 pl-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : (
              visibleUsers.map((row) => {
                const isSelf = row.email === me?.email;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 transition-colors hover:bg-accent/40"
                  >
                    <td className="max-w-0 py-2.5 pr-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.displayName ?? row.email.split("@")[0]}
                      </p>
                      <p className="mono-data truncate text-[11px] text-muted-foreground">
                        {row.email}
                      </p>
                    </td>
                    <td className="mono-data whitespace-nowrap py-2.5 pl-4 text-right text-[11px] text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="mono-data whitespace-nowrap py-2.5 pl-4 text-right text-[12px] text-foreground">
                      {row.buildCount}
                    </td>
                    <td className="py-2.5 pl-4">
                      <span
                        className={
                          row.isAdmin
                            ? "mono-label inline-flex items-center gap-1.5 text-brand"
                            : "mono-label text-muted-foreground"
                        }
                      >
                        {row.isAdmin ? <ShieldCheck className="size-3.5" /> : null}
                        {row.isAdmin ? "admin" : "builder"}
                      </span>
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.isAdmin ? (
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => void toggleAdmin(row.email, false)}
                            title={isSelf ? "You can't remove your own admin access" : undefined}
                            className="mono-label inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <ShieldOff className="size-3.5" />
                            Revoke
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void toggleAdmin(row.email, true)}
                            className="mono-label inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-foreground transition-colors hover:bg-accent"
                          >
                            <ShieldCheck className="size-3.5" />
                            Make admin
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => void deleteUser(row.id, row.email, row.buildCount)}
                          title={isSelf ? "You can't delete your own account here" : undefined}
                          aria-label="Delete user"
                          className="inline-flex size-8 items-center justify-center rounded-md border border-danger/30 text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && visibleUsers.length === 0 ? (
        <p className="mono-label py-8 text-center text-muted-foreground">
          {search ? `No accounts match "${search}".` : "No accounts yet."}
        </p>
      ) : null}
    </div>
  );
}