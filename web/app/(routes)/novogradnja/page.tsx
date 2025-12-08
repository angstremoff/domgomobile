import { Metadata } from 'next';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Novogradnja - DomGo.rs',
  description: 'Stanovi u novim stambenim kompleksima Srbije',
};

export default function NovogradnjaPage() {
  // Данные загружаются на клиенте в PropertyListingsClient
  return <PropertyListingsClient type="sale" isNewBuilding={true} initialProperties={[]} />;
}
