export function jwtOptions() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  const expires = process.env.JWT_EXPIRES_IN || '1d';
  const match = /^(\d+)(s|m|h|d)$/.exec(expires);
  if (!match)
    throw new Error(
      'JWT_EXPIRES_IN must be a positive duration such as 1d or 30m',
    );
  const seconds =
    Number(match[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[match[2]]!;
  if (!Number.isSafeInteger(seconds) || seconds <= 0)
    throw new Error('Invalid JWT_EXPIRES_IN');
  return {
    secret,
    signOptions: {
      algorithm: 'HS256' as const,
      expiresIn: seconds,
      issuer: 'brewlite-api',
      audience: 'brewlite-client',
    },
    verifyOptions: {
      algorithms: ['HS256' as const],
      issuer: 'brewlite-api',
      audience: 'brewlite-client',
    },
  };
}
