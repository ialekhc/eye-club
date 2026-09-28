import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request & { requestId?: string }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : "Internal server error";
    const message = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null && "message" in raw ? (raw as { message: string | string[] }).message : "Internal server error";
    response.status(status).json({ error: { status, code: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR", message, requestId: request.requestId } });
  }
}
