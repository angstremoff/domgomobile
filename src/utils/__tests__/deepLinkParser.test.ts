import { describe, expect, it } from 'vitest';
import { parseDeepLink } from '../deepLinkParser';

describe('parseDeepLink', () => {
  it('parses auth callback with tokens', () => {
    const url =
      'domgomobile://auth/callback?access_token=abc123&refresh_token=ref456&type=signup';
    const parsed = parseDeepLink(url);
    expect(parsed).toEqual({
      type: 'auth',
      accessToken: 'abc123',
      refreshToken: 'ref456',
      raw: url,
    });
  });

  it('parses native property path', () => {
    const url = 'domgomobile://property/123';
    const parsed = parseDeepLink(url);
    expect(parsed).toEqual({ type: 'property', propertyId: '123', raw: url });
  });

  it('parses native property query', () => {
    const url = 'domgomobile://property?id=xyz';
    const parsed = parseDeepLink(url);
    expect(parsed).toEqual({ type: 'property', propertyId: 'xyz', raw: url });
  });

  it('parses web property link', () => {
    const url = 'https://domgo.rs/property/789';
    const parsed = parseDeepLink(url);
    expect(parsed).toEqual({ type: 'property', propertyId: '789', raw: url });
  });

  it('parses GitHub pages handler', () => {
    const url = 'https://angstremoff.github.io/domgomobile/deeplink-handler.html?id=555';
    const parsed = parseDeepLink(url);
    expect(parsed).toEqual({ type: 'property', propertyId: '555', raw: url });
  });

  it('returns unknown for unsupported link', () => {
    const url = 'https://example.com/test';
    const parsed = parseDeepLink(url);
    expect(parsed).toEqual({ type: 'unknown', raw: url });
  });
});
