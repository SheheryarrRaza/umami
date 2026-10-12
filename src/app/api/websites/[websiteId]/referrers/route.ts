import { referrersQuerySchema } from '@/lib/analytics-schema';
import { getQueryFilters, parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { canViewWebsite } from '@/permissions';
import { getTopReferrers } from '@/queries/sql/referrers/getTopReferrers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { auth, query, error } = await parseRequest(request, referrersQuerySchema);
  if (error) return error();
  const { websiteId } = await params;
  if (!(await canViewWebsite(auth, websiteId))) return unauthorized();
  const filters = await getQueryFilters(query, websiteId);
  return json(await getTopReferrers(websiteId, { limit: query.limit }, filters));
}
