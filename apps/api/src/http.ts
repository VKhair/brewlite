import { BadRequestException, HttpException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { validationFailure } from './validation';

// Shared by production bootstrap and HTTP integration tests.
// Create the app with bodyParser:false so parser errors reach this handler first.
export function configureHttp(app: NestExpressApplication) {
  app.useBodyParser('json', { limit: '64kb', strict: true });
  app.useBodyParser('urlencoded', { limit: '64kb', extended: false, parameterLimit: 100 });
  app.use((error: unknown, _request: unknown, _response: unknown, next: (error?: unknown) => void) => {
    const type = (error as { type?: string })?.type;
    if (type === 'entity.parse.failed') {
      next(new BadRequestException({ code: 'INVALID_JSON', message: 'Malformed JSON request body' }));
    } else if (type === 'entity.too.large' || type === 'parameters.too.many') {
      next(new HttpException({ code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the allowed limit' }, 413));
    } else if (type === 'encoding.unsupported' || type === 'charset.unsupported') {
      next(new HttpException({ code: 'UNSUPPORTED_ENCODING', message: 'Unsupported request encoding' }, 415));
    } else next(error);
  });
  app.use((request: { body?: unknown }, _response: unknown, next: (error?: unknown) => void) => {
    if (request.body !== undefined) {
      if (request.body === null || typeof request.body !== 'object' || Array.isArray(request.body)) {
        next(validationFailure([{ field: 'body', messages: ['body must be an object'] }]));
        return;
      }
      const stack: { value: unknown; depth: number }[] = [{ value: request.body, depth: 0 }];
      while (stack.length) {
        const { value, depth } = stack.pop()!;
        if (value !== null && typeof value === 'object') {
          if (depth > 16) {
            next(new BadRequestException({ code: 'PAYLOAD_TOO_COMPLEX', message: 'Request body is nested too deeply' }));
            return;
          }
          for (const [key, child] of Object.entries(value)) {
            if (['__proto__', 'constructor', 'prototype'].includes(key)) {
              next(validationFailure([{ field: 'body', messages: ['body contains a forbidden property'] }]));
              return;
            }
            stack.push({ value: child, depth: depth + 1 });
          }
        }
      }
    }
    next();
  });
}
