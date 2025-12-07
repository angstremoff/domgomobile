'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, MapPin, List, Map as MapIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PropertyGrid } from './PropertyGrid';
import { PropertyFilters, FilterState } from './PropertyFilters';
import { PropertyMap } from './PropertyMap';
import { Button } from '@/components/ui/Button';
import type { Database } from '@shared/lib/database.types';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyWithRelations = PropertyRow & {
  city?: { name: string } | null;
  district?: { name: string } | null;
};
type City = Database['public']['Tables']['cities']['Row'];

interface PropertyListingsClientProps {
  type: 'sale' | 'rent';
  isNewBuilding?: boolean;
  initialProperties: PropertyWithRelations[];
}

export function PropertyListingsClient({
  type,
  isNewBuilding = false,
  initialProperties
}: PropertyListingsClientProps) {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<PropertyWithRelations[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<FilterState>({});

  // Быстрые фильтры
  const [selectedCity, setSelectedCity] = useState<number | undefined>();
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('cities')
      .select('*')
      .order('name');
    if (data) setCities(data);
  };

  const fetchProperties = useCallback(async (filterState: FilterState = {}) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    let query = supabase
      .from('properties')
      .select(`
        *,
        city:cities(name),
        district:districts(name)
      `)
      .eq('type', type)
      .eq('status', 'active');

    if (isNewBuilding) {
      query = query.eq('is_new_building', true);
    }

    // Применяем фильтры
    if (selectedCity !== undefined) {
      query = query.eq('city_id', selectedCity);
    }

    if (filterState.propertyType) {
      query = query.eq('property_type', filterState.propertyType);
    }

    if (filterState.minPrice) {
      query = query.gte('price', filterState.minPrice);
    }

    if (filterState.maxPrice) {
      query = query.lte('price', filterState.maxPrice);
    }

    if (filterState.minArea) {
      query = query.gte('area', filterState.minArea);
    }

    if (filterState.maxArea) {
      query = query.lte('area', filterState.maxArea);
    }

    if (filterState.rooms) {
      query = query.eq('rooms', filterState.rooms);
    }

    const { data, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
      setProperties([]);
    } else {
      setProperties((data as PropertyWithRelations[]) || []);
    }
    setLoading(false);
  }, [isNewBuilding, selectedCity, type]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    fetchProperties(newFilters);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId ? Number(cityId) : undefined);
  };

  useEffect(() => {
    if (selectedCity !== undefined) {
      fetchProperties(filters);
    }
  }, [selectedCity, filters, fetchProperties]);

  const getTitle = () => {
    if (isNewBuilding) return t('common.newBuildings');
    return type === 'sale' ? t('common.sale') : t('common.rent');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок и управление */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-4">{getTitle()}</h1>

        {/* Панель быстрых фильтров */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Выбор города */}
            <select
              value={selectedCity !== undefined ? String(selectedCity) : ''}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('common.allCities')}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id.toString()}>
                  {city.name}
                </option>
              ))}
            </select>

            {/* Кнопка фильтров */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {t('common.filters')}
            </Button>
          </div>

          {/* Переключатель вида */}
          <div className="flex gap-2 bg-surface border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-textSecondary hover:text-text'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.view')}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'map'
                  ? 'bg-primary text-white'
                  : 'text-textSecondary hover:text-text'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.map')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Боковая панель фильтров */}
        {showFilters && (
          <aside className="lg:w-80 flex-shrink-0">
            <PropertyFilters onFilterChange={handleFilterChange} />
          </aside>
        )}

        {/* Основной контент */}
        <div className="flex-1">
          {viewMode === 'list' ? (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <PropertyGrid properties={properties} loading={loading} error={error} />
              )}
            </>
          ) : (
            <PropertyMap properties={properties} />
          )}
        </div>
      </div>
    </div>
  );
}
