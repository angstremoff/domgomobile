export type ParsedDeepLink =
  | { type: 'auth'; accessToken: string; refreshToken: string; raw: string }
  | { type: 'property'; propertyId: string; raw: string }
  | { type: 'unknown'; raw: string };

const PROPERTY_SCHEMES = [
  'domgomobile://property',
  'https://domgo.rs/property.html',
  'https://domgo.rs/property/',
  'https://angstremoff.github.io/domgomobile/property.html',
  'https://angstremoff.github.io/domgomobile/deeplink-handler.html',
];

/**
 * Парсит входящий deeplink и возвращает тип (auth/property) с извлечёнными параметрами.
 * Функция не вызывает навигацию, только извлекает полезные данные.
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  const raw = url;

  // Auth callback
  if (url.includes('domgomobile://auth/callback')) {
    try {
      const params = new URL(url).searchParams;
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        return { type: 'auth', accessToken, refreshToken, raw };
      }
    } catch {
      /* ignore parse errors */
    }
  }

  const tryParsePropertyId = (): string | null => {
    // Normalize URL to use URL API when possible
    let urlObj: URL | null = null;
    try {
      // URL API требует схему; если нет, добавляем фиктивную
      urlObj = new URL(url);
    } catch {
      // Игнорируем
    }

    // natvie scheme domgomobile://property/123 или domgomobile://property?id=123
    if (url.startsWith('domgomobile://property')) {
      // path variant
      if (url.startsWith('domgomobile://property/')) {
        if (urlObj?.pathname) {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts.length > 0) return parts[parts.length - 1];
        }
        const manual = url.split('domgomobile://property/')[1];
        if (manual?.trim()) return manual.trim();
      } else if (urlObj?.searchParams) {
        const qId = urlObj.searchParams.get('id');
        if (qId) return qId;
        if (url.includes('?id=')) {
          const manual = url.split('?id=')[1];
          if (manual?.trim()) return manual.trim();
        }
      }
    }

    // https://domgo.rs/property/123
    if (url.includes('domgo.rs/property/')) {
      if (urlObj?.pathname) {
        const parts = urlObj.pathname.split('/');
        const idx = parts.indexOf('property') + 1;
        if (idx > 0 && idx < parts.length) return parts[idx];
      }
    }

    // Обработчики на нашем домене и GitHub Pages
    if (
      url.includes('domgo.rs/property.html') ||
      url.includes('angstremoff.github.io/domgomobile/deeplink-handler.html') ||
      url.includes('angstremoff.github.io/domgomobile/property.html')
    ) {
      if (urlObj?.searchParams) {
        const id = urlObj.searchParams.get('id');
        if (id) return id;
      }
    }

    return null;
  };

  const matchesSupportedPropertyHost = PROPERTY_SCHEMES.some((pattern) =>
    url.startsWith(pattern) || url.includes(pattern),
  );

  if (matchesSupportedPropertyHost) {
    const propertyId = tryParsePropertyId();
    if (propertyId) {
      return { type: 'property', propertyId, raw };
    }
  }

  return { type: 'unknown', raw };
}
