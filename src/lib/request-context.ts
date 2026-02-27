import type { NextApiRequest } from 'next';

export function getForwardedProto(req: NextApiRequest): string {
  const proto = req.headers['x-forwarded-proto'];
  if (Array.isArray(proto)) return proto[0] ?? 'http';
  return proto ?? 'http';
}

export function shouldUseSecureCookies(req: NextApiRequest): boolean {
  return getForwardedProto(req) === 'https';
}
