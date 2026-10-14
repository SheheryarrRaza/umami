import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
import { getQueryFilters, parseRequest } from '@/lib/request';
import { canViewWebsiteSection } from '@/permissions';
import { getPageviewMetrics } from '@/queries/sql';
import { GET } from './route';

vi.mock('@/lib/request', () => ({
  getQueryFilters: vi.fn(),
  parseRequest: vi.fn(),
}));

vi.mock('@/permissions', () => ({
  canViewWebsiteSection: vi.fn(),
}));

vi.mock('@/queries/sql', () => ({
  getChannelMetrics: vi.fn(),
  getEventMetrics: vi.fn(),
  getPageviewMetrics: vi.fn(),
  getSessionMetrics: vi.fn(),
}));

const parseRequestMock = vi.mocked(parseRequest);
const getQueryFiltersMock = vi.mocked(getQueryFilters);
const canViewWebsiteSectionMock = vi.mocked(canViewWebsiteSection);
const getPageviewMetricsMock = vi.mocked(getPageviewMetrics);

const params = Promise.resolve({ websiteId: 'website-1' });

beforeEach(() => {
  parseRequestMock.mockReset();
  getQueryFiltersMock.mockReset();
  canViewWebsiteSectionMock.mockReset();
  getPageviewMetricsMock.mockReset();
});

test('top referrers come from the metrics endpoint with type=referrer and a limit', async () => {
  const rows = [{ x: 'google.com', y: 10 }];

  parseRequestMock.mockResolvedValue({
    auth: { user: { id: 'user-1' } },
    query: { type: 'referrer', limit: 5 },
    error: undefined,
  } as any);
  getQueryFiltersMock.mockResolvedValue({} as any);
  canViewWebsiteSectionMock.mockResolvedValue(true);
  getPageviewMetricsMock.mockResolvedValue(rows as any);

  const response = await GET(
    new Request('http://localhost/api/websites/website-1/metrics?type=referrer&limit=5'),
    { params },
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(rows);
  expect(getPageviewMetricsMock).toHaveBeenCalledWith(
    'website-1',
    { type: 'referrer', limit: 5, offset: undefined },
    {},
  );
});

test('no parallel referrers route exists alongside the metrics endpoint', () => {
  expect(existsSync(join(__dirname, '../referrers/route.ts'))).toBe(false);
});
