import { describe, expect, it } from "vitest";
import { angle, denormalize, distance, FaceGeometryCalculator, FrameCalibrationEngine, FrameTransformCalculator, midpoint, normalize, transformPoint, type FrameCalibration, type Landmark, type Size } from "../src";

const calibration: FrameCalibration = {
  leftAnchorX: .25, leftAnchorY: .5, rightAnchorX: .75, rightAnchorY: .5,
  bridgeX: .5, bridgeY: .35, scaleMultiplier: 1, offsetX: 0, offsetY: 0, rotationOffset: 0,
};
function landmarksFor(size: Size, roll = 0): Landmark[] {
  const landmarks = Array.from({ length: 478 }, () => ({ x: .5, y: .5 }));
  const center = { x: size.width / 2, y: size.height / 2 };
  const halfDistance = size.width * .15;
  landmarks[468] = normalize({ x: center.x - Math.cos(roll) * halfDistance, y: center.y - Math.sin(roll) * halfDistance }, size);
  landmarks[473] = normalize({ x: center.x + Math.cos(roll) * halfDistance, y: center.y + Math.sin(roll) * halfDistance }, size);
  landmarks[168] = { x: .5, y: .47 };
  landmarks[234] = { x: .2, y: .5 };
  landmarks[454] = { x: .8, y: .5 };
  return landmarks;
}

describe("geometry primitives", () => {
  it("calculates Euclidean eye distance", () => expect(distance({ x: 10, y: 20 }, { x: 13, y: 24 })).toBe(5));
  it("calculates an eye midpoint", () => expect(midpoint({ x: 100, y: 200 }, { x: 300, y: 240 })).toEqual({ x: 200, y: 220 }));
  it("calculates signed roll in radians", () => {
    expect(angle({ x: 0, y: 0 }, { x: 10, y: 10 })).toBeCloseTo(Math.PI / 4);
    expect(angle({ x: 0, y: 0 }, { x: 10, y: -10 })).toBeCloseTo(-Math.PI / 4);
  });
  it.each([{ width: 1000, height: 1000 }, { width: 1200, height: 800 }, { width: 600, height: 1400 }])("round-trips normalization for $width × $height", (size) => {
    const point = { x: 150, y: 370 };
    expect(denormalize(normalize(point, size), size)).toEqual(point);
  });
  it("rejects invalid dimensions and degenerate coordinates", () => {
    expect(() => normalize({ x: 1, y: 2 }, { width: 0, height: 2 })).toThrow();
    expect(() => distance({ x: NaN, y: 0 }, { x: 1, y: 0 })).toThrow();
    expect(() => angle({ x: 1, y: 2 }, { x: 1, y: 2 })).toThrow();
  });
});

describe("face geometry", () => {
  const calculator = new FaceGeometryCalculator();
  it.each([{ width: 1200, height: 800 }, { width: 800, height: 1200 }, { width: 960, height: 960 }])("uses pixel geometry, independent of aspect ratio ($width × $height)", (size) => {
    const result = calculator.calculate(landmarksFor(size, .2), size);
    expect(result.eyeDistance).toBeCloseTo(size.width * .3);
    expect(result.roll).toBeCloseTo(.2);
    expect(result.midpoint.x).toBeCloseTo(size.width / 2);
    expect(result.midpoint.y).toBeCloseTo(size.height / 2);
    expect(result.faceWidth).toBeCloseTo(size.width * .6);
  });
  it("handles reversed anatomical eye ordering without mirroring", () => {
    const size = { width: 1000, height: 800 };
    const landmarks = landmarksFor(size, -.15);
    [landmarks[468], landmarks[473]] = [landmarks[473]!, landmarks[468]!];
    expect(calculator.calculate(landmarks, size).roll).toBeCloseTo(-.15);
  });
  it("rejects incomplete or too-small faces", () => {
    expect(() => calculator.calculate([], { width: 1000, height: 800 })).toThrow(/incomplete/);
    expect(() => calculator.calculate(landmarksFor({ width: 10, height: 10 }), { width: 10, height: 10 })).toThrow(/too small/);
  });
});

