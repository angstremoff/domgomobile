'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PropertyDetails } from '@/components/property/PropertyDetails';
import { useTranslation } from 'react-i18next';
import type { Database } from '@shared/lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
  user?: { name: string; phone: string } | null;
};

export function PropertyPageClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();
  const supabase = createClient();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }

    const loadProperty = async () => {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(`
          *,
          user:users(name, phone),
          city:cities(name),
          district:districts(name)
        `)
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setError(true);
      } else {
        setProperty(data as Property);
      }
      setLoading(false);
    };

    loadProperty();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">{t('common.notFound')}</h1>
        <p className="text-textSecondary">{t('property.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PropertyDetails property={property} />
    </div>
  );
}
