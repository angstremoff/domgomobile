'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import type { Database } from '@shared/lib/database.types';

export default function OmiljenoPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setProperties([]);
      return;
    }

    const loadFavorites = async () => {
      const { data: favorites } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (favorites && favorites.length > 0) {
        const propertyIds = favorites.map((f) => f.property_id);

        const { data: props } = await supabase
          .from('properties')
          .select(`
            *,
            city:cities(name),
            district:districts(name)
          `)
          .in('id', propertyIds);

        setProperties((props as PropertyWithRelations[]) || []);
      } else {
        setProperties([]);
      }

      setLoading(false);
    };

    loadFavorites();
  }, [user, supabase]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">{t('profile.favorites')}</h1>
        <p className="text-textSecondary">
          {loading
            ? t('common.loading')
            : t('favoriteScreen.count', { count: properties.length })}
        </p>
      </div>

      <PropertyGrid properties={properties} loading={loading} />
    </div>
  );
}

type PropertyWithRelations = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
};
