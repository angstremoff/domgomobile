import { Metadata } from 'next';
import { AgenciesListClient } from '@/components/agency/AgenciesListClient';

export const metadata: Metadata = {
  title: 'Agencije za nekretnine - DomGo.rs',
  description: 'Proverene agencije za nekretnine u Srbiji',
};

export default function AgenciePage() {
  return <AgenciesListClient />;
}
