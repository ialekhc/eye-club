import type { FaceGeometry, Landmark, Point, Size } from "../types";

export function assertSize(size: Size): void {
  if (![size.width, size.height].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error("Image dimensions must be finite and positive.");
  }
}
export function assertPoint(point: Point): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error("Coordinates must be finite.");
}
export function distance(a: Point, b: Point): number {
  assertPoint(a); assertPoint(b);
  return Math.hypot(b.x - a.x, b.y - a.y);
}
export function midpoint(a: Point, b: Point): Point {
  assertPoint(a); assertPoint(b);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
export function angle(a: Point, b: Point): number {
  if (distance(a, b) < 1e-8) throw new Error("Eye anchors must be distinct.");
  return Math.atan2(b.y - a.y, b.x - a.x);
}
export function normalize(point: Point, size: Size): Point {
  assertSize(size); assertPoint(point);
  return { x: point.x / size.width, y: point.y / size.height };
}
export function denormalize(point: Point, size: Size): Point {
  assertSize(size); assertPoint(point);
  return { x: point.x * size.width, y: point.y * size.height };
}

export class FaceGeometryCalculator {
  calculate(landmarks: readonly Landmark[], size: Size): FaceGeometry {
    assertSize(size);
    const point = (index: number): Point => {
      const landmark = landmarks[index];
      if (!landmark) throw new Error("Face landmarks are incomplete. Please try another photo.");
      return denormalize(landmark, size);
    };
    // MediaPipe iris centers: 468 and 473. Sort in image space, not anatomical
    // left/right, to avoid mirroring. Compute angles in pixels, not normalized
    // coordinates: x/y have different scales on non-square photographs.
    const a = point(468), b = point(473);
    const [leftEye, rightEye] = a.x < b.x ? [a, b] : [b, a];
    const eyeDistance = distance(leftEye, rightEye);
    if (eyeDistance < 8) throw new Error("Your face is too small. Please use a closer, clear frontal photo.");
    return {
      leftEye, rightEye, eyeDistance,
      midpoint: midpoint(leftEye, rightEye),
      roll: angle(leftEye, rightEye),
      noseBridge: point(168),
      faceWidth: distance(point(234), point(454)),
    };
  }
}
