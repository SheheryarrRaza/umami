import jwt from 'jsonwebtoken';

const FIXTURE_TOKEN_KEY = process.env.EMBED_SIGNING_KEY as string;

export function createFixtureToken(websiteId: string) {
  return jwt.sign({ websiteId, type: 'embed' }, FIXTURE_TOKEN_KEY, { expiresIn: '1h' });
}

export function readFixtureToken(authorization?: string) {
  const token = authorization?.split(' ')[1];

  if (!token) {
    return null;
  }

  const payload = jwt.decode(token) as { websiteId?: string; type?: string } | null;

  return payload?.type === 'embed' ? (payload.websiteId ?? null) : null;
}

export function buildSessionCookie(token: string) {
  return `umami.auth=${token}; Path=/; Max-Age=2592000`;
}
