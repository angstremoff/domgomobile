'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

// ID для аналитики
const YANDEX_METRIKA_ID = '10081034';
const GA_MEASUREMENT_ID = 'G-B3K5RCDEFZ';

// Типы для глобальных объектов
declare global {
  interface Window {
    ym: (id: number, action: string, url?: string) => void;
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    requestIdleCallback?: (callback: IdleRequestCallback) => number;
  }
}

export function Analytics() {
  const pathname = usePathname();

  // Откладываем трекинг до свободного слота, чтобы не мешать LCP
  const schedule = (cb: () => void) => {
    if (typeof window === 'undefined') return;
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => cb());
    } else {
      setTimeout(cb, 0);
    }
  };

  // Отслеживание изменений страницы
  useEffect(() => {
    schedule(() => {
      if (typeof window === 'undefined') return;
      // Отправка данных в Яндекс.Метрику при изменении страницы
      if (window.ym) {
        window.ym(Number(YANDEX_METRIKA_ID), 'hit', pathname);
      }

      // Отправка данных в Google Analytics при изменении страницы
      if (window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_path: pathname,
        });
      }
    });
  }, [pathname]);

  return (
    <>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>

      {/* Яндекс.Метрика */}
      <Script id="yandex-metrika" strategy="lazyOnload">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) return;}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          ym(${YANDEX_METRIKA_ID}, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
            trackHash: true
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
