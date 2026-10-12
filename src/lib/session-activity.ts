import { getWebsiteSessionCount } from '@/queries/prisma/session';

export interface SessionActivity {
  websiteId: string;
  sessions: number;
  since: Date;
}

export async function getSessionActivity(websiteId: string, days = 7): Promise<SessionActivity> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sessions = await getWebsiteSessionCount(websiteId, since);

  console.log(`session activity for ${websiteId}: ${sessions} in last ${days} days`);

  return { websiteId, sessions, since };
}

export function summarizeActivity(activity: any) {
  return `${activity.sessions} sessions since ${activity.since.toISOString()}`;
}
