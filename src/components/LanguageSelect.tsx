import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  variant?: 'desktop' | 'mobile';
  className?: string;
  onChangeDone?: () => void; // callback after language changed
};

export function LanguageSelect({ variant = 'desktop', className, onChangeDone }: Props) {
  const { t, i18n } = useTranslation();

  const resources = (i18n.options as any)?.resources ?? {};
  const languages: string[] = useMemo(() => Object.keys(resources), [resources]);
  const current = (i18n.language || 'en').split('-')[0];

  const label = t('common.language', 'Language');

  const classes =
    variant === 'desktop'
      ? 'h-9 px-3 rounded-xl text-xs font-medium ring-1 ring-white/10 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20'
      : 'h-9 px-3 rounded-xl text-xs font-medium ring-1 ring-white/10 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 w-full';

  const handleChange = (lng: string) => {
    const base = (lng || 'en').split('-')[0];
    i18n.changeLanguage(base);
    try { localStorage.setItem('app_lang', base); } catch {}
    onChangeDone?.();
  };

  return (
    <div className={variant === 'desktop' ? 'hidden md:flex items-center' : ''}>
      <label className="sr-only" htmlFor={`lang-select-${variant}`}>{label}</label>
      <select
        id={`lang-select-${variant}`}
        className={(classes + (className ?? '')).trim()}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
      >
        {languages.map((lng) => (
          <option key={lng} value={lng} className="bg-gray-900 text-white">
            {t(`common.languages.${lng}`, lng.toUpperCase())}
          </option>
        ))}
      </select>
    </div>
  );
}
