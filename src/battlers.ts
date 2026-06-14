// Battler data. Hand-authored fighters with real artwork, grouped by the artist
// who drew them. Each renders as a 60x90 sprite (background colour with the
// image centred and contained on top).
// import psyduckImg from './assets/battlers/psyduck.png';
// import antHeadImg from './assets/battlers/ant-head.png';
// import boltImage from './assets/battlers/bolt.png';
// import mrHoppyImg from './assets/battlers/mr-hoppy.png';
import monkeyImg from './assets/battlers/monkey.png';
import cabbageImg from './assets/battlers/cabbage.png';
import spikerImg from './assets/battlers/spiker.png';
import fishEyesImg from './assets/battlers/fish-eyes.png';
import chickenPantsImg from './assets/battlers/chicken-pants.png';
import fergusImg from './assets/battlers/fergus.png';
import coolGooseImg from './assets/battlers/cool-goose.png';
import annaImg from './assets/battlers/anna.png';
import blubberImg from './assets/battlers/blubber.png';
import fasionPawsImg from './assets/battlers/fashion-paws.png';
import blubeeBeeImg from './assets/battlers/blubee-bee.png';
import vanyaAndRexImg from './assets/battlers/vanya-and-rex.png';
import mrsFeatherbowImg from './assets/battlers/mrs-featherbow.png';
import gladysImg from './assets/battlers/gladys.png';
import agentToeImg from './assets/battlers/agent-toe.png';
import farfellaImg from './assets/battlers/farfella.png';
import henryImg from './assets/battlers/henry.png';
import noteGuyImg from './assets/battlers/note-guy.png';
import billoonImg from './assets/battlers/billoon.png';

import { LocaleText } from './i18n';

type MovementType = 'wobble' | 'jump' | 'glide' | 'float';

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

// An artist and the battlers they drew. This is the authoring shape: the artist
// is named once and applies to all of their battlers, so the battlers carry no
// per-entry `artist` or `id` — those are filled in when the roster is flattened.
export interface Artist {
  name: LocaleText;
  battlers: Omit<Battler, 'id' | 'artist'>[];
}

// The full roster, grouped by artist. generateBattlers() flattens this (in a
// random order, or a random subset when capped) for a match; battlersByArtist()
// and uniqueArtists() read the grouping directly for the gallery and credits.
const ARTIST_BATTLERS: Artist[] = [
  {
    name: { en: 'Alisa', ru: 'Алиса' },
    battlers: [
      {
        name: { en: 'Monkatt', ru: 'Обезкот' },
        color: '#FFA500',
        imageUrl: monkeyImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Lady Cabbage', ru: 'Леди Капуста' },
        color: '#32CD32',
        imageUrl: cabbageImg,
        movementType: 'jump',
      },
      {
        name: { en: 'Fish Eyes', ru: 'Рыбий Глаз' },
        color: '#20B2AA',
        imageUrl: fishEyesImg,
        movementType: 'wobble',
      },
    ],
  },
  {
    name: { en: 'Olesia', ru: 'Олеся' },
    battlers: [
      {
        name: { en: 'Chupapi', ru: 'Чупапи' },
        color: '#708090',
        imageUrl: spikerImg,
        movementType: 'glide',
      },
    ],
  },
  {
    name: { en: 'Irina', ru: 'Ирина' },
    battlers: [
      {
        name: { en: 'Chicken Pants', ru: 'Куриные Штаны' },
        color: '#F2BD8E',
        imageUrl: chickenPantsImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Fergus', ru: 'Фергус' },
        color: '#FF69B4',
        imageUrl: fergusImg,
        movementType: 'jump',
      },
      {
        name: { en: 'Blubee Bee', ru: 'Блуби Би' },
        color: '#008DD4',
        imageUrl: blubeeBeeImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Mrs Featherbow', ru: 'Миссис Фезербоу' },
        color: '#ED80B4',
        imageUrl: mrsFeatherbowImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Vanya and Rex', ru: 'Ваня и Рекс' },
        color: '#E67A4C',
        imageUrl: vanyaAndRexImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Gladys', ru: 'Глэдис' },
        color: '#53A6A7',
        imageUrl: gladysImg,
        movementType: 'wobble',
      },
    ],
  },
  {
    name: { en: 'Josh', ru: 'Джош' },
    battlers: [
      {
        name: { en: 'Cool Goose', ru: 'Крутой Гусь' },
        color: '#1E90FF',
        imageUrl: coolGooseImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Agent Toe', ru: 'Агент Палец' },
        color: '#EED2FC',
        imageUrl: agentToeImg,
        movementType: 'jump',
      },
      {
        name: { en: 'Farfella', ru: 'Фарфелла' },
        color: '#D4c2b2',
        imageUrl: farfellaImg,
        movementType: 'jump',
      },
      {
        name: { en: 'Henry', ru: 'Генри' },
        color: '#85C076',
        imageUrl: henryImg,
        movementType: 'jump',
      },
      {
        name: { en: 'Note Guy', ru: 'Нот Гай' },
        color: '#E64127',
        imageUrl: noteGuyImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Billoon', ru: 'Биллон' },
        color: '#FAE58B',
        imageUrl: billoonImg,
        movementType: 'float',
      },
    ],
  },
  {
    name: { en: 'Anna', ru: 'Анна' },
    battlers: [
      {
        name: { en: 'Anna', ru: 'Анна' },
        color: '#FF69B4',
        imageUrl: annaImg,
        movementType: 'jump',
      },
      {
        name: { en: 'Fashion Paws', ru: 'Модные Лапки' },
        color: '#DFD643',
        imageUrl: fasionPawsImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Blubber', ru: 'Ворвашка' },
        color: '#E1F4F7',
        imageUrl: blubberImg,
        movementType: 'jump',
      },
    ],
  },
];

// The whole roster as a flat list, each battler tagged with its artist (no ids
// yet). The single source the gallery and match-roster builders draw from.
function flattenRoster(): Omit<Battler, 'id'>[] {
  return ARTIST_BATTLERS.flatMap((a) => a.battlers.map((b) => ({ ...b, artist: a.name })));
}

// Artist credits across the roster, in authoring order.
export function uniqueArtists(): LocaleText[] {
  return ARTIST_BATTLERS.map((a) => a.name);
}

// The whole roster grouped by artist, with each fighter given a stable id. Used
// by the Gallery screen.
export function battlersByArtist(): { artist: LocaleText; battlers: Battler[] }[] {
  let id = 0;
  return ARTIST_BATTLERS.map((a) => ({
    artist: a.name,
    battlers: a.battlers.map((b) => ({ ...b, artist: a.name, id: id++ })),
  }));
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
  const shuffled = shuffle(flattenRoster());
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
