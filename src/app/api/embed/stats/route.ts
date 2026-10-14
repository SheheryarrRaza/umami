import { getEmbedAuth } from '@/lib/embed';
import { json, unauthorized } from '@/lib/response';
import { getWebsite } from '@/queries/prisma';

export async function GET(request: Request) {
  const embed = getEmbedAuth(request);

  if (!embed) {
    return unauthorized();
  }

  const website = await getWebsite(embed.websiteId);

  return json({ id: website?.id, name: website?.name, domain: website?.domain });
}
