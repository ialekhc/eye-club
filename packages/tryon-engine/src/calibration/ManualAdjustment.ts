import type { FrameTransform } from "../types";

/** Temporary customer corrections, independent of a merchant's saved calibration.
 * Translation is in screen-aligned eye-distance units; rotation is radians. */
export interface ManualAdjustment { x: number; y: number; scale: number; rotation: number }
export const AUTOMATIC_FIT: Readonly<ManualAdjustment> = Object.freeze({ x: 0, y: 0, scale: 1, rotation: 0 });

export function applyManualAdjustment(transform: FrameTransform, adjustment: ManualAdjustment, eyeDistance: number): FrameTransform {
  if (![adjustment.x, adjustment.y, adjustment.scale, adjustment.rotation, eyeDistance].every(Number.isFinite) || adjustment.scale <= 0 || eyeDistance <= 0) {
    throw new Error("Manual fitting adjustments must be finite with a positive scale.");
  }
  return {
    ...transform,
    position: { x: transform.position.x + adjustment.x * eyeDistance, y: transform.position.y + adjustment.y * eyeDistance },
    scale: transform.scale * adjustment.scale,
    rotation: transform.rotation + adjustment.rotation,
  };
}
