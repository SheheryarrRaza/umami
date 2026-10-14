export interface LinkPreview {
  url: string;
  title: string | null;
}

export async function getLinkPreview(url: string): Promise<LinkPreview> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'umami-link-preview' },
    redirect: 'follow',
    signal: AbortSignal.timeout(5000),
  });

  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;

  return { url, title };
}
