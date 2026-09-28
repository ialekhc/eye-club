import { describe, expect, it } from "vitest";
import { HttpException } from "@nestjs/common";
import { PublicRateLimitGuard } from "./rate-limit.guard";

describe("PublicRateLimitGuard", () => {
  it("rejects requests after the configured window limit", async () => {
    const guard = new PublicRateLimitGuard();
    const request = { header: () => undefined, ip: "198.51.100.10" } as never;
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as never;
    for (let index = 0; index < 120; index += 1) await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ response: expect.anything() });
    try { await guard.canActivate(context); } catch (error) { expect(error).toBeInstanceOf(HttpException); expect((error as HttpException).getStatus()).toBe(429); }
  });
});
