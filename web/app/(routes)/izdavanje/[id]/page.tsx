import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PropertyDetails } from '@/components/property/PropertyDetails';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('title, description, price, location, images, city:cities(name)')
    .eq('id', id)
    .single();

  if (!property) {
    return {
      title: 'Объявление не найдено - DomGo.rs',
    };
  }

  const price = new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(property.price);

  return {
    title: `${property.title} - ${price}/мес | DomGo.rs`,
    description: property.description?.slice(0, 160) || `${property.title} в аренду`,
    openGraph: {
      title: property.title,
      description: property.description || '',
      images: property.images?.[0] ? [property.images[0]] : [],
      type: 'website',
    },
  };
}

export default async function PropertyPage({ params }: Props) {
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
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PropertyDetails property={property} />
    </div>
  );
}
