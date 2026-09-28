import type { FaceGeometry, FrameCalibration, FrameTransform, Point, Size } from "../types";
import { FrameCalibrationEngine } from "../calibration/FrameCalibrationEngine";
import { assertPoint, midpoint } from "./FaceGeometryCalculator";

function rotate(point: Point, radians: number): Point {
  const c = Math.cos(radians), s = Math.sin(radians);
  return { x: point.x * c - point.y * s, y: point.x * s + point.y * c };
}

export class FrameTransformCalculator {
  constructor(private readonly calibrationEngine = new FrameCalibrationEngine()) {}

  calculate(face: FaceGeometry, calibration: FrameCalibration, assetSize: Size): FrameTransform {
    assertPoint(face.midpoint);
    if (!Number.isFinite(face.eyeDistance) || face.eyeDistance <= 0 || !Number.isFinite(face.roll)) {
      throw new Error("Invalid face geometry.");
    }
    const asset = this.calibrationEngine.resolve(calibration, assetSize);
    const scale = face.eyeDistance / asset.eyeDistance * calibration.scaleMultiplier;
    const rotation = face.roll - asset.angle + calibration.rotationOffset;
    const assetMidpoint = midpoint(asset.left, asset.right);
    // Pivot around the calibrated bridge while matching the two eye midpoints.
    // Subtracting the asset's own angle also supports tilted product photography.
    const bridgeVector = rotate({ x: (asset.bridge.x - assetMidpoint.x) * scale,
      y: (asset.bridge.y - assetMidpoint.y) * scale }, rotation);
    const offset = rotate({ x: calibration.offsetX * face.eyeDistance,
      y: calibration.offsetY * face.eyeDistance }, face.roll);
    return { scale, rotation, pivot: asset.bridge,
      position: { x: face.midpoint.x + bridgeVector.x + offset.x,
        y: face.midpoint.y + bridgeVector.y + offset.y } };
  }
}

/** Maps an original asset pixel into photo coordinates; also useful to other renderers. */
export function transformPoint(point: Point, transform: FrameTransform): Point {
  const rotated = rotate({ x: (point.x - transform.pivot.x) * transform.scale,
    y: (point.y - transform.pivot.y) * transform.scale }, transform.rotation);
  return { x: rotated.x + transform.position.x, y: rotated.y + transform.position.y };
}
