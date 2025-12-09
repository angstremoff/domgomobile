import { Metadata } from 'next';
import { AgencyPageClient } from '@/components/agency/AgencyPageClient';
import { generateAgencyTitle } from '@/lib/seo-utils';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const id = (params.agencyId as string) || (params.id as string);
  const lang = (params.lang as 'sr' | 'ru') || 'sr';

  if (!id) {
    return {
      title: 'Agencija - DomGo.rs',
      description: 'Detalji agencije za nekretnine'
    };
  }

  const title = generateAgencyTitle({ name: 'Agencija', city: null }, lang);
  const description = lang === 'ru'
    ? 'Детали агентства недвижимости.'
    : 'Detalji agencije za nekretnine.';

  return {
    title,
    description,
  };
}

export default function AgencijaPage() {
  return <AgencyPageClient />;
}
