import { registerDecorator } from 'class-validator';

export function MaxUtf8Bytes(limit: number): PropertyDecorator {
  return (target, property) =>
    registerDecorator({
      name: 'maxUtf8Bytes',
      target: target.constructor,
      propertyName: String(property),
      constraints: [limit],
      validator: {
        validate: (value) =>
          typeof value === 'string' &&
          Buffer.byteLength(value, 'utf8') <= limit,
        defaultMessage: (args) =>
          `${args!.property} must be at most ${limit} UTF-8 bytes`,
      },
    });
}
