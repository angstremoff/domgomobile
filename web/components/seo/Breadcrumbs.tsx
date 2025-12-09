'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation();

  // JSON-LD для хлебных крошек
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('common.home', 'Početna'),
        item: 'https://domgo.rs',
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        ...(item.href ? { item: `https://domgo.rs${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-textSecondary flex-wrap">
          <li>
            <Link
              href="/"
              className="flex items-center hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-text font-medium">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
