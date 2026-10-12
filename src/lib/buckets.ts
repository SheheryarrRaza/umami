import { DATE_FORMATS, DATE_FUNCTIONS, formatDate } from '@/lib/date';

type BucketUnit = keyof typeof DATE_FUNCTIONS;

export interface BucketRow {
  date: string;
  count: number;
}

export function getDateBuckets(startDate: Date, endDate: Date, unit: BucketUnit): Date[] {
  const { diff, add, start } = DATE_FUNCTIONS[unit];
  const first = start(startDate);
  const count = diff(endDate, first);

  return Array.from({ length: count }, (_, i) => add(first, i));
}

export function fillDateBuckets(
  rows: BucketRow[],
  startDate: Date,
  endDate: Date,
  unit: BucketUnit,
): BucketRow[] {
  const counts = new Map(rows.map(row => [row.date, row.count]));
  const format = DATE_FORMATS[unit];

  return getDateBuckets(startDate, endDate, unit).map(bucket => {
    const date = formatDate(bucket, format);

    return { date, count: counts.get(date) ?? 0 };
  });
}
