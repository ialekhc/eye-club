import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { AppModule } from "./app.module";
import { HttpErrorFilter } from "./http-exception.filter";

async function bootstrap() {
  if (process.env.NODE_ENV === "production" && (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32)) throw new Error("JWT_ACCESS_SECRET must be at least 32 characters in production.");
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix("api/v1");
  app.use((request: Request & { requestId?: string }, response: Response, next: () => void) => { const requestId = request.header("x-request-id")?.slice(0, 100) || randomUUID(); request.requestId = requestId; response.setHeader("x-request-id", requestId); const started = Date.now(); response.on("finish", () => console.log(JSON.stringify({ level: "info", requestId, method: request.method, path: request.originalUrl, status: response.statusCode, durationMs: Date.now() - started }))); next(); });
  const allowedCorsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => { if (!origin || allowedCorsOrigins.includes(origin)) callback(null, true); else callback(new Error("Origin is not allowed by CORS"), false); }, credentials: false, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "X-Organization-Id", "X-Request-Id"] });
  app.use((_request: unknown, response: { setHeader: (name: string, value: string) => void }, next: () => void) => { response.setHeader("X-Content-Type-Options", "nosniff"); response.setHeader("X-Frame-Options", "DENY"); response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin"); response.setHeader("Permissions-Policy", "camera=(self)"); next(); });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpErrorFilter());
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle("Virtual Eyewear API").setDescription("Tenant-scoped catalogue and try-on API").setVersion("1.0").addBearerAuth().build());
  SwaggerModule.setup("docs", app, document);
  await app.listen(Number(process.env.PORT ?? 4000));
}
void bootstrap();
