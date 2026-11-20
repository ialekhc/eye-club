import { describe, expect, it } from "vitest";
import { FaceGeometryStabilizer, lerpAngle, stabilizeIrisLandmarks, type FaceGeometry, type Landmark } from "../src";

const baseGeometry: FaceGeometry = {
  leftEye: { x: 200, y: 200 },
  rightEye: { x: 400, y: 200 },
  midpoint: { x: 300, y: 200 },
  noseBridge: { x: 300, y: 190 },
  eyeDistance: 200,
  roll: 0,
  faceWidth: 360,
};

describe("FaceGeometryStabilizer", () => {
  it("suppresses sub-pixel high-frequency jitter when head is stationary", () => {
    const stabilizer = new FaceGeometryStabilizer();
    const initial = stabilizer.update(baseGeometry, 1000);
    expect(initial.midpoint).toEqual({ x: 300, y: 200 });

    const jittered: FaceGeometry = {
      ...baseGeometry,
      leftEye: { x: 200.4, y: 199.7 },
      rightEye: { x: 400.4, y: 199.7 },
      midpoint: { x: 300.4, y: 199.7 },
      roll: 0.001,
    };
    const smoothed = stabilizer.update(jittered, 1016);
    expect(Math.abs(smoothed.midpoint.x - 300)).toBeLessThan(0.15);
    expect(Math.abs(smoothed.roll)).toBeLessThan(0.0005);
  });

  it("tracks intentional fast head movement with high responsiveness", () => {
    const stabilizer = new FaceGeometryStabilizer();
    stabilizer.update(baseGeometry, 1000);

    const moved: FaceGeometry = {
      ...baseGeometry,
      leftEye: { x: 280, y: 220 },
      rightEye: { x: 480, y: 220 },
      midpoint: { x: 380, y: 220 },
    };
    const tracked = stabilizer.update(moved, 1016);
    expect(tracked.midpoint.x).toBeGreaterThan(360);
  });

  it("holds pose across brief detection dropouts and clears after grace window", () => {
    const stabilizer = new FaceGeometryStabilizer({ graceHoldMs: 150 });
    stabilizer.update(baseGeometry, 1000);

    expect(stabilizer.holdOrClear(1080)).not.toBeNull();
    expect(stabilizer.holdOrClear(1200)).toBeNull();
  });

  it("interpolates angles smoothly across the -PI/+PI boundary", () => {
    const a = Math.PI - 0.05;
    const b = -Math.PI + 0.05;
    const mid = lerpAngle(a, b, 0.5);
    expect(Math.abs(mid)).toBeCloseTo(Math.PI, 1);
  });

  it("stabilizes iris landmarks with anatomical eye corners when available", () => {
    const landmarks: Landmark[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
    landmarks[33] = { x: 0.30, y: 0.5 };
    landmarks[133] = { x: 0.40, y: 0.5 };
    landmarks[362] = { x: 0.60, y: 0.5 };
    landmarks[263] = { x: 0.70, y: 0.5 };
    // Simulate iris gazing sideways within socket
    landmarks[468] = { x: 0.38, y: 0.5 };
    landmarks[473] = { x: 0.68, y: 0.5 };

    const stabilized = stabilizeIrisLandmarks(landmarks, { width: 1000, height: 800 });
    expect(stabilized[468]!.x).toBeCloseTo(0.35 * 0.65 + 0.38 * 0.35);
    expect(stabilized[473]!.x).toBeCloseTo(0.65 * 0.65 + 0.68 * 0.35);
  });
});
