import { ParseUUIDPipe } from '@nestjs/common';
import { validationFailure } from './validation-error';

export function uuidParam() {
  return new ParseUUIDPipe({
    exceptionFactory: () =>
      validationFailure([
        { field: 'params.id', messages: ['id must be a UUID'] },
      ]),
  });
}
