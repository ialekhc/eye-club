import { describe, expect, it } from "vitest";
import { photoDimensions, validatePhotoMetadata, validatePhotoSignature } from "./photo-validation";

describe("photo validation", () => {
  it("accepts supported nonempty images", () => expect(() => validatePhotoMetadata({ size: 1024, type: "image/png" })).not.toThrow());
  it.each([{ size: 0, type: "image/png" }, { size: 11 * 1024 * 1024, type: "image/jpeg" }, { size: 100, type: "image/svg+xml" }])("rejects invalid metadata %j", (file) => expect(() => validatePhotoMetadata(file)).toThrow());
  it("checks signatures rather than trusting file extensions", () => {
    expect(() => validatePhotoSignature(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).not.toThrow();
    expect(() => validatePhotoSignature(new Uint8Array([255, 216, 255]), "image/jpeg")).not.toThrow();
    expect(() => validatePhotoSignature(new TextEncoder().encode("RIFF1234WEBP"), "image/webp")).not.toThrow();
    expect(() => validatePhotoSignature(new TextEncoder().encode("<svg></svg>"), "image/png")).toThrow();
    expect(() => validatePhotoSignature(new Uint8Array([255, 216, 255]), "image/png")).toThrow();
  });
  it("bounds output size while preserving aspect ratio", () => {
    expect(photoDimensions(4000, 3000)).toEqual({ width: 1920, height: 1440 });
    expect(photoDimensions(800, 1200)).toEqual({ width: 800, height: 1200 });
  });
  it("rejects tiny, invalid and oversized images", () => {
    for (const [width, height] of [[100, 100], [0, 500], [6000, 6000], [NaN, 500]]) {
      expect(() => photoDimensions(width!, height!)).toThrow();
    }
  });
});
