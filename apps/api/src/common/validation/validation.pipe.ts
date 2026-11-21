import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { validationFailure, type FieldError } from './validation-error';

function fields(errors: ValidationError[], prefix = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    return [
      ...(error.constraints
        ? [{ field, messages: Object.values(error.constraints) }]
        : []),
      ...fields(error.children ?? [], field),
    ];
  });
}

export function createValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => validationFailure(fields(errors)),
  });
}
