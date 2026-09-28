import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BadRequestException, Injectable } from "@nestjs/common";

export type UploadedFrame = { buffer: Buffer; size: number; mimetype: string };
export type StoredObject = { storageKey: string; mimeType: string; bytes: number; width: number; height: number; sha256: string; hasAlpha: boolean };
export type PresignedUpload = { storageKey: string; uploadUrl: string; expiresIn: number };
export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");

export interface ObjectStorage {
  putFrame(organizationId: string, file: UploadedFrame): Promise<StoredObject>;
  getFrame(storageKey: string): Promise<{ body: Buffer; mimeType: string }>;
  createFrameUpload?(organizationId: string, input: { mimeType: string; bytes: number; width: number; height: number; sha256: string }): Promise<PresignedUpload>;
  deleteFrame?(storageKey: string): Promise<void>;
}

export function inspectFrame(file: UploadedFrame) {
  const bytes = file.buffer;
  const png = bytes.length >= 26 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!png && !webp) throw new BadRequestException("Only valid PNG or WebP frame assets are accepted.");
  let width = 0; let height = 0; let hasAlpha = false;
  if (png) {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20); hasAlpha = bytes[25] === 4 || bytes[25] === 6;
  } else if (bytes.toString("ascii", 12, 16) === "VP8X" && bytes.length >= 30) {
    hasAlpha = (bytes[20]! & 0x10) !== 0;
    width = 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16);
    height = 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16);
  } else {
    throw new BadRequestException("WebP frame must use an extended VP8X container.");
  }
  if (!hasAlpha) throw new BadRequestException("Frame assets must include transparency.");
  if (width < 32 || height < 32 || width * height > 24_000_000) throw new BadRequestException("Frame dimensions are outside the supported range.");
  return { width, height, hasAlpha, mimeType: png ? "image/png" : "image/webp" };
}

@Injectable()
export class LocalObjectStorageService implements ObjectStorage {
  private readonly root = process.env.STORAGE_LOCAL_DIR ?? "./.data/objects";

  async putFrame(organizationId: string, file: UploadedFrame): Promise<StoredObject> {
    if (!file?.buffer || file.size > 10 * 1024 * 1024) throw new BadRequestException("Frame asset must be 10 MB or smaller.");
    const inspected = inspectFrame(file);
    const extension = inspected.mimeType === "image/webp" ? "webp" : "png";
    const storageKey = `${organizationId}/frames/${randomUUID()}.${extension}`;
    const destination = join(this.root, storageKey);
    await mkdir(join(this.root, organizationId, "frames"), { recursive: true });
    await writeFile(destination, file.buffer, { flag: "wx" });
    return { storageKey, bytes: file.size, ...inspected, sha256: createHash("sha256").update(file.buffer).digest("hex") };
  }

  async getFrame(storageKey: string) {
    if (!storageKey || storageKey.includes("..") || storageKey.startsWith("/")) throw new BadRequestException("Invalid storage key.");
    const body = await readFile(join(this.root, storageKey));
    return { body, mimeType: storageKey.endsWith(".webp") ? "image/webp" : "image/png" };
  }
}
