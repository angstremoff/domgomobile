import { Metadata } from 'next';
import { AgencyPageClient } from '@/components/agency/AgencyPageClient';
import { createClient } from '@supabase/supabase-js';
import { generateAgencyTitle } from '@/lib/seo-utils';
import type { Database } from '@shared/lib/database.types';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type Agency = Database['public']['Tables']['agency_profiles']['Row'] & {
  city?: { name: string } | null;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const id = params.agencyId as string || params.id as string;
  const lang = (params.lang as 'sr' | 'ru') || 'sr';

  if (!id) {
    return {
      title: 'Agencija - DomGo.rs',
      description: 'Detalji agencije za nekretnine'
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
      .from('agency_profiles')
      .select(`
    *,
    city: cities(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    const agency = data as Agency | null;

    if (!agency) {
      return {
        title: 'Agencija nije pronađena | DomGo.rs',
        description: 'Tražena agencija ne postoji.'
      };
    }

    const title = generateAgencyTitle(agency, lang);
    const description = agency.description
      ? (agency.description.slice(0, 160) + (agency.description.length > 160 ? '...' : ''))
      : `Pogledajte ponudu nekretnina agencije ${agency.name} na DomGo.rs`;

    const images = agency.logo_url ? [agency.logo_url] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images,
      }
    };
  } catch (error) {
    console.error('Ошибка generateMetadata agencija:', error);
    return {
      title: 'Agencija - DomGo.rs',
      description: 'Detalji agencije za nekretnine'
    };
  }
}

export default function AgencijaPage() {
  return <AgencyPageClient />;
}
