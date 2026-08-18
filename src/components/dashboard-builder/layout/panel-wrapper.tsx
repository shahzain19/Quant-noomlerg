"use client";

import { useRef, useState, useCallback } from "react";
import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";
import { useLayout } from "./layout-context";
import { cn } from "@/lib/utils";

export function PanelWrapper({
  id,
  title,
  icon,
  children,
  onRemove,
  minimized,
  onToggleMinimize,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onRemove: () => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}) {
  const { movePanel, getPixelLayout, colW, rowH, gap, cols } = useLayout();
  const layout = getPixelLayout().get(id);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startLayout = getPixelLayout().get(id);
      if (!startLayout || colW <= 0) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = startLayout.left;
      const startTop = startLayout.top;
      setDragging(true);

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newLeft = startLeft + dx;
        const newTop = startTop + dy;
        const gx = Math.round(newLeft / (colW + gap));
        const gy = Math.round(newTop / (rowH + gap));
        movePanel(id, Math.max(0, gx), Math.max(0, gy));
      };

      const onUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [id, getPixelLayout, colW, rowH, gap, movePanel]
  );

  if (!layout) return null;

  return (
    <div
      className={cn(
        "absolute border border-zinc-800 bg-zinc-950 rounded flex flex-col overflow-hidden",
        dragging ? "shadow-2xl shadow-black/60 border-zinc-500 z-50" : "hover:border-zinc-700 transition-colors"
      )}
      style={{
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
      }}
    >
      <div
        onMouseDown={handleDragStart}
        className="flex items-center gap-1.5 px-2 py-1.5 border-b border-zinc-800 bg-zinc-900/80 cursor-grab active:cursor-grabbing shrink-0 select-none"
      >
        <GripVertical size={12} className="text-zinc-600 shrink-0" />
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate flex-1">
          {title}
        </span>
        {onToggleMinimize && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
          title="Remove panel"
        >
          <X size={10} />
        </button>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {minimized ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-[10px]">
            Click expand to show
          </div>
        ) : (
          children
        )}
      </div>
      <ResizeHandle id={id} />
    </div>
  );
}

function ResizeHandle({ id }: { id: string }) {
  const { resizePanel, getPixelLayout, colW, rowH, gap, cols } = useLayout();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startLayout = getPixelLayout().get(id);
      if (!startLayout || colW <= 0) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = startLayout.width;
      const startH = startLayout.height;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newGridW = Math.round((startW + dx) / (colW + gap));
        const newGridH = Math.round((startH + dy) / (rowH + gap));
        resizePanel(id, Math.max(2, newGridW), Math.max(1, newGridH));
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [id, getPixelLayout, colW, rowH, gap, cols, resizePanel]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize group z-10"
    >
      <svg
        className="absolute bottom-1 right-1 text-zinc-600 group-hover:text-zinc-400 transition-colors"
        width="8"
        height="8"
        viewBox="0 0 8 8"
      >
        <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}
