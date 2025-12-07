'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text mb-4">
          {t('common.pageNotFoundTitle')}
        </h2>
        <p className="text-textSecondary mb-8">
          {t('common.pageNotFoundDescription')}
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  );
}
