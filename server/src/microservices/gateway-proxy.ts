import type { Request, Response } from 'express';
import {
  getMicroserviceDefinition,
  isPathAllowedOnMicroservice,
  type MicroserviceRole,
  resolveServiceForPath,
  resolveUpstreamUrl,
} from './microservices.registry.js';

/**
 * Strict microservice boundary & API gateway proxy middleware.
 * - When running as `api-gateway` (:4000), strictly proxies all domain requests over HTTP
 *   to their owning downstream microservice (:4001..:4005).
 * - When running as a downstream domain microservice (:4001..:4005), strictly rejects
 *   any request outside that service's bounded context with HTTP 421 Misdirected Request.
 */
export function createStrictMicroserviceMiddleware(activeRole: MicroserviceRole) {
  const activeDef = getMicroserviceDefinition(activeRole);

  return async (
    req: Request & { requestId?: string },
    res: Response,
    next: () => void,
  ): Promise<void> => {
    const cleanPath = req.originalUrl.split('?')[0] ?? '/';

    // Always allow health and OpenAPI docs on every service node
    if (cleanPath === '/api/v1/health' || cleanPath.startsWith('/docs')) {
      next();
      return;
    }

    const targetService = resolveServiceForPath(cleanPath);

    // 1. Downstream domain microservice: enforce strict bounded-context isolation
    if (activeRole !== 'api-gateway') {
      if (!isPathAllowedOnMicroservice(activeRole, cleanPath)) {
        res.status(421).json({
          statusCode: 421,
          error: 'Misdirected Request',
          message: `Strict microservice boundary violation: '${cleanPath}' belongs to '${targetService.id}' (:${targetService.defaultPort}), not '${activeRole}' (:${activeDef.defaultPort}).`,
          activeService: activeRole,
          expectedService: targetService.id,
          expectedPort: targetService.defaultPort,
        });
        return;
      }
      next();
      return;
    }

    // 2. API Gateway (:4000): handle gateway-owned routes (/api/v1/microservices/*) locally,
    //    and strictly reverse-proxy all domain routes to their isolated microservice process.
    if (targetService.id === 'api-gateway') {
      next();
      return;
    }

    const upstreamBase = resolveUpstreamUrl(targetService);
    const upstreamUrl = `${upstreamBase}${req.originalUrl}`;

    const forwardHeaders: Record<string, string> = {
      'content-type': req.header('content-type') || 'application/json',
      'x-request-id': req.requestId || '',
      'x-forwarded-by': 'eye-club-api-gateway',
      'x-microservice-target': targetService.id,
    };
    const authHeader = req.header('authorization');
    if (authHeader) forwardHeaders['authorization'] = authHeader;
    const orgHeader = req.header('x-organization-id');
    if (orgHeader) forwardHeaders['x-organization-id'] = orgHeader;

    const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    const serializedBody =
      hasBody && req.body !== undefined
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : undefined;

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: serializedBody,
        signal: AbortSignal.timeout(15_000),
      });

      res.setHeader('x-routed-by', 'api-gateway');
      res.setHeader(
        'x-upstream-service',
        `${targetService.id}:${targetService.defaultPort}`,
      );
      const contentType = upstreamResponse.headers.get('content-type');
      if (contentType) res.setHeader('content-type', contentType);

      const payload = Buffer.from(await upstreamResponse.arrayBuffer());
      res.status(upstreamResponse.status).send(payload);
    } catch {
      res.status(503).json({
        statusCode: 503,
        error: 'Service Unavailable',
        message: `Downstream microservice '${targetService.id}' is unreachable at ${upstreamBase}. Start the microservices cluster with 'npm run dev:microservices'.`,
        targetService: targetService.id,
        upstreamEndpoint: upstreamBase,
      });
    }
  };
}
