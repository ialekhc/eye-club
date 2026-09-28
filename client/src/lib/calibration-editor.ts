import type { FrameCalibration, Point } from "@eyewear/tryon-engine";

export type AnchorName = "left" | "right" | "bridge";
export const ANCHORS = [
  { key: "left", label: "Left eye", x: "leftAnchorX", y: "leftAnchorY", color: "#176c9c" },
  { key: "right", label: "Right eye", x: "rightAnchorX", y: "rightAnchorY", color: "#aa3b62" },
  { key: "bridge", label: "Bridge", x: "bridgeX", y: "bridgeY", color: "#98650a" },
] as const;

/** The editor canvas has the asset's exact aspect ratio with no internal padding. */
export function editorPoint(client: Point, rect: { left: number; top: number; width: number; height: number }): Point {
  if (![client.x, client.y, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
    throw new Error("Invalid calibration canvas dimensions.");
  }
  return { x: Math.min(1, Math.max(0, (client.x - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (client.y - rect.top) / rect.height)) };
}

export function moveAnchor(calibration: FrameCalibration, anchor: AnchorName, point: Point): FrameCalibration {
  const fields = ANCHORS.find((item) => item.key === anchor)!;
  return { ...calibration, [fields.x]: point.x, [fields.y]: point.y };
}
