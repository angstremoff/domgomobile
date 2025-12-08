'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AgencyDetails } from '@/components/agency/AgencyDetails';
import { useTranslation } from 'react-i18next';
import type { Database } from '@shared/lib/database.types';

type Agency = Database['public']['Tables']['agency_profiles']['Row'];
type Property = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
};

export function AgencyPageClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;

    const loadAgency = async () => {
      // Пробуем найти по agency_id
      const { data: agencyData } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('id', id)
        .single();

      let resolvedAgency = agencyData as Agency | null;

      // Фолбек: если передали user_id вместо agency_id
      if (!resolvedAgency) {
        const { data: fallbackData } = await supabase
          .from('agency_profiles')
          .select('*')
          .eq('user_id', id)
          .single();
        resolvedAgency = fallbackData as Agency | null;
      }

      if (!resolvedAgency) {
        setError(true);
        setLoading(false);
        return;
      }

      setAgency(resolvedAgency);

      // Загружаем объявления агентства
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

      if (propertiesByAgency && propertiesByAgency.length > 0) {
        setProperties(propertiesByAgency as Property[]);
      } else {
        // Фолбек по user_id
        const { data: fallbackProperties } = await supabase
          .from('properties')
          .select(`
            *,
            city:cities(name),
            district:districts(name)
          `)
          .eq('user_id', resolvedAgency.user_id)
          .order('created_at', { ascending: false })
          .limit(60);
        setProperties((fallbackProperties as Property[]) || []);
      }

      setLoading(false);
    };

    loadAgency();
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

  if (error || !agency) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">{t('common.notFound')}</h1>
        <p className="text-textSecondary">{t('agency.notFound', 'Agencija nije pronađena')}</p>
      </div>
    );
  }

  return <AgencyDetails agency={agency} properties={properties} />;
}
