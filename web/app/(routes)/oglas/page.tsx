import { Metadata } from 'next';
import { PropertyPageClient } from '@/components/property/PropertyPageClient';
import { createClient } from '@supabase/supabase-js';
import { generatePropertyTitle, generatePropertyDescription } from '@/lib/seo-utils';
import type { Database } from '@shared/lib/database.types';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type Property = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const id = params.id as string;
  const lang = (params.lang as 'sr' | 'ru') || 'sr';

  if (!id) {
    return {
      title: 'Oglas - DomGo.rs',
      description: 'Detalji oglasa nekretnine'
    };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase env is missing');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        city:cities(name),
        district:districts(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    const property = data as Property | null;

    if (!property) {
      return {
        title: 'Oglas nije pronađen | DomGo.rs',
        description: 'Traženi oglas više nije aktivan ili ne postoji.'
      };
    }

    const title = generatePropertyTitle(property, lang);
    const description = generatePropertyDescription(property, lang);
    const images = property.images && property.images.length > 0 ? [property.images[0]] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      }
    };
  } catch (error) {
    console.error('Ошибка generateMetadata oglas:', error);
    return {
      title: 'Oglas - DomGo.rs',
      description: 'Detalji oglasa nekretnine',
    };
  }
}

export default function OglasPage() {
  return <PropertyPageClient />;
}
