import { Prisma } from "@prisma/client";
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request & { requestId?: string }>();
    if (exception instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2003", "P2025"].includes(exception.code)) {
      const status = exception.code === "P2025" ? 404 : 409;
      response.status(status).json({ error: { status, code: "DATA_CONFLICT", message: status === 404 ? "Record not found." : "This record conflicts with existing data. Check unique fields and references.", requestId: request.requestId } }); return;
    }
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : "Internal server error";
    const message = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null && "message" in raw ? (raw as { message: string | string[] }).message : "Internal server error";
    response.status(status).json({ error: { status, code: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR", message, requestId: request.requestId } });
  }
}
