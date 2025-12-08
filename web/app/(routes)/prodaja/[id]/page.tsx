import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PropertyDetails } from '@/components/property/PropertyDetails';
import type { Database } from '@shared/lib/database.types';

type PageProps = {
  params: Promise<{ id: string }>;
};

type Property = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
  user?: { name: string; phone: string } | null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('title, description, price, location, images, city:cities(name)')
    .eq('id', id)
    .single();

  if (!property) {
    return {
      title: 'Oglas nije pronađen - DomGo.rs',
    };
  }

  const price = new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format((property as Property).price);

  return {
    title: `${property.title} - ${price} | DomGo.rs`,
    description: property.description?.slice(0, 160) || `${property.title} na prodaju`,
    openGraph: {
      title: property.title,
      description: property.description || '',
      images: property.images?.[0] ? [property.images[0]] : [],
      type: 'website',
    },
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      user:users(name, phone),
      city:cities(name),
      district:districts(name)
    `)
    .eq('id', id)
    .single();

  if (error || !property) {
    notFound();
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PropertyDetails property={property as Property} />
    </div>
  );
}
