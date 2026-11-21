import { BadRequestException } from '@nestjs/common';

export interface FieldError {
  field: string;
  messages: string[];
}

export function validationFailure(details: FieldError[]) {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details,
  });
}
