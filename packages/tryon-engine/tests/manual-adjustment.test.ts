import { describe, expect, it } from "vitest";
import { applyManualAdjustment, AUTOMATIC_FIT, transformPoint, type FrameTransform } from "../src";

const transform: FrameTransform = { position: { x: 300, y: 200 }, pivot: { x: 500, y: 140 }, scale: .6, rotation: .2 };
describe("temporary manual fit", () => {
  it("restores the exact automatic transform", () => expect(applyManualAdjustment(transform, AUTOMATIC_FIT, 300)).toEqual(transform));
  it("moves in screen axes regardless of head roll", () => {
    const adjusted = applyManualAdjustment(transform, { ...AUTOMATIC_FIT, x: .1, y: -.2 }, 300);
    expect(adjusted.position).toEqual({ x: 330, y: 140 });
    expect(adjusted.rotation).toBe(.2);
  });
  it("scales and rotates around the calibrated bridge", () => {
    const adjusted = applyManualAdjustment(transform, { ...AUTOMATIC_FIT, scale: 1.2, rotation: -.1 }, 300);
    expect(adjusted.scale).toBeCloseTo(.72);
    expect(adjusted.rotation).toBeCloseTo(.1);
    expect(transformPoint(transform.pivot, adjusted)).toEqual(transform.position);
  });
  it("does not mutate automatic placement or calibration", () => {
    const before = JSON.stringify(transform);
    applyManualAdjustment(transform, { x: .1, y: .1, scale: 1.2, rotation: .1 }, 300);
    expect(JSON.stringify(transform)).toBe(before);
  });
  it.each([{ x: NaN }, { y: Infinity }, { scale: 0 }, { scale: -1 }, { rotation: Infinity }])("rejects invalid correction %j", (correction) => {
    expect(() => applyManualAdjustment(transform, { ...AUTOMATIC_FIT, ...correction }, 300)).toThrow();
  });
  it.each([0, -1, NaN])("rejects invalid face distance %s", (distance) => {
    expect(() => applyManualAdjustment(transform, AUTOMATIC_FIT, distance)).toThrow();
  });
});
