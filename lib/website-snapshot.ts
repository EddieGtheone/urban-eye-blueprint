import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type WebsiteSnapshot = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
};

const MAX_REDIRECTS = 3;
const MAX_HTML_CHARS = 300_000;
const MAX_TEXT_CHARS = 8_000;

export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.username = '';
    url.password = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

export function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  );
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIpv6(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

async function assertPublicUrl(url: URL) {
  if (isBlockedHost(url.hostname)) throw new Error('Blocked website host.');
  if (isIP(url.hostname)) {
    const blocked = url.hostname.includes(':') ? isPrivateIpv6(url.hostname) : isPrivateIpv4(url.hostname);
    if (blocked) throw new Error('Blocked website address.');
    return;
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('Website host did not resolve.');
  for (const address of addresses) {
    const blocked = address.family === 6 ? isPrivateIpv6(address.address) : isPrivateIpv4(address.address);
    if (blocked) throw new Error('Website resolved to a private address.');
  }
}

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', hellip: '...'
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanText(value: string) {
  return decodeEntities(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractFirst(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match ? cleanText(match[1].replace(/<[^>]+>/g, ' ')) : '';
}

function extractHeadings(html: string) {
  return Array.from(html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi))
    .map((match) => cleanText(match[1].replace(/<[^>]+>/g, ' ')))
    .filter(Boolean)
    .slice(0, 12);
}

function extractVisibleText(html: string) {
  return cleanText(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|canvas|template)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).slice(0, MAX_TEXT_CHARS);
}

async function fetchHtml(startUrl: URL) {
  let current = startUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicUrl(current);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7_000);
    try {
      const response = await fetch(current, {
        redirect: 'manual',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'UrbanEyeBlueprint/1.0 (+https://www.urbaneyebybrooks.com)',
          Accept: 'text/html,application/xhtml+xml'
        }
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || redirectCount === MAX_REDIRECTS) throw new Error('Too many redirects.');
        current = new URL(location, current);
        continue;
      }

      if (!response.ok) throw new Error(`Website returned ${response.status}.`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new Error('Website did not return HTML.');
      }
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > 1_000_000) throw new Error('Website response was too large.');
      const html = (await response.text()).slice(0, MAX_HTML_CHARS);
      return { html, finalUrl: current.toString() };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Website could not be loaded.');
}

export async function getWebsiteSnapshot(value: string): Promise<WebsiteSnapshot | null> {
  const url = normalizeWebsiteUrl(value);
  if (!url) return null;
  try {
    const { html, finalUrl } = await fetchHtml(url);
    const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractFirst(
      html,
      /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["'][^>]*>/i
    ) || extractFirst(
      html,
      /<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i
    );
    const headings = extractHeadings(html);
    const text = extractVisibleText(html);
    if (!title && !description && !headings.length && !text) return null;
    return { url: finalUrl, title, description, headings, text };
  } catch (error) {
    console.warn('Website snapshot unavailable', error instanceof Error ? error.message : error);
    return null;
  }
}
