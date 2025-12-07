import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/profil/', '/api/', '/_next/'],
      },
    ],
    sitemap: 'https://domgo.rs/sitemap.xml',
  };
}
