import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { CategoryId, Part } from "@/data/types";

export type HitTestFn = (clientX: number, clientY: number) => CategoryId | null;
export type TouchDropFn = (part: Part, matched: boolean) => void;

interface TouchDragContextValue {
  draggingPart: Part | null;
  point: { x: number; y: number } | null;
  hoverCategory: CategoryId | null;
  hoverValid: boolean;
  start: (part: Part, x: number, y: number) => void;
  move: (x: number, y: number) => void;
  drop: (x: number, y: number) => void;
  cancel: () => void;
  /** Set by DragDropController once it's mounted inside the 3D scene, so
   * PartCard's pointer handlers never need to know anything about Three.js. */
  hitTestRef: RefObject<HitTestFn | null>;
  dropRef: RefObject<TouchDropFn | null>;
}

const TouchDragContext = createContext<TouchDragContextValue | null>(null);

// Fallback used on pages that render <Viewer> outside of build mode (home,
// compare) and never wrap it in a provider — dragging is a no-op there.
const noop = () => {};
const fallbackValue: TouchDragContextValue = {
  draggingPart: null,
  point: null,
  hoverCategory: null,
  hoverValid: false,
  start: noop,
  move: noop,
  drop: noop,
  cancel: noop,
  hitTestRef: { current: null },
  dropRef: { current: null },
};

/**
 * Native HTML5 drag-and-drop (used by mouse pointers) never fires on touch
 * devices, so touch/pen input gets this parallel pointer-events-based path
 * instead. Both paths end up calling the same onDropPart handler.
 */
export function TouchDragProvider({ children }: { children: ReactNode }) {
  const [draggingPart, setDraggingPart] = useState<Part | null>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoverCategory, setHoverCategory] = useState<CategoryId | null>(null);
  const [hoverValid, setHoverValid] = useState(false);
  const hitTestRef = useRef<HitTestFn | null>(null);
  const dropRef = useRef<TouchDropFn | null>(null);
  const activePart = useRef<Part | null>(null);

  const start = (part: Part, x: number, y: number) => {
    activePart.current = part;
    setDraggingPart(part);
    setPoint({ x, y });
  };

  const move = (x: number, y: number) => {
    setPoint({ x, y });
    const category = hitTestRef.current?.(x, y) ?? null;
    const valid = Boolean(
      category && activePart.current && category === activePart.current.category,
    );
    setHoverCategory(category);
    setHoverValid(valid);
  };

  const drop = (x: number, y: number) => {
    const category = hitTestRef.current?.(x, y) ?? null;
    const part = activePart.current;
    if (part && category) {
      dropRef.current?.(part, category === part.category);
    }
    activePart.current = null;
    setDraggingPart(null);
    setPoint(null);
    setHoverCategory(null);
    setHoverValid(false);
  };

  const cancel = () => {
    activePart.current = null;
    setDraggingPart(null);
    setPoint(null);
    setHoverCategory(null);
    setHoverValid(false);
  };

  const value = useMemo(
    () => ({
      draggingPart,
      point,
      hoverCategory,
      hoverValid,
      start,
      move,
      drop,
      cancel,
      hitTestRef,
      dropRef,
    }),

    [draggingPart, point, hoverCategory, hoverValid],
  );

  return <TouchDragContext.Provider value={value}>{children}</TouchDragContext.Provider>;
}

export function useTouchDrag() {
  const ctx = useContext(TouchDragContext);
  return ctx ?? fallbackValue;
}
