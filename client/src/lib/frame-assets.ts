import { loadFrame } from "./images";
import { validatePhotoSignature } from "./photo-validation";
import { INITIAL_CALIBRATION, type LoadedFrame, type StoredFrame } from "./frame-schema";

export function validateAlpha(pixels: Uint8ClampedArray): void {
  let visible = 0, transparent = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i]! > 32) visible++;
    if (pixels[i]! < 16) transparent++;
  }
  if (visible < 64) throw new Error("This image is empty or almost invisible. Upload a visible frame.");
  if (transparent < pixels.length / 4 * .01) throw new Error("The frame needs a transparent background. Opaque product photos are not supported.");
}

export async function readFrameAsset(blob: Blob): Promise<{ source: string; image: HTMLImageElement; width: number; height: number; assetHash: string }> {
  if (!["image/png", "image/webp"].includes(blob.type)) throw new Error("Upload a transparent PNG or WebP frame.");
  if (blob.size === 0 || blob.size > 10 * 1024 * 1024) throw new Error("Frame assets must be between 1 byte and 10 MB.");
  const bytes = await blob.arrayBuffer();
  validatePhotoSignature(new Uint8Array(bytes).subarray(0, 12), blob.type);
  const source = URL.createObjectURL(blob);
  try {
    const image = await loadFrame(source);
    const width = image.naturalWidth, height = image.naturalHeight;
    if (width < 64 || height < 32 || width > 4096 || height > 4096 || width * height > 8_000_000) {
      throw new Error("Use a frame at least 64 × 32 pixels, at most 4096 pixels per side and 8 megapixels total.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable.");
    try { context.drawImage(image, 0, 0); validateAlpha(context.getImageData(0, 0, width, height).data); }
    finally { canvas.width = 0; canvas.height = 0; }
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const assetHash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
    return { source, image, width, height, assetHash };
  } catch (error) { URL.revokeObjectURL(source); throw error; }
}

export async function importFrame(file: File): Promise<LoadedFrame> {
  const asset = await readFrameAsset(file);
  return { ...asset, version: 1, id: crypto.randomUUID(), blob: file,
    name: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Untitled frame", collection: "Your collection",
    color: "Original asset", shape: "Custom frame", calibration: { ...INITIAL_CALIBRATION } };
}

export async function hydrateFrame(record: StoredFrame): Promise<LoadedFrame> {
  const asset = await readFrameAsset(record.blob);
  if (asset.assetHash !== record.assetHash || asset.width !== record.width || asset.height !== record.height) {
    URL.revokeObjectURL(asset.source);
    throw new Error("Saved calibration does not match its frame asset. Please import and calibrate it again.");
  }
  return { ...record, ...asset };
}
