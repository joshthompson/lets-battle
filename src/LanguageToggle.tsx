import { locale, setLocale, type Locale } from './i18n';

// Top-right EN/RU switch shown on the menu.
export default function LanguageToggle() {
  const button = (l: Locale, label: string, flag: string) => (
    <button
      class={`lang-btn${locale() === l ? ' active' : ''}`}
      onClick={() => setLocale(l)}
      aria-label={label}
      aria-pressed={locale() === l}
      type="button"
    >
      {flag}
    </button>
  );

  return (
    <div class="lang-toggle">
      {button('en', 'English', '🇬🇧')}
      {button('ru', 'Русский', '🇷🇺')}
    </div>
  );
}
