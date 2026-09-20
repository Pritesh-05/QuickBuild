import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { PencilLine } from "lucide-react";
import { getSharedBuild } from "@/lib/functions/shared-builds.functions";
import { BuildReviewPanel } from "@/components/build/build-review";
import { SHARED_HANDOFF_KEY } from "@/lib/shared-build-handoff";

export const Route = createFileRoute("/share/$id")({
  loader: async ({ params }) => {
    const shared = await getSharedBuild({ data: params.id });
    if (!shared) throw notFound();
    return shared;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Shared QuickBuild` },
          {
            name: "description",
            content: `A PC build shared from QuickBuild: ${loaderData.name}.`,
          },
          { property: "og:title", content: `${loaderData.name} — Shared QuickBuild` },
        ]
      : [{ title: "Shared build — QuickBuild" }],
  }),
  notFoundComponent: SharedBuildNotFound,
  component: SharedBuildPage,
});

function SharedBuildNotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center sm:px-8">
      <p className="mono-label text-muted-foreground">shared build</p>
      <h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
        This link doesn't lead anywhere
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The build may have been removed, or the link is incomplete.
      </p>
      <Link
        to="/"
        className="mono-label mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go to QuickBuild
      </Link>
    </div>
  );
}

function SharedBuildPage() {
  const shared = Route.useLoaderData();
  const router = useRouter();

  function handleContinueEditing() {
    sessionStorage.setItem(SHARED_HANDOFF_KEY, JSON.stringify(shared.build));
    void router.navigate({ to: "/build" });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="mono-label text-muted-foreground">shared build</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
        {shared.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Shared on {new Date(shared.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleContinueEditing}
          className="mono-label inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PencilLine className="size-3.5" /> Continue editing this build
        </button>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Opens it in the builder as your own copy — the original link stays unchanged.
        </p>
      </div>

      <div className="mt-8 border border-border bg-card p-5">
        <BuildReviewPanel build={shared.build} buildName={shared.name} variant="public" />
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="mono-label inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Build your own in QuickBuild
        </Link>
      </div>
    </div>
  );
}
