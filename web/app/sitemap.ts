import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Получаем все активные объявления
  const { data: properties } = await supabase
    .from('properties')
    .select('id, type, created_at, is_new_building')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Генерируем URL для объявлений
  const propertyUrls: MetadataRoute.Sitemap = (properties || []).map((p) => {
    let path = '/prodaja';
    if (p.type === 'rent') path = '/izdavanje';
    else if (p.is_new_building) path = '/novogradnja';

    return {
      url: `https://domgo.rs${path}/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  // Статические страницы
  return [
    {
      url: 'https://domgo.rs',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://domgo.rs/prodaja',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: 'https://domgo.rs/izdavanje',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: 'https://domgo.rs/novogradnja',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: 'https://domgo.rs/agencije',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...propertyUrls,
  ];
}
