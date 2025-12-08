import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AgencyDetails } from '@/components/agency/AgencyDetails';
import type { Database } from '@shared/lib/database.types';

type Agency = Database['public']['Tables']['agency_profiles']['Row'];
type Property = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: agencyData } = await supabase
    .from('agency_profiles')
    .select('name, description')
    .eq('id', id)
    .single();

  const agency = agencyData as Agency | null;

  if (!agency) {
    return {
      title: 'Agencija nije pronađena - DomGo.rs',
    };
  }

  return {
    title: `${agency.name} - DomGo.rs`,
    description: agency.description || 'Agencija za nekretnine DomGo.rs',
  };
}

export default async function AgencyPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agency_profiles')
    .select('*')
    .eq('id', id)
    .single();

  // Фолбек: если передали user_id вместо agency_id
  const resolvedAgency: Agency | null = agency
    ? (agency as Agency)
    : await supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', id)
        .single()
        .then(({ data }) => (data as Agency | null));

  if (!resolvedAgency) {
    notFound();
    return null;
  }

  const { data: propertiesByAgency } = await supabase
    .from('properties')
    .select(`
      *,
      city:cities(name),
      district:districts(name)
    `)
    .eq('agency_id', resolvedAgency.id)
    .order('created_at', { ascending: false })
    .limit(60);

  const properties =
    propertiesByAgency && propertiesByAgency.length > 0
      ? (propertiesByAgency as Property[])
      : await supabase
          .from('properties')
          .select(`
            *,
            city:cities(name),
            district:districts(name)
          `)
          .eq('user_id', resolvedAgency.user_id)
          .order('created_at', { ascending: false })
          .limit(60)
          .then(({ data }) => (data as Property[]) || []);

  return <AgencyDetails agency={resolvedAgency as Agency} properties={properties} />;
}
