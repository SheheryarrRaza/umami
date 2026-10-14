import { z } from 'zod';
import { getLinkPreview } from '@/lib/link-preview';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';

export async function GET(request: Request) {
  const schema = z.object({
    url: z.string().max(2000),
  });

  const { query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  try {
    const preview = await getLinkPreview(query.url);

    return json(preview);
  } catch {
    return badRequest({ message: 'Unable to load a preview for this URL.' });
  }
}
