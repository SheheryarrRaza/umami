import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, notFound } from '@/lib/response';
import { getBoard, updateBoard } from '@/queries/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const schema = z.object({
    name: z.string().max(200),
  });

  const { body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { boardId } = await params;

  const board = await getBoard(boardId);

  if (!board) {
    return notFound({ message: 'Board not found.' });
  }

  const updated = await updateBoard(boardId, { name: body.name });

  return json(updated);
}
