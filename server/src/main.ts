import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { AppModule } from "./app.module.js";
import { HttpErrorFilter } from "./http-exception.filter.js";
import {
  getMicroserviceDefinition,
  parseMicroserviceRole,
  resolveServiceForPath,
} from "./microservices/microservices.registry.js";
import { createStrictMicroserviceMiddleware } from "./microservices/gateway-proxy.js";

async function bootstrap() {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32)
  ) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters in production.");
  }

  const serviceRole = parseMicroserviceRole(process.env.MICROSERVICE_ROLE);
  const serviceMeta = getMicroserviceDefinition(serviceRole);

  // Strictly bootstrap only the modules & controllers owned by this microservice role
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forMicroservice(serviceRole),
    { bufferLogs: true },
  );

  app.setGlobalPrefix("api/v1");
  app.useBodyParser("json", { limit: "15mb" });

  app.use((request: Request & { requestId?: string }, response: Response, next: () => void) => {
    const requestId = request.header("x-request-id")?.slice(0, 100) || randomUUID();
    request.requestId = requestId;
    const targetService = resolveServiceForPath(request.originalUrl);
    response.setHeader("x-request-id", requestId);
    response.setHeader("x-microservice-id", serviceMeta.id);
    response.setHeader("x-microservice-owner", targetService.id);
    response.setHeader("x-microservice-context", serviceMeta.boundedContext);
    const started = Date.now();
    response.on("finish", () =>
      console.log(
        JSON.stringify({
          level: "info",
          nodeRole: serviceMeta.id,
          ownerService: targetService.id,
          requestId,
          method: request.method,
          path: request.originalUrl.replace(/(\/invitations\/)[^/]+/, "$1[redacted]"),
          status: response.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    next();
  });

  const allowedCorsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedCorsOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Origin is not allowed by CORS"), false);
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Organization-Id",
      "X-Request-Id",
      "X-Microservice-Target",
      "X-Forwarded-By",
    ],
  });

  app.use(
    (
      _request: unknown,
      response: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("X-Frame-Options", "DENY");
      response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      response.setHeader("Permissions-Policy", "camera=(self)");
      next();
    },
  );

  // Enforce strict gateway reverse-proxying on :4000 and strict boundary rejection on :4001..:4005
  app.use(createStrictMicroserviceMiddleware(serviceRole));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpErrorFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(`Eye Club Microservice — ${serviceMeta.name}`)
      .setDescription(`[Bounded Context: ${serviceMeta.boundedContext}] ${serviceMeta.description}`)
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? serviceMeta.defaultPort);
  await app.listen(port);
  console.log(
    JSON.stringify({
      level: "info",
      event: "microservice_listening",
      role: serviceMeta.id,
      boundedContext: serviceMeta.boundedContext,
      port,
      routePrefixes: serviceMeta.routePrefixes,
    }),
  );
}
void bootstrap();
