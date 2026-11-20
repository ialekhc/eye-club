import { createHash, randomUUID } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { inspectFrame, type ObjectStorage, type PresignedUpload, type StoredObject, type UploadedFrame } from "./object-storage.service.js";

@Injectable()
export class S3ObjectStorageService implements ObjectStorage {
  private readonly bucket = process.env.S3_BUCKET;
  private readonly client = new S3Client({ credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined, region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" });

  private requireBucket() { if (!this.bucket) throw new Error("S3_BUCKET is required when STORAGE_PROVIDER=s3."); return this.bucket; }

  async putFrame(organizationId: string, file: UploadedFrame): Promise<StoredObject> {
    if (!file?.buffer || file.size > 10 * 1024 * 1024) throw new BadRequestException("Frame asset must be 10 MB or smaller.");
    const inspected = inspectFrame(file);
    const extension = inspected.mimeType === "image/webp" ? "webp" : "png";
    const storageKey = `${organizationId}/frames/${randomUUID()}.${extension}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.requireBucket(), Key: storageKey, Body: file.buffer, ContentType: inspected.mimeType, Metadata: { sha256: createHash("sha256").update(file.buffer).digest("hex") } }));
    return { storageKey, bytes: file.size, ...inspected, sha256: createHash("sha256").update(file.buffer).digest("hex") };
  }

  async getFrame(storageKey: string) {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.requireBucket(), Key: storageKey }));
    if (!result.Body) throw new Error("Stored frame has no body.");
    const body = Buffer.from(await result.Body.transformToByteArray());
    return { body, mimeType: result.ContentType ?? (storageKey.endsWith(".webp") ? "image/webp" : "image/png") };
  }

  async createFrameUpload(organizationId: string, input: { mimeType: string; bytes: number; width: number; height: number; sha256: string }): Promise<PresignedUpload> {
    if (!['image/png', 'image/webp'].includes(input.mimeType) || input.bytes < 1 || input.bytes > 10 * 1024 * 1024 || input.width < 32 || input.height < 32 || input.width * input.height > 24_000_000) throw new BadRequestException("Invalid frame upload metadata.");
    const extension = input.mimeType === "image/webp" ? "webp" : "png";
    const storageKey = `${organizationId}/frames/${randomUUID()}.${extension}`;
    const expiresIn = 900;
    const uploadUrl = await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.requireBucket(), Key: storageKey, ContentType: input.mimeType, ContentLength: input.bytes, Metadata: { sha256: input.sha256 } }), { expiresIn });
    return { storageKey, uploadUrl, expiresIn };
  }

  async deleteFrame(storageKey: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.requireBucket(), Key: storageKey }));
  }

  async getFrameUrl(storageKey: string, expiresIn = 300) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.requireBucket(), Key: storageKey }), { expiresIn });
  }
}
