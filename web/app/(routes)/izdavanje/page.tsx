import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Аренда недвижимости - DomGo.rs',
  description: 'Квартиры и дома для долгосрочной аренды в Сербии',
};

export default async function IzdavanjePage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      city:cities(name),
      district:districts(name)
    `)
    .eq('type', 'rent')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  return <PropertyListingsClient type="rent" initialProperties={properties || []} />;
}
