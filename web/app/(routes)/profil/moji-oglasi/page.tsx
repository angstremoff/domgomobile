'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function MojiOglasiPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const loadProperties = async () => {
      const { data } = await supabase
        .from('properties')
        .select(`
          *,
          city:cities(name),
          district:districts(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProperties(data || []);
      setLoading(false);
    };

    loadProperties();
  }, [user, supabase]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Мои объявления</h1>
          <p className="text-textSecondary">
            {loading ? 'Загрузка...' : `Всего ${properties.length} объявлений`}
          </p>
        </div>

        <Link href="/profil/dodaj-oglas">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Добавить объявление
          </Button>
        </Link>
      </div>

      <PropertyGrid properties={properties} loading={loading} />
    </div>
  );
}
