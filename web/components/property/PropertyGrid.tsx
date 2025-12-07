'use client';

import { PropertyCard } from './PropertyCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Database } from '@shared/lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'] & {
  city?: { name: string } | null;
  district?: { name: string } | null;
};

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  onFavoriteToggle?: (id: string) => void;
  favorites?: string[];
}

export function PropertyGrid({
  properties,
  loading,
  onFavoriteToggle,
  favorites = [],
}: PropertyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-textSecondary text-lg">Объявления не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={favorites.includes(property.id)}
        />
      ))}
    </div>
  );
}
