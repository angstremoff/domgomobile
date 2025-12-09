import { Metadata } from 'next';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Novogradnja | Новостройки',
  description: 'Stanovi u novim stambenim kompleksima Srbije. Квартиры в новостройках Сербии от застройщиков.',
  keywords: ['novogradnja', 'novi stanovi', 'stambeni kompleksi', 'новостройки сербия', 'квартиры от застройщика'],
  openGraph: {
    title: 'Novogradnja - DomGo.rs',
    description: 'Stanovi u novim stambenim kompleksima Srbije',
    url: 'https://domgo.rs/novogradnja',
  },
  alternates: {
    canonical: 'https://domgo.rs/novogradnja',
  },
};

export default function NovogradnjaPage() {
  // Данные загружаются на клиенте в PropertyListingsClient
  return <PropertyListingsClient type="sale" isNewBuilding={true} initialProperties={[]} />;
}
