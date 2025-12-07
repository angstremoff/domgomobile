'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Building2, Home, Key } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero секция */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-6">
          DomGo.rs
        </h1>
        <p className="text-xl text-textSecondary mb-8 max-w-2xl mx-auto">
          {t('web.heroSubtitle')}
        </p>
      </section>

      {/* Категории */}
      <section className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Продажа */}
          <Link
            href="/prodaja"
            className="group p-8 border border-border rounded-lg hover:shadow-lg hover:border-primary transition-all bg-surface"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {t('common.sale')}
              </h3>
              <p className="text-textSecondary text-sm">
                {t('property.saleApartment')}, {t('property.saleHouse')}
              </p>
            </div>
          </Link>

          {/* Аренда */}
          <Link
            href="/izdavanje"
            className="group p-8 border border-border rounded-lg hover:shadow-lg hover:border-primary transition-all bg-surface"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {t('common.rent')}
              </h3>
              <p className="text-textSecondary text-sm">
                {t('property.rentApartment')}, {t('property.rentHouse')}
              </p>
            </div>
          </Link>

          {/* Новостройки */}
          <Link
            href="/novogradnja"
            className="group p-8 border border-border rounded-lg hover:shadow-lg hover:border-primary transition-all bg-surface"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {t('common.newBuildings')}
              </h3>
              <p className="text-textSecondary text-sm">
                {t('common.newListings')}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA секция */}
      <section className="py-12 text-center max-w-2xl mx-auto">
        <div className="bg-surface border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-text mb-4">
            {t('property.addNew')}
          </h2>
          <p className="text-textSecondary mb-6">
            {t('auth.requiredForAddingProperty')}
          </p>
          <Link
            href="/registracija"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {t('auth.register')}
          </Link>
        </div>
      </section>
    </div>
  );
}
