import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";

type Bucket = { count: number; resetAt: number };

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly buckets = new Map<string, Bucket>();
  private readonly redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 }) : null;

  async consume(key: string, limit: number, windowMs: number) {
    if (this.redis) {
      try {
        if (this.redis.status === "wait") await this.redis.connect();
        const redisKey = `rate:${key}`;
        const count = await this.redis.incr(redisKey);
        if (count === 1) await this.redis.pexpire(redisKey, windowMs);
        return count <= limit;
      } catch {
        // Redis outages fail open to preserve availability; local memory still limits this instance.
      }
    }
    const now = Date.now(); const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) { this.buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
    if (bucket.count >= limit) return false;
    bucket.count += 1; return true;
  }

  async onModuleDestroy() { if (this.redis) await this.redis.quit().catch(() => undefined); }
}
