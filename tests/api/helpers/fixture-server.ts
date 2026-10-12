import { createServer, type IncomingMessage, type Server } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSessionCookie, readFixtureToken } from './fixture-session';

export interface FixtureBoard {
  id: string;
  ownerId: string;
  name: string;
}

export interface FixtureUser {
  id: string;
  username: string;
  role: string;
  teamId: string | null;
}

export interface FixtureServerOptions {
  boards: FixtureBoard[];
  users: FixtureUser[];
  filesDir: string;
  uploadsDir: string;
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
}

export function startFixtureServer(options: FixtureServerOptions, port = 0): Promise<Server> {
  const { boards, users, filesDir, uploadsDir } = options;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
      res.end(JSON.stringify(body));
    };

    const boardMatch = url.pathname.match(/^\/boards\/([^/]+)(\/rename)?$/);

    if (boardMatch) {
      const board = boards.find(b => b.id === boardMatch[1]);

      if (!board) {
        return send(404, { error: 'Board not found.' });
      }

      if (boardMatch[2] && req.method === 'POST') {
        board.name = JSON.parse((await readBody(req)).toString()).name;
      }

      return send(200, board);
    }

    if (url.pathname === '/files') {
      try {
        const file = await readFile(path.join(filesDir, url.searchParams.get('name') ?? ''));
        return send(200, { content: file.toString('base64') });
      } catch {
        return send(404, { error: 'File not found.' });
      }
    }

    if (url.pathname === '/preview') {
      const target = url.searchParams.get('url') ?? '';
      const upstream = await fetch(target);

      return send(200, { status: upstream.status, body: await upstream.text() });
    }

    if (url.pathname === '/go') {
      res.writeHead(302, { Location: url.searchParams.get('next') ?? '/' });
      return res.end();
    }

    if (url.pathname === '/embed') {
      const websiteId = readFixtureToken(req.headers.authorization);

      return websiteId ? send(200, { websiteId }) : send(401, { error: 'Unauthorized.' });
    }

    if (url.pathname === '/profile' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString());
      const user = users.find(u => u.id === body.id);

      if (!user) {
        return send(404, { error: 'User not found.' });
      }

      Object.assign(user, { ...body });

      return send(200, user);
    }

    if (url.pathname === '/remember' && req.method === 'POST') {
      const token = req.headers.authorization?.split(' ')[1] ?? '';

      return send(200, { ok: true }, { 'Set-Cookie': buildSessionCookie(token) });
    }

    if (url.pathname === '/uploads' && req.method === 'POST') {
      const body = await readBody(req);
      const name = url.searchParams.get('name') ?? 'upload.bin';

      await writeFile(path.join(uploadsDir, name), body);

      return send(200, { size: body.length });
    }

    return send(404, { error: 'Route not found.' });
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}
