// frontend/src/utils/translate.js
import { translations } from './translations';
import { useLanguage } from '../context/LanguageContext';

export const useTranslate = () => {
  const { language, direction, toggleLanguage } = useLanguage();
  
  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const isRTL = direction === 'rtl';

  return { t, isRTL, language, toggleLanguage };
};