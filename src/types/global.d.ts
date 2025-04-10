// Глобальные типы для приложения
declare global {
  var propertyDeepLinkId: string | null;

  interface Window {
    propertyDeepLinkId: string | null;
  }
}

export {};
