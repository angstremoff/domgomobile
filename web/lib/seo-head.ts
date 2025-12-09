const DEFAULT_SITE_URL = 'https://domgo.rs';

function getHead(): HTMLHeadElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.head || document.querySelector('head');
}

export function upsertMetaTag(
  name: string,
  content: string | null | undefined,
  attribute: 'name' | 'property' = 'name',
): void {
  if (!content) {
    return;
  }
  const head = getHead();
  if (!head) {
    return;
  }

  const selector = attribute === 'name'
    ? `meta[name="${name}"]`
    : `meta[property="${name}"]`;
  let tag = head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function setCanonicalLink(url: string): void {
  if (!url) {
    return;
  }
  const head = getHead();
  if (!head) {
    return;
  }

  let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export function upsertJsonLd(id: string, data: Record<string, unknown>): void {
  const head = getHead();
  if (!head) {
    return;
  }

  const scriptId = id || 'structured-data';
  let script = head.querySelector<HTMLScriptElement>(`#${scriptId}`);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export { DEFAULT_SITE_URL };
