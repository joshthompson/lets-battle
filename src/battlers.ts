// Battler data. Hand-authored fighters with real artwork. Each renders as a
// 60x90 sprite (background colour with the image centred and contained on top).
import psyduckImg from './assets/battlers/psyduck.png';
import antHeadImg from './assets/battlers/ant-head.png';
import boltImage from './assets/battlers/bolt.png';
import monkeyImg from './assets/battlers/monkey.png';
import cabbageImg from './assets/battlers/cabbage.png';
import mrHoppyImg from './assets/battlers/mr-hoppy.png';
import spikerImg from './assets/battlers/spiker.png';
import fishEyesImg from './assets/battlers/fish-eyes.png';
import chickenPantsImg from './assets/battlers/chicken-pants.png';
import fergusImg from './assets/battlers/fergus.png';
import { LocaleText } from './i18n';

type MovementType = 'wobble' | 'jump' | 'glide';

export interface Battler {
  id: number;
  name: LocaleText;
  artist?: LocaleText;
  color: string;
  imageUrl?: string;
  movementType?: MovementType;
  // Per-fighter walk-cycle timing so the roster doesn't bounce in lockstep.
  // animSpeed scales the base duration (>1 = slower); animDelay is a negative
  // phase offset (seconds) so fighters start at different points in the cycle.
  animSpeed?: number;
  animDelay?: number;
}

// The full roster. generateBattlers returns all of these, or a random subset
// when a cap is given.
const PRESET_BATTLERS: Omit<Battler, 'id'>[] = [
  {
    name: { en: 'Psyduck', ru: 'Псайдак' },
    color: '#FFD700',
    imageUrl: psyduckImg,
    movementType: 'wobble',
  },
  {
    name: { en: 'Ant Head', ru: 'Челомура' },
    color: '#4d8bff',
    imageUrl: antHeadImg,
    movementType: 'glide',
  },
  {
    name: { en: 'Bolt', ru: 'Болт' },
    color: '#ff5a3c',
    imageUrl: boltImage,
    movementType: 'jump',
  },
  {
    name: { en: 'Monkatt', ru: 'Обезкот' },
    artist: { en: 'Alisa', ru: 'Алиса' },
    color: '#FFA500',
    imageUrl: monkeyImg,
    movementType: 'wobble',
  },
  {
    name: { en: 'Lady Cabbage', ru: 'Леди Капуста' },
    artist: { en: 'Alisa', ru: 'Алиса' },
    color: '#32CD32',
    imageUrl: cabbageImg,
    movementType: 'jump',
  },
  {
    name: { en: 'Mr Hoppy', ru: 'Мистер Хоппи' },
    color: '#8B4513',
    imageUrl: mrHoppyImg,
    movementType: 'jump',
  },
  {
    name: { en: 'Chupapi', ru: 'Чупапи' },
    artist: { en: 'Olesia', ru: 'Олеся' },
    color: '#708090',
    imageUrl: spikerImg,
    movementType: 'glide',
  },
  {
    name: { en: 'Fish Eyes', ru: 'Рыбий Глаз' },
    artist: { en: 'Alisa', ru: 'Алиса' },
    color: '#20B2AA',
    imageUrl: fishEyesImg,
    movementType: 'wobble',
  },
  {
    name: { en: 'Chicken Pants', ru: 'Куриные Штаны' },
    artist: { en: 'Irina', ru: 'Ирина' },
    color: '#FF69B4',
    imageUrl: chickenPantsImg,
    movementType: 'wobble',
  },
  {
    name: { en: 'Fergus', ru: 'Фергус' },
    artist: { en: 'Irina', ru: 'Ирина' },
    color: '#FF69B4',
    imageUrl: fergusImg,
    movementType: 'jump',
  },
];

// Unique artist credits across the roster, in first-appearance order. Deduped
// by the English name so the same artist isn't listed twice.
export function uniqueArtists(): LocaleText[] {
  const seen = new Set<string>();
  const out: LocaleText[] = [];
  for (const b of PRESET_BATTLERS) {
    if (!b.artist) continue;
    const key = typeof b.artist === 'string' ? b.artist : (b.artist.en ?? JSON.stringify(b.artist));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b.artist);
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns the roster in a random order — the full set, or a random selection of
// `count` fighters when capped. Every fighter gets its own walk-cycle timing so
// they don't all bounce/wobble in sync (~0.75x–1.35x speed, with a random phase
// offset of up to a full second).
export function generateBattlers(count?: number): Battler[] {
  const shuffled = shuffle(PRESET_BATTLERS);
  const chosen = count == null ? shuffled : shuffled.slice(0, count);
  return chosen.map((b, i) => ({
    ...b,
    id: i,
    animSpeed: 0.75 + Math.random() * 0.6,
    animDelay: Math.random(),
  }));
}

// A default roster, generated once at module load.
export const battlers: Battler[] = generateBattlers();
