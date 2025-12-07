import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Prodaja nekretnina - DomGo.rs',
  description: 'Stanovi, kuće i poslovni prostori na prodaju u Srbiji',
};

export default async function ProdajaPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      city:cities(name),
      district:districts(name)
    `)
    .eq('type', 'sale')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  return <PropertyListingsClient type="sale" initialProperties={properties || []} />;
}
