'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface" itemScope itemType="https://schema.org/WPFooter">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* О нас */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">DomGo.rs</h3>
            <p className="text-sm text-textSecondary">
              {t('footer.aboutLine', 'Platforma za pretragu nekretnina u Srbiji.')}
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

        {/* Копирайт и дополнительная SEO-информация */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-textSecondary">
              © {currentYear} DomGo.rs — {t('footer.allRights', 'Sva prava zadržana')}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=domgo.rs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:border-primary hover:text-primary transition-colors"
                aria-label="Google Play"
              >
                <Play className="h-4 w-4" />
                Google Play
              </a>
              <span className="text-sm text-textSecondary">
                Srbija 🇷🇸
              </span>
            </div>
          </div>
          {/* SEO-текст для поисковиков */}
          <p className="mt-4 text-xs text-textSecondary/60 text-center max-w-3xl mx-auto">
            {t('footer.seoLine', 'DomGo.rs — nekretnine u Srbiji: kupovina i iznajmljivanje stanova i kuća.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
