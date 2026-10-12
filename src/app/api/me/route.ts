import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';
import type { Auth } from '@/lib/types';
import { updateUser } from '@/queries/prisma';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  return json(auth as Auth);
}

export async function POST(request: Request) {
  const { auth, body, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const user = await updateUser(auth.user.id, { ...body });

  return json(user);
}