describe("frame calibration and transform", () => {
  const calculator = new FrameTransformCalculator();
  const size = { width: 1200, height: 800 };
  const asset = { width: 1000, height: 400 };
  const face = new FaceGeometryCalculator().calculate(landmarksFor(size), size);
  it("derives scale from each frame's anchor separation", () => {
    expect(calculator.calculate(face, calibration, asset).scale).toBeCloseTo(360 / 500);
    const wider = { ...calibration, leftAnchorX: .1, rightAnchorX: .9 };
    expect(calculator.calculate(face, wider, asset).scale).toBeCloseTo(360 / 800);
  });
  it.each([-.3, 0, .3])("maps both frame anchors exactly onto the eyes for roll %s", (roll) => {
    const rotatedFace = new FaceGeometryCalculator().calculate(landmarksFor(size, roll), size);
    const transform = calculator.calculate(rotatedFace, calibration, asset);
    const left = transformPoint({ x: 250, y: 200 }, transform);
    const right = transformPoint({ x: 750, y: 200 }, transform);
    expect(left.x).toBeCloseTo(rotatedFace.leftEye.x);
    expect(left.y).toBeCloseTo(rotatedFace.leftEye.y);
    expect(right.x).toBeCloseTo(rotatedFace.rightEye.x);
    expect(right.y).toBeCloseTo(rotatedFace.rightEye.y);
  });
  it("corrects a pre-rotated asset", () => {
    const tilted = { ...calibration, leftAnchorY: .4, rightAnchorY: .6 };
    const transform = calculator.calculate(face, tilted, asset);
    expect(transform.rotation).toBeCloseTo(-Math.atan2(80, 500));
    expect(transformPoint({ x: 250, y: 160 }, transform).y).toBeCloseTo(face.leftEye.y);
    expect(transformPoint({ x: 750, y: 240 }, transform).y).toBeCloseTo(face.rightEye.y);
  });
  it("applies independent calibration scale, normalized offsets, and rotation", () => {
    const adjusted = { ...calibration, scaleMultiplier: 1.1, offsetX: .1, offsetY: -.05, rotationOffset: .03 };
    const transform = calculator.calculate(face, adjusted, asset);
    expect(transform.scale).toBeCloseTo(.72 * 1.1);
    expect(transform.rotation).toBeCloseTo(.03);
    const mappedMidpoint = transformPoint({ x: 500, y: 200 }, transform);
    expect(mappedMidpoint.x).toBeCloseTo(face.midpoint.x + 36);
    expect(mappedMidpoint.y).toBeCloseTo(face.midpoint.y - 18);
  });
  it("uses head-relative offset axes", () => {
    const rolled = { ...face, roll: Math.PI / 2 };
    const transform = calculator.calculate(rolled, { ...calibration, offsetX: .1 }, asset);
    const middle = transformPoint({ x: 500, y: 200 }, transform);
    expect(middle.x).toBeCloseTo(face.midpoint.x);
    expect(middle.y).toBeCloseTo(face.midpoint.y + 36);
  });
  it.each([
    { scaleMultiplier: 0 }, { scaleMultiplier: NaN }, { leftAnchorX: -1 },
    { rightAnchorY: 2 }, { offsetX: Infinity }, { rotationOffset: NaN },
    { leftAnchorX: .75 }, { leftAnchorX: .9 },
  ])("rejects invalid calibration %j", (change) => {
    expect(() => new FrameCalibrationEngine().resolve({ ...calibration, ...change }, asset)).toThrow();
  });
  it("is deterministic and does not mutate inputs", () => {
    const snapshot = JSON.stringify({ face, calibration, asset });
    expect(calculator.calculate(face, calibration, asset)).toEqual(calculator.calculate(face, calibration, asset));
    expect(JSON.stringify({ face, calibration, asset })).toBe(snapshot);
  });
});
