import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import 'intl-pluralrules'; // Добавляем полифилл для Intl.PluralRules

// Импортируем переводы
import ru from './ru.json';
import sr from './sr.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      sr: { translation: sr }
    },
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
