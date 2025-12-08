import { Metadata } from 'next';
import { PropertyPageClient } from '@/components/property/PropertyPageClient';

export const metadata: Metadata = {
  title: 'Oglas - DomGo.rs',
  description: 'Detalji oglasa nekretnine',
};

export default function OglasPage() {
  return <PropertyPageClient />;
}
