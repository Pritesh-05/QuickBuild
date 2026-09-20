import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from "react";
import { Box, MousePointer2, Move, X } from "lucide-react";
import { useBuild } from "@/hooks/use-build";
import { Viewer } from "@/components/three/viewer";

export const Route = createFileRoute('/free-view')({
  component: FreeViewPage,
});

function FreeViewPage() {
  const { build } = useBuild();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void router.navigate({ to: "/build" as any });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-[#030305]">
      <Viewer
        mode="build"
        build={build}
        freeView={true}
        className="h-full w-full rounded-none border-0 bg-transparent"
      />

      {/* Top Left Instruction Panel */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 flex w-72 flex-col gap-4 rounded-xl border border-white/10 bg-[#0a0a0f]/80 p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
            <Box className="size-4 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-white">Free View Mode</h2>
            <p className="text-[11px] text-white/60">Explore your build from any angle</p>
          </div>
        </div>
        <div className="h-px bg-white/10" />
        <ul className="flex flex-col gap-3 text-[11px] font-medium tracking-wide text-white/70">
          <li className="flex items-center gap-3">
            <MousePointer2 className="size-3.5 opacity-60" /> Drag to rotate
          </li>
          <li className="flex items-center gap-3">
            <Move className="size-3.5 opacity-60" /> Scroll to zoom
          </li>
          <li className="flex items-center gap-3">
            <MousePointer2 className="size-3.5 opacity-60" /> Right click to pan
          </li>
        </ul>
      </div>

      {/* Bottom Center ESC Button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-12 z-10 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0a0a0f]/80 px-6 py-3 shadow-2xl backdrop-blur-md">
          <X className="size-3.5 text-white/60" />
          <span className="mono-label text-[10px] tracking-widest text-white/60">
            PRESS ESC TO EXIT
          </span>
        </div>
      </div>
    </div>
  );
}