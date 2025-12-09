import { Metadata } from 'next';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Prodaja nekretnina | Продажа недвижимости',
  description: 'Stanovi, kuće i poslovni prostori na prodaju u Srbiji. Квартиры, дома и коммерческая недвижимость на продажу в Сербии.',
  keywords: ['prodaja nekretnina', 'stanovi na prodaju', 'kuće na prodaju', 'продажа недвижимости', 'квартиры на продажу'],
  openGraph: {
    title: 'Prodaja nekretnina - DomGo.rs',
    description: 'Stanovi, kuće i poslovni prostori na prodaju u Srbiji',
    url: 'https://domgo.rs/prodaja',
  },
  alternates: {
    canonical: 'https://domgo.rs/prodaja',
  },
};

export default function ProdajaPage() {
  // Данные загружаются на клиенте в PropertyListingsClient
  return <PropertyListingsClient type="sale" initialProperties={[]} />;
}
