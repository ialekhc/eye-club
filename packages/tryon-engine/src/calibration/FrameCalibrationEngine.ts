import type { FrameCalibration, Size } from "../types";
import { angle, denormalize, distance } from "../geometry/FaceGeometryCalculator";

export class FrameCalibrationEngine {
  resolve(calibration: FrameCalibration, size: Size) {
    const anchors = [calibration.leftAnchorX, calibration.leftAnchorY, calibration.rightAnchorX,
      calibration.rightAnchorY, calibration.bridgeX, calibration.bridgeY];
    if (!anchors.every((n) => Number.isFinite(n) && n >= 0 && n <= 1)) {
      throw new Error("Calibration anchors must be normalized between 0 and 1.");
    }
    if (!Number.isFinite(calibration.scaleMultiplier) || calibration.scaleMultiplier <= 0 ||
      ![calibration.offsetX, calibration.offsetY, calibration.rotationOffset].every(Number.isFinite)) {
      throw new Error("Frame calibration contains invalid adjustments.");
    }
    const left = denormalize({ x: calibration.leftAnchorX, y: calibration.leftAnchorY }, size);
    const right = denormalize({ x: calibration.rightAnchorX, y: calibration.rightAnchorY }, size);
    if (left.x >= right.x) throw new Error("Left anchor must be left of the right anchor.");
    const eyeDistance = distance(left, right);
    if (eyeDistance < 1) throw new Error("Calibration anchors are too close together.");
    return {
      left, right, eyeDistance,
      angle: angle(left, right),
      bridge: denormalize({ x: calibration.bridgeX, y: calibration.bridgeY }, size),
    };
  }
}
