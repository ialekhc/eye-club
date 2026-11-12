"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { FrameCalibration, Point } from "@eyewear/tryon-engine";
import type { LoadedFrame } from "@/lib/frame-schema";
import { ANCHORS, editorPoint, type AnchorName } from "@/lib/calibration-editor";

interface Props {
  frame: LoadedFrame;
  calibration: FrameCalibration;
  active: AnchorName;
  confirmed: Record<AnchorName, boolean>;
  onMove: (anchor: AnchorName, point: Point) => void;
  onSelect: (anchor: AnchorName) => void;
}

export function AnchorCanvas({ frame, calibration, active, confirmed, onMove, onSelect }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<AnchorName | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = frame.width; canvas.height = frame.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(frame.image, 0, 0);
    const radius = Math.max(frame.width / 70, 5);
    for (const anchor of ANCHORS) {
      const x = calibration[anchor.x] * frame.width, y = calibration[anchor.y] * frame.height;
      context.strokeStyle = anchor.color; context.lineWidth = radius / 4;
      context.setLineDash(confirmed[anchor.key] ? [] : [radius / 2, radius / 2]);
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.stroke();
      context.setLineDash([]);
      context.beginPath(); context.moveTo(x - radius * 1.5, y); context.lineTo(x + radius * 1.5, y);
      context.moveTo(x, y - radius * 1.5); context.lineTo(x, y + radius * 1.5); context.stroke();
      if (anchor.key === active) { context.beginPath(); context.arc(x, y, radius * 1.65, 0, Math.PI * 2); context.stroke(); }
    }
  }, [frame, calibration, active, confirmed]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => editorPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
  const down = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = point(event);
    const rect = event.currentTarget.getBoundingClientRect();
    const nearest = ANCHORS.find((anchor) => Math.hypot((calibration[anchor.x] - position.x) * rect.width, (calibration[anchor.y] - position.y) * rect.height) < 18);
    const selected = nearest?.key ?? active;
    dragging.current = selected; onSelect(selected); onMove(selected, position);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const keyboard = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const anchor = ANCHORS.find((item) => item.key === active)!;
    const step = event.shiftKey ? .01 : .001;
    onMove(active, { x: Math.max(0, Math.min(1, calibration[anchor.x] + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0))),
      y: Math.max(0, Math.min(1, calibration[anchor.y] + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0))) });
  };

  return <canvas ref={ref} tabIndex={0} aria-label={`Frame calibration canvas. Selected anchor: ${active}. Use arrow keys to move it.`}
    className="anchor-canvas" onKeyDown={keyboard} onPointerDown={down}
    onPointerMove={(event) => { if (dragging.current) onMove(dragging.current, point(event)); }}
    onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }} />;
}
