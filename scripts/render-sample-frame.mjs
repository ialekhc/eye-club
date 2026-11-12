// Deterministically rasterize original artwork; no generative image processing.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
for (const name of Array.from({ length: 12 }, (_, index) => `atelier-${String(index + 1).padStart(2, "0")}`)) {
  const source = fileURLToPath(new URL(`../client/public/frames/${name}.svg`, import.meta.url));
  const target = fileURLToPath(new URL(`../client/public/frames/${name}.png`, import.meta.url));
  await sharp(source).png().toFile(target);
}
console.log("Created 12 original transparent sample frames.");
