'use client';

import { useTranslation } from 'react-i18next';
import { CardTitle } from '@/components/ui/Card';

interface FormTitleProps {
  translationKey: string;
}

export function FormTitle({ translationKey }: FormTitleProps) {
  const { t } = useTranslation();
  return <CardTitle className="text-center">{t(translationKey)}</CardTitle>;
}
