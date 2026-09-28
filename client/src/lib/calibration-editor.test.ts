import { describe, expect, it } from "vitest";
import { editorPoint, moveAnchor } from "./calibration-editor";
import { calibrationFormSchema, INITIAL_CALIBRATION, storedFrameSchema } from "./frame-schema";
import { validateAlpha } from "./frame-assets";

describe("calibration editing", () => {
  it.each([{ width: 1000, height: 360 }, { width: 500, height: 180 }, { width: 250, height: 90 }])("normalizes pointers independently of viewport size %j", (size) => {
    expect(editorPoint({ x: 20 + size.width * .25, y: 50 + size.height * .5 }, { left: 20, top: 50, ...size })).toEqual({ x: .25, y: .5 });
  });
  it("clamps captured pointer drags at the image boundary", () => {
    expect(editorPoint({ x: -20, y: 700 }, { left: 20, top: 50, width: 500, height: 180 })).toEqual({ x: 0, y: 1 });
  });
  it("rejects a canvas without drawable dimensions", () => {
    expect(() => editorPoint({ x: 2, y: 3 }, { left: 0, top: 0, width: 0, height: 1 })).toThrow();
  });
  it("changes only the chosen normalized anchor", () => {
    const edited = moveAnchor(INITIAL_CALIBRATION, "bridge", { x: .49, y: .42 });
    expect(edited).toEqual({ ...INITIAL_CALIBRATION, bridgeX: .49, bridgeY: .42 });
    expect(INITIAL_CALIBRATION.bridgeY).toBe(.4);
  });
  it("accepts finite normalized calibrations and trims the frame name", () => {
    expect(calibrationFormSchema.parse({ name: " Round frame ", calibration: INITIAL_CALIBRATION }).name).toBe("Round frame");
  });
  it.each([{ leftAnchorX: .8 }, { rightAnchorY: 2 }, { bridgeX: -.1 }, { scaleMultiplier: 0 }, { offsetX: 2 }, { rotationOffset: Infinity }])("rejects invalid editable values %j", (values) => {
    expect(calibrationFormSchema.safeParse({ name: "Frame", calibration: { ...INITIAL_CALIBRATION, ...values } }).success).toBe(false);
  });
  it("requires a name", () => expect(calibrationFormSchema.safeParse({ name: " ", calibration: INITIAL_CALIBRATION }).success).toBe(false));
});

describe("asset transparency validation", () => {
  it("accepts visible frame pixels with a transparent background", () => {
    const pixels = new Uint8ClampedArray(100 * 4);
    for (let i = 0; i < 80; i++) pixels[i * 4 + 3] = 255;
    expect(() => validateAlpha(pixels)).not.toThrow();
  });
  it("rejects opaque images and invisible assets", () => {
    expect(() => validateAlpha(new Uint8ClampedArray(400).fill(255))).toThrow(/transparent/);
    expect(() => validateAlpha(new Uint8ClampedArray(400))).toThrow(/invisible/);
  });
});

describe("versioned calibration persistence", () => {
  const record = { version: 1, id: "frame-1", name: "Frame", collection: "Local", color: "Black", shape: "Round", width: 1000, height: 360,
    assetHash: "a".repeat(64), blob: new Blob(["bytes"], { type: "image/png" }), calibration: INITIAL_CALIBRATION };
  it("persists only asset and calibration metadata, stripping transient fields", () => {
    const result = storedFrameSchema.parse({ ...record, source: "blob:temporary", image: {}, customerPhoto: "must not persist", landmarks: [] });
    expect(result).not.toHaveProperty("source"); expect(result).not.toHaveProperty("image");
    expect(result).not.toHaveProperty("customerPhoto"); expect(result).not.toHaveProperty("landmarks");
    expect(result.assetHash).toBe(record.assetHash);
  });
  it.each([{ version: 2 }, { assetHash: "wrong" }, { width: 0 }, { blob: "data:image/png;base64,x" }])("rejects incompatible records %j", (change) => {
    expect(storedFrameSchema.safeParse({ ...record, ...change }).success).toBe(false);
  });
  it("rejects degenerate anchors at actual asset resolution", () => {
    expect(storedFrameSchema.safeParse({ ...record, calibration: { ...INITIAL_CALIBRATION, rightAnchorX: .250001 } }).success).toBe(false);
  });
});
