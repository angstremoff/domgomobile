'use client';

import { useTranslation } from 'react-i18next';

export default function Loading() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-textSecondary">{t('common.loading')}</p>
      </div>
    </div>
  );
}
