import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getTopReferrers } from './getTopReferrers';

const { state, prismaRawQuery, prismaParseFilters, clickhouseRawQuery, clickhouseParseFilters } =
  vi.hoisted(() => ({
    state: { mode: 'prisma' as 'prisma' | 'clickhouse' },
    prismaRawQuery: vi.fn(),
    prismaParseFilters: vi.fn(),
    clickhouseRawQuery: vi.fn(),
    clickhouseParseFilters: vi.fn(),
  }));

vi.mock('@/lib/db', () => ({
  CLICKHOUSE: 'clickhouse',
  PRISMA: 'prisma',
  runQuery: vi.fn((queries: Record<string, () => unknown>) => queries[state.mode]()),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    rawQuery: prismaRawQuery,
    parseFilters: prismaParseFilters,
  },
}));

vi.mock('@/lib/clickhouse', () => ({
  default: {
    rawQuery: clickhouseRawQuery,
    parseFilters: clickhouseParseFilters,
  },
}));

const parseFiltersResult = {
  queryParams: { websiteId: 'website-1' },
  filterQuery: 'and website_event.utm_source = {{utmSource}}',
  joinSessionQuery: 'join session on session.session_id = website_event.session_id',
  cohortQuery: 'join cohort on cohort.session_id = website_event.session_id',
  excludeBounceQuery: 'and website_event.visit_id in (select visit_id from bounces)',
  dateQuery: 'and website_event.created_at between {{startDate}} and {{endDate}}',
};

beforeEach(() => {
  state.mode = 'prisma';
  prismaRawQuery.mockReset();
  prismaParseFilters.mockReset();
  clickhouseRawQuery.mockReset();
  clickhouseParseFilters.mockReset();

  prismaParseFilters.mockReturnValue(parseFiltersResult);
  clickhouseParseFilters.mockReturnValue(parseFiltersResult);
  prismaRawQuery.mockResolvedValue([]);
  clickhouseRawQuery.mockResolvedValue([]);
});

describe('getTopReferrers postgres branch', () => {
  test('excludes the own hostname and empty referrer_domain, groups and orders by visits', async () => {
    await getTopReferrers('website-1', {}, {});

    expect(prismaRawQuery).toHaveBeenCalledTimes(1);
    const [query, params, tag] = prismaRawQuery.mock.calls[0];

    expect(query).toContain('where website_event.website_id = {{websiteId::uuid}}');
    expect(query).toContain('and website_event.event_type NOT IN (2, 5)');
    expect(query).toContain(
      "and website_event.referrer_domain != regexp_replace(website_event.hostname, '^www.', '')",
    );
    expect(query).toContain("and website_event.referrer_domain != ''");
    expect(query).toContain('group by website_event.referrer_domain');
    expect(query).toContain('order by visits desc');
    expect(query).toContain(parseFiltersResult.filterQuery);
    expect(query).toContain(parseFiltersResult.cohortQuery);
    expect(query).toContain(parseFiltersResult.excludeBounceQuery);
    expect(query).toContain(parseFiltersResult.joinSessionQuery);
    expect(query).toContain(parseFiltersResult.dateQuery);
    expect(query).toContain('limit {{limit::int}}');
    expect(params).toEqual({ ...parseFiltersResult.queryParams, limit: 10 });
    expect(tag).toBe('getTopReferrers');
  });

  test('defaults to limit 10 when no limit is given', async () => {
    await getTopReferrers('website-1', {}, {});
    const [query, params] = prismaRawQuery.mock.calls[0];

    expect(query).toContain('limit {{limit::int}}');
    expect(params.limit).toBe(10);
  });

  test('uses a caller-supplied limit when given', async () => {
    await getTopReferrers('website-1', { limit: 25 }, {});
    const [query, params] = prismaRawQuery.mock.calls[0];

    expect(query).toContain('limit {{limit::int}}');
    expect(params.limit).toBe(25);
  });

  test('coerces visits to a number in results', async () => {
    prismaRawQuery.mockResolvedValue([{ referrer: 'google.com', visits: '42' }]);

    const result = await getTopReferrers('website-1', {}, {});

    expect(result).toEqual([{ referrer: 'google.com', visits: 42 }]);
  });
});

describe('getTopReferrers clickhouse branch', () => {
  beforeEach(() => {
    state.mode = 'clickhouse';
  });

  test('excludes the own hostname and empty referrer_domain using uniq(visit_id)', async () => {
    await getTopReferrers('website-1', {}, {});

    expect(clickhouseRawQuery).toHaveBeenCalledTimes(1);
    expect(prismaRawQuery).not.toHaveBeenCalled();
    const [query, params, tag] = clickhouseRawQuery.mock.calls[0];

    expect(query).toContain('where website_id = {websiteId:UUID}');
    expect(query).toContain('and event_type NOT IN (2, 5)');
    expect(query).toContain('and referrer_domain != hostname');
    expect(query).toContain("and referrer_domain != ''");
    expect(query).toContain('uniq(visit_id) as "visits"');
    expect(query).toContain('group by referrer_domain');
    expect(query).toContain('order by visits desc');
    expect(query).toContain(parseFiltersResult.filterQuery);
    expect(query).toContain(parseFiltersResult.cohortQuery);
    expect(query).toContain(parseFiltersResult.excludeBounceQuery);
    expect(query).toContain(parseFiltersResult.dateQuery);
    expect(query).toContain('limit {limit:UInt32}');
    expect(params).toEqual({ ...parseFiltersResult.queryParams, limit: 10 });
    expect(tag).toBe('getTopReferrers');
    // clickhouse branch does not join a session table
    expect(query).not.toContain(parseFiltersResult.joinSessionQuery);
  });

  test('defaults to limit 10 when no limit is given', async () => {
    await getTopReferrers('website-1', {}, {});
    const [query, params] = clickhouseRawQuery.mock.calls[0];

    expect(query).toContain('limit {limit:UInt32}');
    expect(params.limit).toBe(10);
  });

  test('uses a caller-supplied limit when given', async () => {
    await getTopReferrers('website-1', { limit: 25 }, {});
    const [query, params] = clickhouseRawQuery.mock.calls[0];

    expect(query).toContain('limit {limit:UInt32}');
    expect(params.limit).toBe(25);
  });
});
