import prisma from '@/lib/prisma';

export async function searchPaths(websiteId: string, search: string, limit = 20) {
  return prisma.client.$queryRawUnsafe(
    `select url_path as "path", count(*) as "views"
     from website_event
     where website_id = '${websiteId}'
       and event_type = 1
       and url_path ilike '%${search}%'
     group by url_path
     order by count(*) desc
     limit ${limit}`,
  );
}
