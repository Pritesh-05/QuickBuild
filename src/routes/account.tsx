import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, FolderOpen, Cpu, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { listBuilds, deleteBuild } from "@/lib/functions/builds.functions";
import { amIAdmin } from "@/lib/functions/catalog.functions";
import { LOAD_BUILD_HANDOFF_KEY } from "@/lib/shared-build-handoff";
import { currency } from "@/lib/format";

export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: builds, isLoading } = useQuery({
    queryKey: ["saved-builds"],
    queryFn: () => listBuilds(),
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => amIAdmin(),
  });

  async function handleDelete(id: string) {
    await deleteBuild({ data: id });
    toast.success("Build deleted");
    void queryClient.invalidateQueries({ queryKey: ["saved-builds"] });
  }

  function handleLoad(id: string) {
    // loadSavedBuild() can't be called here directly — this component's
    // useBuild() is its own isolated state, separate from the one
    // /build renders with (no shared Context between routes), so setting
    // build state on this instance right before unmounting for the
    // navigation just throws it away. Hand off the id via sessionStorage
    // instead (same one-shot pattern as the /share "Continue editing"
    // flow — see SHARED_HANDOFF_KEY) and let /build's own useBuild()
    // instance load it, in pages/build.tsx.
    sessionStorage.setItem(LOAD_BUILD_HANDOFF_KEY, id);
    void router.navigate({ to: "/build" });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-xl font-semibold tracking-[-0.03em]">{user?.displayName}'s builds</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/admin/parts"
            className="mono-label inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-brand transition-colors hover:bg-brand/15"
          >
            <ShieldCheck className="size-3.5" /> Manage parts catalog
          </Link>
          <Link
            to="/admin/users"
            className="mono-label inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-brand transition-colors hover:bg-brand/15"
          >
            <Users className="size-3.5" /> Manage users
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading your builds…</p>}

        {!isLoading && builds?.length === 0 && (
          <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
            <Cpu className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No saved builds yet.
              {!isAdmin && " Put one together and save it from the Builder."}
            </p>
            {!isAdmin && (
              <Link
                to="/build"
                className="mono-label mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Start Building
              </Link>
            )}
          </div>
        )}

        {builds?.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{b.name}</p>
              <p className="mono-label mt-0.5 text-muted-foreground">
                {b.partCount} parts · {currency(b.estimatedPrice)} · updated{" "}
                {new Date(b.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleLoad(b.id)}
                aria-label="Load build"
                className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
              >
                <FolderOpen className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(b.id)}
                aria-label="Delete build"
                className="inline-flex size-9 items-center justify-center rounded-md border border-border text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}