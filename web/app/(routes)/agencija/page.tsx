import { Metadata } from 'next';
import { AgencyPageClient } from '@/components/agency/AgencyPageClient';

export const metadata: Metadata = {
  title: 'Agencija - DomGo.rs',
  description: 'Detalji agencije za nekretnine',
};

export default function AgencijaPage() {
  return <AgencyPageClient />;
}
