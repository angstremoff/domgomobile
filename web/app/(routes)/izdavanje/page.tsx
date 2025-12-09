import { Metadata } from 'next';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Izdavanje nekretnina | Аренда недвижимости',
  description: 'Stanovi i kuće za dugoročni zakup u Srbiji. Квартиры и дома в долгосрочную аренду в Сербии.',
  keywords: ['izdavanje stanova', 'zakup nekretnina', 'kirija stan', 'аренда квартир', 'снять квартиру в сербии'],
  openGraph: {
    title: 'Izdavanje nekretnina - DomGo.rs',
    description: 'Stanovi i kuće za dugoročni zakup u Srbiji',
    url: 'https://domgo.rs/izdavanje',
  },
  alternates: {
    canonical: 'https://domgo.rs/izdavanje',
  },
};

export default function IzdavanjePage() {
  // Данные загружаются на клиенте в PropertyListingsClient
  return <PropertyListingsClient type="rent" initialProperties={[]} />;
}
