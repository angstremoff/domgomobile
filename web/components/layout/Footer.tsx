'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* О нас */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">DomGo.rs</h3>
            <p className="text-sm text-textSecondary">
              {t('common.search')}
            </p>
          </div>

          {/* Разделы */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-4">{t('common.allListings')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/prodaja" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('common.sale')}
                </Link>
              </li>
              <li>
                <Link href="/izdavanje" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('common.rent')}
                </Link>
              </li>
              <li>
                <Link href="/novogradnja" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('common.newBuildings')}
                </Link>
              </li>
              <li>
                <Link href="/agencije" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('common.agencies')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Информация */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-4">{t('common.info')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/profil" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('common.profile')}
                </Link>
              </li>
              <li>
                <Link href="/prijava" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('common.login')}
                </Link>
              </li>
              <li>
                <Link href="/registracija" className="text-sm text-textSecondary hover:text-primary transition-colors">
                  {t('auth.register')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакт */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-4">{t('settings.contactUs')}</h3>
            <p className="text-sm text-textSecondary mb-2">
              Telegram: @Angstremoff
            </p>
            <p className="text-sm text-textSecondary">
              Email: angstremoff@ya.ru
            </p>
          </div>
        </div>

        {/* Копирайт */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-textSecondary">
            © {currentYear} DomGo.rs
          </p>
        </div>
      </div>
    </footer>
  );
}
