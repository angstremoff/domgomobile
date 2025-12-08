'use client';

import { useEffect, useState } from 'react';
import { Phone, Globe, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@shared/lib/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

type Agency = Database['public']['Tables']['agency_profiles']['Row'];

export function AgenciesListClient() {
  const { t } = useTranslation();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const loadAgencies = async () => {
      const { data, error: fetchError } = await supabase
        .from('agency_profiles')
        .select('id, name, phone, email, site, location, logo_url, description')
        .order('name', { ascending: true })
        .limit(50);

      if (fetchError) {
        setError(true);
      } else {
        setAgencies((data as Agency[]) || []);
      }
      setLoading(false);
    };

    loadAgencies();
  }, [supabase]);

  const formatSite = (site?: string | null) => {
    if (!site) return null;
    return site.startsWith('http') ? site : `https://${site}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-3">
          <MapPin className="h-12 w-12 text-textSecondary mx-auto" />
          <p className="text-textSecondary text-lg">
            {t(error ? 'common.errorLoadingData' : 'agency.emptyList')}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-text mb-2">{t('agency.listTitle')}</h1>
          <p className="text-textSecondary">{t('agency.listDescription')}</p>
        </div>

        {!agencies.length ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency) => {
              const site = formatSite(agency.site);

              return (
                <Link key={agency.id} href={`/agencija/?id=${agency.id}`} className="block h-full">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {agency.name || t('agency.unnamed')}
                      </CardTitle>
                      {agency.description && (
                        <p className="text-sm text-textSecondary line-clamp-2">
                          {agency.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm text-textSecondary">
                        {agency.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span className="hover:text-primary">{agency.phone}</span>
                          </div>
                        )}
                        {agency.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="hover:text-primary">{agency.email}</span>
                          </div>
                        )}
                        {site && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="hover:text-primary truncate">{agency.site}</span>
                          </div>
                        )}
                        {agency.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{agency.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
