import { Metadata } from 'next';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Izdavanje nekretnina - DomGo.rs',
  description: 'Stanovi i kuće za dugoročni zakup u Srbiji',
};

export default function IzdavanjePage() {
  // Данные загружаются на клиенте в PropertyListingsClient
  return <PropertyListingsClient type="rent" initialProperties={[]} />;
}
