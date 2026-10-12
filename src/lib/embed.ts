import jwt from 'jsonwebtoken';

const EMBED_SIGNING_KEY = process.env.EMBED_SIGNING_KEY;

export function createEmbedToken(websiteId: string) {
  return jwt.sign({ websiteId, type: 'embed' }, EMBED_SIGNING_KEY as string, {
    expiresIn: '30d',
  });
}

export function getEmbedAuth(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')?.[1];

  if (!token) {
    return null;
  }

  const payload = jwt.decode(token) as { websiteId?: string; type?: string } | null;

  if (payload?.type !== 'embed' || !payload.websiteId) {
    return null;
  }

  return payload as { websiteId: string; type: string };
}
