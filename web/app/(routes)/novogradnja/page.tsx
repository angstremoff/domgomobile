import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Новостройки - DomGo.rs',
  description: 'Квартиры в новых жилых комплексах Сербии',
};

export default async function NovogradnjaPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      city:cities(name),
      district:districts(name)
    `)
    .eq('is_new_building', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  return <PropertyListingsClient type="sale" isNewBuilding={true} initialProperties={properties || []} />;
}
