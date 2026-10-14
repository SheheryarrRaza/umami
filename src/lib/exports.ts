import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const EXPORT_DIR = process.env.EXPORT_DIR || path.join(process.cwd(), 'exports');

export async function readExportFile(websiteId: string, fileName: string) {
  const filePath = path.join(EXPORT_DIR, websiteId, fileName);

  return readFile(filePath);
}
