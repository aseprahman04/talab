'use client';

import { useLang } from '../contexts/language-context';

export default function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      className={`lang-toggle-btn ${className ?? ''}`}
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      aria-label="Switch language"
    >
      {lang === 'ar' ? 'EN' : 'عر'}
    </button>
  );
}
