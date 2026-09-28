// Deterministically rasterize original artwork; no generative image processing.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
for (const name of ["atelier-01", "atelier-02"]) {
  const source = fileURLToPath(new URL(`../apps/web/public/frames/${name}.svg`, import.meta.url));
  const target = fileURLToPath(new URL(`../apps/web/public/frames/${name}.png`, import.meta.url));
  await sharp(source).png().toFile(target);
}
console.log("Created two original transparent sample frames.");
