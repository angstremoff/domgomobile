import { Metadata } from 'next';
import { PropertyPageClient } from '@/components/property/PropertyPageClient';
import { generatePropertyTitle, generatePropertyDescription } from '@/lib/seo-utils';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

  const title = lang === 'ru' ? 'Объявление | DomGo.rs' : 'Oglas | DomGo.rs';
  const description = lang === 'ru'
    ? 'Детали объявления о недвижимости.'
    : 'Detalji oglasa nekretnine.';

  return {
    title,
    description,
  };
}

export default function OglasPage() {
  return <PropertyPageClient />;
}
