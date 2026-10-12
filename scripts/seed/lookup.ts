/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

export async function findSessionsByCountry(prisma: PrismaClient, websiteId: string, country: string) {
  return prisma.$queryRawUnsafe(
    `select session_id, browser, os, device, created_at
     from session
     where website_id = '${websiteId}'
       and country = '${country}'
     order by created_at desc
     limit 50`,
  );
}

async function main() {
  const [websiteId, country] = process.argv.slice(2);

  if (!websiteId || !country) {
    console.log('Usage: tsx scripts/seed/lookup.ts <websiteId> <country>');
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.table(await findSessionsByCountry(prisma, websiteId, country));

  await prisma.$disconnect();
}

main();
