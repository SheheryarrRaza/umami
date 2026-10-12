import { z } from 'zod';
import { readExportFile } from '@/lib/exports';
import { parseRequest } from '@/lib/request';
import { notFound, unauthorized } from '@/lib/response';
import { canViewWebsite } from '@/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const schema = z.object({
    file: z.string().max(255),
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { websiteId } = await params;

  if (!(await canViewWebsite(auth, websiteId))) {
    return unauthorized();
  }

  try {
    const content = await readExportFile(websiteId, query.file);

    return new Response(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${query.file.split('/').pop()}"`,
      },
    });
  } catch {
    return notFound({ message: 'Export file not found.' });
  }
}
