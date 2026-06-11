// Battler data. Some are hand-authored presets with real artwork; the rest are
// randomly generated. Each renders as a 60x90 sprite (background colour with the
// image centred and contained on top).
import psyduckImg from './assets/battlers/psyduck.png';
import antHeadImg from './assets/battlers/ant-head.png';
import boltImage from './assets/battlers/bolt.png';
import monkeyImg from './assets/battlers/monkey.png';
import cabbageImg from './assets/battlers/cabbage.png';
import mrHoppyImg from './assets/battlers/mr-hoppy.png';
import spikerImg from './assets/battlers/spiker.png';
import fishEyesImg from './assets/battlers/fish-eyes.png';
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

const NAME_POOL = [
  'Blaze',
  'Vortex',
  'Razor',
  'Tempest',
  'Onyx',
  'Specter',
  'Titan',
  'Echo',
  'Rogue',
  'Cinder',
  'Havoc',
  'Frost',
  'Talon',
  'Nyx',
  'Surge',
  'Drift',
];

// Hand-authored fighters with real artwork. generateBattlers always seeds the
// roster from these first, then tops up with random ones.
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
    name: { en: 'Spiker', ru: 'Шпикер' },
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
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomColor(index: number, total: number): string {
  // Spread hues evenly so the roster reads as visually distinct, with a little
  // jitter so it still feels random.
  const hue = Math.floor((360 / total) * index + Math.random() * 20);
  const sat = 65 + Math.floor(Math.random() * 25);
  const light = 45 + Math.floor(Math.random() * 15);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export function generateBattlers(count = 8): Battler[] {
  // Always start with the presets, then fill the rest with random fighters.
  const presets = PRESET_BATTLERS.slice(0, count).map((b, i) => ({ ...b, id: i }));
  const remaining = count - presets.length;

  const usedNames = new Set(presets.map((b) => b.name));
  const names = shuffle(NAME_POOL)
    .filter((n) => !usedNames.has(n))
    .slice(0, remaining);

  const generated = names.map((name, i) => ({
    id: presets.length + i,
    name,
    color: randomColor(presets.length + i, count),
    movementType: ['wobble', 'jump', 'glide'][Math.floor(Math.random() * 3)] as MovementType,
  }));

  // Give every fighter (presets included) its own walk-cycle timing so they
  // don't all bounce/wobble in sync. ~0.75x–1.35x speed, with a random phase
  // offset of up to a full second.
  return [...presets, ...generated].map((b) => ({
    ...b,
    animSpeed: 0.75 + Math.random() * 0.6,
    animDelay: Math.random(),
  }));
}

// A default roster, generated once at module load.
export const battlers: Battler[] = generateBattlers(8);
