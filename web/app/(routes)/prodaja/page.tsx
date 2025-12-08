import { Metadata } from 'next';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Prodaja nekretnina - DomGo.rs',
  description: 'Stanovi, kuće i poslovni prostori na prodaju u Srbiji',
};

export default function ProdajaPage() {
  // Данные загружаются на клиенте в PropertyListingsClient
  return <PropertyListingsClient type="sale" initialProperties={[]} />;
}
