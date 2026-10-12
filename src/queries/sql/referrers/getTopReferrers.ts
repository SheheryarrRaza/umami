import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';
import type { QueryFilters } from '@/lib/types';

const FUNCTION_NAME = 'getTopReferrers';

export interface TopReferrersParameters {
  limit?: number | string;
}

export interface TopReferrersData {
  referrer: string;
  visits: number;
}

export async function getTopReferrers(
  ...args: [websiteId: string, parameters: TopReferrersParameters, filters: QueryFilters]
): Promise<TopReferrersData[]> {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(
  websiteId: string,
  parameters: TopReferrersParameters,
  filters: QueryFilters,
): Promise<TopReferrersData[]> {
  const { limit = 10 } = parameters;
  const { rawQuery, parseFilters } = prisma;
  const { queryParams, filterQuery, joinSessionQuery, cohortQuery, excludeBounceQuery, dateQuery } =
    parseFilters({
      ...filters,
      websiteId,
    });

  return rawQuery(
    `
    select
      website_event.referrer_domain as "referrer",
      count(distinct website_event.visit_id) as "visits"
    from website_event
    ${cohortQuery}
    ${excludeBounceQuery}
    ${joinSessionQuery}
    where website_event.website_id = {{websiteId::uuid}}
      and website_event.event_type NOT IN (2, 5)
      and website_event.referrer_domain != regexp_replace(website_event.hostname, '^www.', '')
      and website_event.referrer_domain != ''
      ${dateQuery}
      ${filterQuery}
    group by website_event.referrer_domain
    order by visits desc
    limit {{limit::int}}
    `,
    { ...queryParams, limit: Number(limit) },
    FUNCTION_NAME,
  ).then(results => results.map(item => ({ ...item, visits: Number(item.visits) })));
}

async function clickhouseQuery(
  websiteId: string,
  parameters: TopReferrersParameters,
  filters: QueryFilters,
): Promise<TopReferrersData[]> {
  const { limit = 10 } = parameters;
  const { rawQuery, parseFilters } = clickhouse;
  const { queryParams, filterQuery, cohortQuery, excludeBounceQuery, dateQuery } = parseFilters({
    ...filters,
    websiteId,
  });

  return rawQuery(
    `
    select
      referrer_domain as "referrer",
      uniq(visit_id) as "visits"
    from website_event
    ${cohortQuery}
    ${excludeBounceQuery}
    where website_id = {websiteId:UUID}
      and event_type NOT IN (2, 5)
      and referrer_domain != hostname
      and referrer_domain != ''
      ${dateQuery}
      ${filterQuery}
    group by referrer_domain
    order by visits desc
    limit {limit:UInt32}
    `,
    { ...queryParams, limit: Number(limit) },
    FUNCTION_NAME,
  );
}
