import { photoDimensions, validatePhotoMetadata, validatePhotoSignature } from "./photo-validation";

/** Decode locally, honor EXIF orientation, and retain only raster pixels (no metadata). */
export async function decodePhoto(file: File): Promise<HTMLCanvasElement> {
  validatePhotoMetadata(file);
  validatePhotoSignature(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { throw new Error("We couldn’t read that photo. Try exporting it as a JPG or PNG."); }
  try {
    const size = photoDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser doesn’t support Canvas. Please try an updated browser.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    return canvas;
  } finally { bitmap.close(); }
}

export async function loadFrame(source: string): Promise<HTMLImageElement> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error("The frame image took too long to load.")); }, 10_000);
    const cleanup = () => { window.clearTimeout(timeout); image.onload = null; image.onerror = null; };
    image.onload = () => { cleanup(); resolve(); };
    image.onerror = () => { cleanup(); reject(new Error("The frame image couldn’t load. Please try again.")); };
    image.src = source;
  });
  if (typeof image.decode === "function") {
    try {
      await Promise.race([
        image.decode(),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Frame decode timed out.")), 2_000)),
      ]);
    } catch { throw new Error("The frame image couldn’t be decoded. Please try again."); }
  }
  return image;
}

export function releasePhoto(photo: HTMLCanvasElement | undefined): void {
  if (photo) { photo.width = 0; photo.height = 0; }
}
