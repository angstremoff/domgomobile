'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, User, Menu } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Предотвращаем hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const currentTheme = theme || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'sr' : 'ru';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Логотип */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Image src="/logo.png" alt="DomGo" width={40} height={40} className="h-10 w-10" />
            <span className="text-2xl font-bold text-primary">DomGo.rs</span>
          </Link>

          {/* Навигация Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/prodaja"
              className="text-sm font-medium text-text hover:text-primary transition-colors"
            >
              {t('common.sale')}
            </Link>
            <Link
              href="/izdavanje"
              className="text-sm font-medium text-text hover:text-primary transition-colors"
            >
              {t('common.rent')}
            </Link>
            <Link
              href="/novogradnja"
              className="text-sm font-medium text-text hover:text-primary transition-colors"
            >
              {t('common.newBuildings')}
            </Link>
            <Link
              href="/agencije"
              className="text-sm font-medium text-text hover:text-primary transition-colors"
            >
              {t('common.agencies')}
            </Link>
          </nav>

          {/* Управление */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Переключатель языка */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-sm text-textSecondary hover:text-text transition-colors"
              aria-label={t('common.language')}
            >
              <Globe className="h-5 w-5" />
              <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
            </button>

            {/* Переключатель темы */}
            <button
              onClick={toggleTheme}
              className="text-textSecondary hover:text-text transition-colors"
              aria-label={t('common.darkMode')}
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <div className="h-5 w-5" />
              )}
            </button>

            {/* Пользователь */}
            {user ? (
              <Link
                href="/profil"
                className="flex items-center space-x-2 text-sm font-medium text-text hover:text-primary transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{t('common.profile')}</span>
              </Link>
            ) : (
              <Link
                href="/prijava"
                className="text-sm font-medium text-text hover:text-primary transition-colors"
              >
                {t('common.login')}
              </Link>
            )}

            {/* Мобильное меню */}
            <button className="md:hidden text-text" aria-label={t('common.openMenu')}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
