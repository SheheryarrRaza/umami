import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { uuid } from '@/lib/crypto';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import { updateUser } from '@/queries/prisma';

const AVATAR_DIR = process.env.AVATAR_DIR || path.join(process.cwd(), 'public', 'avatars');

export async function POST(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return badRequest({ message: 'A file is required.' });
  }

  const extension = path.extname(file.name) || '.png';
  const fileName = `${uuid()}${extension}`;

  await mkdir(AVATAR_DIR, { recursive: true });
  await writeFile(path.join(AVATAR_DIR, fileName), Buffer.from(await file.arrayBuffer()));

  const user = await updateUser(auth.user.id, { logoUrl: `/avatars/${fileName}` });

  return json(user);
}
