import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { Phone, Globe, Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Агентства недвижимости - DomGo.rs',
  description: 'Проверенные агентства недвижимости в Сербии',
};

export default async function AgenciePage() {
  const supabase = await createClient();

  // Получаем агентства из БД (если есть таблица agencies)
  const { data: agencies } = await supabase
    .from('agencies')
    .select('*')
    .limit(50);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-text mb-8">Агентства недвижимости</h1>

        {!agencies || agencies.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-textSecondary mx-auto mb-4" />
                <p className="text-textSecondary text-lg">
                  Список агентств скоро будет доступен
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency: any) => (
              <Link href={`/agencije/${agency.id}`} key={agency.id}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{agency.name || 'Агентство'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agency.phone && (
                        <div className="flex items-center gap-2 text-sm text-textSecondary">
                          <Phone className="h-4 w-4" />
                          <span>{agency.phone}</span>
                        </div>
                      )}
                      {agency.email && (
                        <div className="flex items-center gap-2 text-sm text-textSecondary">
                          <Mail className="h-4 w-4" />
                          <span>{agency.email}</span>
                        </div>
                      )}
                      {agency.website && (
                        <div className="flex items-center gap-2 text-sm text-textSecondary">
                          <Globe className="h-4 w-4" />
                          <span>{agency.website}</span>
                        </div>
                      )}
                      {agency.address && (
                        <div className="flex items-center gap-2 text-sm text-textSecondary">
                          <MapPin className="h-4 w-4" />
                          <span>{agency.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
