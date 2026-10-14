import { cookies } from 'next/headers';
import { parseRequest } from '@/lib/request';
import { ok } from '@/lib/response';

const REMEMBER_DAYS = 30;

export async function POST(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const cookieStore = await cookies();

  cookieStore.set('umami.auth', auth.token, {
    path: '/',
    maxAge: REMEMBER_DAYS * 24 * 60 * 60,
    sameSite: 'lax',
    httpOnly: false,
    secure: false,
  });

  return ok();
}
