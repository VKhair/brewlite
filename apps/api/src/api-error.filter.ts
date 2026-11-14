import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

const databaseConflicts = new Set(['23503', '23505', '23514', '23P01', 'P2002', 'P2003', 'P2011', 'P2014']);
const concurrencyErrors = new Set(['40001', '40P01', '55P03', 'P2034']);
const unavailableErrors = new Set(['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT',
  'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND', 'EAI_AGAIN', '53300', '57P01', '57P02', '57P03', 'P1000', 'P1001', 'P1002', 'P1017']);

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const requestId = randomUUID();
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message: string | string[] = 'Internal server error';
    let details: unknown[] = [];
    const dbCode = exception && typeof exception === 'object' && 'code' in exception &&
      typeof exception.code === 'string' ? exception.code : undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (status < 500) {
        code = HttpStatus[status] ?? 'REQUEST_ERROR';
        if (typeof body === 'string') message = body;
        else {
          const info = body as { code?: string; message?: string | string[]; details?: unknown[] };
          code = info.code ?? code;
          message = info.message ?? exception.message;
          details = info.details ?? [];
        }
        if (status === 404 && !request.route) message = 'Resource not found';
      } else if (status === 503) {
        code = 'SERVICE_UNAVAILABLE'; message = 'Service temporarily unavailable';
      }
    } else if (dbCode && (unavailableErrors.has(dbCode) || dbCode.startsWith('08'))) {
      status = 503; code = 'SERVICE_UNAVAILABLE'; message = 'Service temporarily unavailable';
    } else if (dbCode && concurrencyErrors.has(dbCode)) {
      status = 409; code = 'CONCURRENT_MODIFICATION'; message = 'Data changed concurrently. Please refresh and try again';
    } else if (dbCode && databaseConflicts.has(dbCode)) {
      status = 409; code = 'DATA_CONFLICT'; message = 'Request conflicts with current data';
    }

    if (status >= 500) {
      // Intentionally excludes body, headers, tokens, SQL, exception.message and stack.
      this.logger.error(JSON.stringify({ requestId, statusCode: status, method: request.method,
        route: request.route?.path, code }));
    }
    response.setHeader('X-Request-Id', requestId);
    response.status(status).json({ statusCode: status, error: HttpStatus[status] ?? 'ERROR',
      code, message, details, requestId, path: request.originalUrl?.split('?')[0] ?? request.url?.split('?')[0],
      timestamp: new Date().toISOString() });
  }
}
