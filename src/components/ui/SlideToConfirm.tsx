import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { LuCheck, LuChevronRight } from "react-icons/lu";

type SlideToConfirmProps = {
  label: string;
  completedLabel?: string;
  disabled?: boolean;
  threshold?: number;
  resetAfter?: number;
  onConfirm: () => void | Promise<void>;
};

export function SlideToConfirm({
  label,
  completedLabel = "Terkonfirmasi",
  disabled = false,
  threshold = 0.9,
  resetAfter = 1200,
  onConfirm,
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const completingRef = useRef(false);
  const resetTimer = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completing, setCompleting] = useState(false);

  const setProgressValue = useCallback((value: number) => {
    const next = Math.max(0, Math.min(100, value));
    progressRef.current = next;
    setProgress(next);
  }, []);

  const updateFromPointer = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const bounds = trackRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setTrackWidth(bounds.width);
      const handleSize = 40;
      const travel = Math.max(1, bounds.width - handleSize - 8);
      setProgressValue(
        ((event.clientX - bounds.left - handleSize / 2 - 4) / travel) * 100,
      );
    },
    [setProgressValue],
  );

  const confirm = useCallback(async () => {
    if (disabled || completingRef.current) return;
    setProgressValue(100);
    completingRef.current = true;
    setCompleting(true);
    try {
      await onConfirm();
    } finally {
      resetTimer.current = window.setTimeout(() => {
        setProgressValue(0);
        completingRef.current = false;
        setCompleting(false);
      }, resetAfter);
    }
  }, [completing, disabled, onConfirm, resetAfter, setProgressValue]);

  const finishDrag = useCallback(() => {
    setDragging(false);
    if (progressRef.current >= threshold * 100) {
      void confirm();
    } else {
      setProgressValue(0);
    }
  }, [confirm, setProgressValue, threshold]);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || completing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromPointer(event);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    updateFromPointer(event);
    finishDrag();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || completing) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = Math.min(100, progressRef.current + 10);
      setProgressValue(next);
      if (next >= threshold * 100) void confirm();
    } else if (event.key === "ArrowLeft" || event.key === "Home") {
      event.preventDefault();
      setProgressValue(event.key === "Home" ? 0 : progressRef.current - 10);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void confirm();
    }
  }

  const labelText = completing ? completedLabel : label;

  return (
    <div
      ref={trackRef}
      className={`relative h-12 touch-none select-none overflow-hidden rounded-full border border-emerald-800/15 bg-slate-500 p-1 shadow-inner ${disabled || completing ? "opacity-60" : ""}`}
      role="group"
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-xs font-semibold text-white/90 sm:text-sm">
        {labelText}
      </span>
      <button
        type="button"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={
          completing ? completedLabel : `${Math.round(progress)}%`
        }
        aria-disabled={disabled || completing}
        disabled={disabled || completing}
        aria-label={label}
        className={`absolute top-1 z-10 grid size-10 place-items-center rounded-full bg-white text-emerald-800 shadow-md ring-1 ring-white/60 transition-[left,background-color] ${dragging ? "duration-0 scale-105 cursor-grabbing" : "duration-100 cursor-grab hover:bg-emerald-50"} disabled:cursor-not-allowed`}
        style={{
          left: `${4 + Math.max(0, trackWidth - 48) * (progress / 100)}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => {
          if (dragging) updateFromPointer(event);
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setDragging(false);
          setProgressValue(0);
        }}
        onKeyDown={handleKeyDown}
      >
        {completing ? (
          <LuCheck className="size-5" />
        ) : (
          <LuChevronRight className="size-5" />
        )}
      </button>
    </div>
  );
}
