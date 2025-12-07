'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { useAuth } from '@/providers/AuthProvider';

export default function OmiljenoPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

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

        setProperties(props || []);
      }

      setLoading(false);
    };

    loadFavorites();
  }, [user, supabase]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Избранное</h1>
        <p className="text-textSecondary">
          {loading ? 'Загрузка...' : `Найдено ${properties.length} объявлений`}
        </p>
      </div>

      <PropertyGrid properties={properties} loading={loading} />
    </div>
  );
}
