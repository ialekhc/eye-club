import { z } from "zod";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PIXELS = 24_000_000;
export const MAX_IMAGE_EDGE = 1920;
const fileSchema = z.object({
  size: z.number().positive("The file is empty.").max(MAX_FILE_BYTES, "Please choose a photo smaller than 10 MB."),
  type: z.enum(["image/jpeg", "image/png", "image/webp"], { error: "Please choose a JPG, PNG, or WebP photo." }),
});

export function validatePhotoMetadata(file: { size: number; type: string }): void {
  const result = fileSchema.safeParse(file);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Invalid photo.");
}

export function validatePhotoSignature(bytes: Uint8Array, mime: string): void {
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const webp = ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (!((mime === "image/png" && png) || (mime === "image/jpeg" && jpeg) || (mime === "image/webp" && webp))) {
    throw new Error("This file is not a valid JPG, PNG, or WebP image.");
  }
}

export function photoDimensions(width: number, height: number) {
  if (![width, height].every((n) => Number.isInteger(n) && n >= 128)) {
    throw new Error("Please use a photo at least 128 × 128 pixels.");
  }
  if (width * height > MAX_PIXELS) throw new Error("Please use a photo smaller than 24 megapixels.");
  const ratio = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}
