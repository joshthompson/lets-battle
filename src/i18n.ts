import { createSignal } from 'solid-js';

// Minimal in-app i18n. A module-level signal holds the active locale so every
// component can read it reactively via t(); switching it re-renders all text.
export type Locale = 'en' | 'ru';
export type LocaleText = string | { [locale in Locale]: string };

const STORAGE_KEY = 'lets-battle-locale';


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
  start: { en: 'Battle!', ru: 'В бой!' },
  gallery: { en: 'Gallery', ru: 'Галерея' },
  menu: { en: 'Menu', ru: 'Меню' },
  winner: { en: 'Winner', ru: 'Победитель' },
  draw: { en: 'Draw', ru: 'Ничья' },
  team: { en: 'Team', ru: 'Команда' },
  teamWins: { en: 'wins!', ru: 'победила!' },
  by: { en: 'by', ru: 'Автор:' },
  fighter: { en: 'Fighter', ru: 'Боец' },
  skipIntro: { en: 'Skip Intro', ru: 'Пропустить' },
  aim: { en: 'Aim', ru: 'Прицел' },
  fire: { en: 'Fire', ru: 'Огонь' },
  reloading: { en: 'Reloading', ru: 'Перезарядка' },
  credits: { en: 'Credits', ru: 'Авторы' },
  howItWorks: { en: 'How It Works', ru: 'Как это работает' },
  howItWorks1: {
    en: "In Let's Battle you watch the battlers fight one another to see the winner.",
    ru: 'В «Пора в бой» вы наблюдаете, как бойцы сражаются друг с другом, чтобы узнать победителя.',
  },
  howItWorks2: {
    en: "You don't fight yourself, just watch and cheer for your favourite character!",
    ru: 'Вы не сражаетесь сами — просто смотрите и болеете за любимого персонажа!',
  },
  howItWorks3: {
    en: 'The only influence you have is the item launcher at the bottom of the screen. It lets you launch items into the arena that may help or hinder the participants.',
    ru: 'Единственное ваше влияние — пусковая установка предметов внизу экрана. Она позволяет запускать на арену предметы, которые могут помочь или помешать участникам.',
  },
  developedBy: { en: 'Developed by:', ru: 'Разработка:' },
  developedByName: { en: 'Josh', ru: 'Джош' },
  gameArtBy: { en: 'Game Art by:', ru: 'Игровая графика:' },
  gameArtByName: { en: 'Olesia and Josh', ru: 'Олесия и Джош' },
  characterArtBy: { en: 'Character Art by:', ru: 'Художники персонажей:' },
  and: { en: 'and', ru: 'и' },
  title: { en: "Let's Battle!", ru: 'Пора в бой!' },
} as const satisfies Record<string, LocaleText>;

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
