import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";

const BuildCharacterScene = lazy(() =>
  import("./build-character-scene").then((m) => ({ default: m.BuildCharacterScene })),
);

/** Quiet stand-in used during SSR, before mount, while the chunk/model loads,
 * and if WebGL or the GLB fails outright. The review panel is text-first —
 * losing the mascot should never lose the score, verdict or share buttons. */
function CharacterFallback({ accent }: { accent: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden>
      <span
        className="size-10 animate-pulse rounded-full"
        style={{ backgroundColor: accent, opacity: 0.25 }}
      />
    </div>
  );
}

/** Keeps a broken mascot from taking the whole route's errorComponent with it. */
class CharacterBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("[build-character] 3D mascot failed to render:", error);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface BuildCharacterProps {
  accent?: string;
  speaking?: boolean;
}

/** Client-only wrapper: three.js is never imported during SSR, and the canvas
 * always renders underneath a Suspense boundary. */
export function BuildCharacter({ accent = "#2f6fe8", speaking = false }: BuildCharacterProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <CharacterFallback accent={accent} />;

  return (
    <CharacterBoundary fallback={<CharacterFallback accent={accent} />}>
      <Suspense fallback={<CharacterFallback accent={accent} />}>
        <BuildCharacterScene accent={accent} speaking={speaking} />
      </Suspense>
    </CharacterBoundary>
  );
}