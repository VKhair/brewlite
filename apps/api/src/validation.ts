import { BadRequestException, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { registerDecorator, ValidationError } from 'class-validator';

export interface FieldError { field: string; messages: string[]; }

function fields(errors: ValidationError[], prefix = ''): FieldError[] {
  return errors.flatMap(error => {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    return [ ...(error.constraints ? [{ field, messages: Object.values(error.constraints) }] : []),
      ...fields(error.children ?? [], field) ];
  });
}

export function validationFailure(details: FieldError[]) {
  return new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Validation failed', details });
}

export function createValidationPipe() {
  return new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true,
    forbidUnknownValues: true, validationError: { target: false, value: false },
    exceptionFactory: errors => validationFailure(fields(errors)) });
}

export function MaxUtf8Bytes(limit: number): PropertyDecorator {
  return (target, property) => registerDecorator({
    name: 'maxUtf8Bytes', target: target.constructor, propertyName: String(property), constraints: [limit],
    validator: {
      validate: value => typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= limit,
      defaultMessage: args => `${args!.property} must be at most ${limit} UTF-8 bytes`,
    },
  });
}

export function uuidParam() {
  return new ParseUUIDPipe({ exceptionFactory: () => validationFailure([
    { field: 'params.id', messages: ['id must be a UUID'] },
  ]) });
}
