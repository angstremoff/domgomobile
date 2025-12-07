'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: number;
  cityId?: string;
}

export function PropertyFilters({ onFilterChange }: PropertyFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const propertyTypes = [
    { value: 'apartment', label: 'Квартира' },
    { value: 'house', label: 'Дом' },
    { value: 'commercial', label: 'Коммерческая' },
    { value: 'land', label: 'Земля' },
  ];

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({});
    onFilterChange({});
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Mobile filter button */}
      <Button
        variant="outline"
        className="md:hidden w-full mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-5 w-5 mr-2" />
        Фильтры
      </Button>

      {/* Filter panel */}
      <Card className={`${isOpen ? 'block' : 'hidden md:block'} p-6 mb-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </h3>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-textSecondary hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Тип недвижимости
            </label>
            <select
              className="w-full px-4 py-2 bg-surface border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.propertyType || ''}
              onChange={(e) =>
                setFilters({ ...filters, propertyType: e.target.value || undefined })
              }
            >
              <option value="">Все типы</option>
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Цена (€)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="От"
                value={filters.minPrice || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <Input
                type="number"
                placeholder="До"
                value={filters.maxPrice || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Area Range */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Площадь (м²)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="От"
                value={filters.minArea || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minArea: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <Input
                type="number"
                placeholder="До"
                value={filters.maxArea || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxArea: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Rooms */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Количество комнат
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      rooms: filters.rooms === num ? undefined : num,
                    })
                  }
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.rooms === num
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text hover:bg-border'
                  }`}
                >
                  {num === 5 ? '5+' : num}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button onClick={handleResetFilters} variant="outline" className="flex-1">
              Сбросить
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              Применить
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
