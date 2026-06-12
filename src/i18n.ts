import { createSignal } from 'solid-js';

// Minimal in-app i18n. A module-level signal holds the active locale so every
// component can read it reactively via t(); switching it re-renders all text.
export type Locale = 'en' | 'ru';

const STORAGE_KEY = 'lets-battle-locale';

export type LocaleText = string | { [locale: string]: string };

// Prefer a previously chosen locale, otherwise default to Russian when the
// browser's language list asks for it.
function detectInitial(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // localStorage can throw (private mode); fall through to language detection.
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  return langs.some((l) => l.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
}

const [locale, setLocaleSignal] = createSignal<Locale>(detectInitial());

export { locale };

export function setLocale(l: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // Persisting is best-effort; ignore write failures.
  }
  setLocaleSignal(l);
}

const STRINGS = {
  lets: { en: "Let's", ru: 'Пора' },
  battle: { en: 'Battle', ru: 'в бой' },
  start: { en: 'Start', ru: 'Начать' },
  menu: { en: 'Menu', ru: 'Меню' },
  winner: { en: 'Winner', ru: 'Победитель' },
  draw: { en: 'Draw', ru: 'Ничья' },
  by: { en: 'by', ru: 'Автор:' },
  fighter: { en: 'Fighter', ru: 'Боец' },
  skipIntro: { en: 'Skip Intro', ru: 'Пропустить' },
  credits: { en: 'Credits', ru: 'Авторы' },
  developedBy: { en: 'Developed by Josh Thompson', ru: 'Разработка: Джош Томпсон' },
  gameArtBy: { en: 'Game Art by Olesia Vasileva and Josh Thompson', ru: 'Игровая графика: Олесия Васильева и Джош Томпсон' },
  characterArtBy: { en: 'Character Art by:', ru: 'Художники персонажей:' },
  and: { en: 'and', ru: 'и' },
  title: { en: "Let's Battle", ru: 'В бой!' },
} as const;

export type StringKey = keyof typeof STRINGS;

// Read within a reactive scope (e.g. JSX) so text updates when the locale flips.
export function t(key: StringKey): string {
  return STRINGS[key][locale()];
}

// Resolve a possibly-localized value for the active locale. A plain string is
// rendered as-is; an object picks the current locale, falling back to English
// and then to any available translation. Call inside reactive scope (JSX) so it
// re-resolves when the locale flips.
export function tx(text: LocaleText): string {
  if (typeof text === 'string') return text;
  return text[locale()] ?? text.en ?? Object.values(text)[0] ?? '';
}
