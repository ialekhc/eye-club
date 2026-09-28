import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const visionRoot = path.dirname(require.resolve("@mediapipe/tasks-vision"));
const publicRoot = path.join(root, "apps/web/public");
const modelUrl = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const modelPath = path.join(publicRoot, "models/face_landmarker.task");
const expectedHash = "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff";
const verify = (bytes) => {
  if (createHash("sha256").update(bytes).digest("hex") !== expectedHash) {
    throw new Error("Model checksum mismatch. Remove the local model and rerun setup; do not use an unverified model.");
  }
};

await mkdir(path.dirname(modelPath), { recursive: true });
await cp(path.join(visionRoot, "wasm"), path.join(publicRoot, "vision"), { recursive: true });
let model;
try { model = await readFile(modelPath); } catch { /* Download on first setup. */ }
if (!model) {
  const response = await fetch(modelUrl, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
  model = Buffer.from(await response.arrayBuffer());
  if (model.length < 1_000_000 || model.length > 20_000_000) throw new Error("Unexpected model size.");
  verify(model);
  const temporary = `${modelPath}.download`;
  try { await writeFile(temporary, model); await rename(temporary, modelPath); }
  finally { await rm(temporary, { force: true }); }
}
verify(model);
console.log(`MediaPipe runtime copied. Model: ${model.length} bytes, SHA256 ${createHash("sha256").update(model).digest("hex")}`);
