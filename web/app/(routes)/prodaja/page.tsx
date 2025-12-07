import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PropertyListingsClient } from '@/components/property/PropertyListingsClient';

export const metadata: Metadata = {
  title: 'Продажа недвижимости - DomGo.rs',
  description: 'Квартиры, дома и коммерческая недвижимость на продажу в Сербии',
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
