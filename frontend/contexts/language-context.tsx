'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Lang, t, type Translations } from '../lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  tr: Translations;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ar',
  tr: t('ar'),
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('talab.lang') as Lang | null;
    if (saved === 'ar' || saved === 'en') {
      setLangState(saved);
    }
    // default stays 'ar' — Gulf Arabic market
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  function setLang(next: Lang) {
    localStorage.setItem('talab.lang', next);
    setLangState(next);
  }

  return (
    <LanguageContext.Provider value={{ lang, tr: t(lang), setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
