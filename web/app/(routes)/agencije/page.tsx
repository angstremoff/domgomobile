import { Metadata } from 'next';
import { AgenciesListClient } from '@/components/agency/AgenciesListClient';

export const metadata: Metadata = {
  title: 'Agencije za nekretnine | Агентства недвижимости',
  description: 'Proverene agencije za nekretnine u Srbiji. Проверенные агентства недвижимости в Сербии.',
  keywords: ['agencije za nekretnine', 'real estate agencies serbia', 'агентства недвижимости сербия'],
  openGraph: {
    title: 'Agencije za nekretnine - DomGo.rs',
    description: 'Proverene agencije za nekretnine u Srbiji',
    url: 'https://domgo.rs/agencije',
  },
  alternates: {
    canonical: 'https://domgo.rs/agencije',
  },
};

export default function AgenciePage() {
  return <AgenciesListClient />;
}
