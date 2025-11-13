import { translations } from './translations';
import { useLanguage } from '../context/LanguageContext';

export const useTranslate = () => {
  const { language, isRTL, toggleLanguage } = useLanguage();
  
  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return { t, isRTL, language, toggleLanguage };
};