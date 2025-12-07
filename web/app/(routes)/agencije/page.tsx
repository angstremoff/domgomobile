import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AgenciesList } from '@/components/agency/AgenciesList';
import type { Database } from '@shared/lib/database.types';

export const metadata: Metadata = {
  title: 'Agencije za nekretnine - DomGo.rs',
  description: 'Proverene agencije za nekretnine u Srbiji',
};

export default async function AgenciePage() {
  const supabase = await createClient();

  const { data: agencies, error } = await supabase
    .from('agency_profiles')
    .select('id, name, phone, email, site, location, logo_url, description')
    .order('name', { ascending: true })
    .limit(50);

  return <AgenciesList agencies={(agencies ?? []) as Agency[]} hasError={Boolean(error)} />;
}

type Agency = Database['public']['Tables']['agency_profiles']['Row'];
