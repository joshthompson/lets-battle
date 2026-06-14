// Battler data. Hand-authored fighters with real artwork, grouped by the artist
// who drew them. Each renders as a 60x90 sprite (background colour with the
// image centred and contained on top).

// Retired battlers:
// import psyduckImg from './assets/battlers/psyduck.png';
// import antHeadImg from './assets/battlers/ant-head.png';
// import boltImage from './assets/battlers/bolt.png';
// import mrHoppyImg from './assets/battlers/mr-hoppy.png';

// Alisa's battlers:
// import fishEyesImg from './assets/battlers/alisa/fish-eyes.png';
// import monkeyImg from './assets/battlers/alisa/monkey.png';
import cabbageImg from './assets/battlers/alisa/cabbage.png';
import fartonImg from './assets/battlers/alisa/farton.png';
import grabbitImg from './assets/battlers/alisa/grabbit.png';
import sandwichtonImg from './assets/battlers/alisa/sandwichton.png';
import sneakyImg from './assets/battlers/alisa/sneaky.png';
import tumbaImg from './assets/battlers/alisa/tumba.png';

// Olesia's battlers:
import spikerImg from './assets/battlers/olesia/spiker.png';
import woofasaurusImg from './assets/battlers/olesia/woofasaurus.png';
import mannyImg from './assets/battlers/olesia/manny.gif';
import mrMooImg from './assets/battlers/olesia/mr-moo.gif';
import auntyImg from './assets/battlers/olesia/aunty.png';
import starNoseImg from './assets/battlers/olesia/star-nose.png';

// Irina's battlers:
import chickenPantsImg from './assets/battlers/irina/chicken-pants.png';
import fergusImg from './assets/battlers/irina/fergus.png';
import blubeeBeeImg from './assets/battlers/irina/blubee-bee.png';
import vanyaAndRexImg from './assets/battlers/irina/vanya-and-rex.png';
import mrsFeatherbowImg from './assets/battlers/irina/mrs-featherbow.png';
import gladysImg from './assets/battlers/irina/gladys.png';

// Anna's battlers:
import blubberImg from './assets/battlers/anna/blubber.png';
import fasionPawsImg from './assets/battlers/anna/fashion-paws.png';
import annaImg from './assets/battlers/anna/anna.png';
import flowerGirlImg from './assets/battlers/anna/flower-girl.png';
import catImg from './assets/battlers/anna/cat.png';
import happyManImg from './assets/battlers/anna/happy-man.png';

// Josh's battlers:
import coolGooseImg from './assets/battlers/josh/cool-goose.png';
import agentToeImg from './assets/battlers/josh/agent-toe.png';
import farfellaImg from './assets/battlers/josh/farfella.png';
import henryImg from './assets/battlers/josh/henry.png';
import noteGuyImg from './assets/battlers/josh/note-guy.png';
import billoonImg from './assets/battlers/josh/billoon.png';

// Olga's battlers:
import zhuzhelizaImg from './assets/battlers/olga/zhuzheliza.png'; 
import meduzoImg from './assets/battlers/olga/meduzo.png'; 
import longuyImg from './assets/battlers/olga/longuy.png'; 
import pizhonImg from './assets/battlers/olga/pizhon.png'; 
import scramblImg from './assets/battlers/olga/scrambl.png';

import { LocaleText } from './i18n';

type MovementType = 'wobble' | 'jump' | 'glide' | 'float' | 'slither';

export interface Battler {
  id: number;
  name: LocaleText;
  artist?: LocaleText;
  color: string;
  // The colour of the team (artist) this battler fights for. Used for the team
  // intro, the winner screen, and the name labels in the arena. Filled in from
  // the artist when the roster is flattened.
  teamColor?: string;
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
  color: string;
  battlers: Omit<Battler, 'id' | 'artist'>[];
}

// The full roster, grouped by artist. generateBattlers() flattens this (in a
// random order, or a random subset when capped) for a match; battlersByArtist()
// and uniqueArtists() read the grouping directly for the gallery and credits.
const ARTIST_BATTLERS: Artist[] = [
  {
    name: { en: 'Alisa', ru: 'Алиса' },
    color: '#F97316',
    battlers: [
      // {
      //   name: { en: 'Monkatt', ru: 'Обезкот' },
      //   color: '#FFA500',
      //   imageUrl: monkeyImg,
      //   movementType: 'wobble',
      // },
      {
        name: { en: 'Lady Cabbage', ru: 'Леди Капуста' },
        color: '#32CD32',
        imageUrl: cabbageImg,
        movementType: 'jump',
      },
      // {
      //   name: { en: 'Fish Eyes', ru: 'Рыбий Глаз' },
      //   color: '#20B2AA',
      //   imageUrl: fishEyesImg,
      //   movementType: 'wobble',
      // },
      {
        name: { en: 'Farton', ru: 'Пердун' },
        color: '#CEFBDB',
        imageUrl: fartonImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Grabbit', ru: 'Знаяц' },
        color: '#F2BDAA',
        imageUrl: grabbitImg,
        movementType: 'float',
      },
      {
        name: { en: 'Sandwichton', ru: 'Бутерович' },
        color: '#FAF660',
        imageUrl: sandwichtonImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Sneaky', ru: 'Сники' },
        color: '#B1EEC3',
        imageUrl: sneakyImg,
        movementType: 'slither',
      },
      {
        name: { en: 'Tumba', ru: 'Тумба' },
        color: '#EE9F98',
        imageUrl: tumbaImg,
        movementType: 'wobble',
      },
    ],
  },
  {
    name: { en: 'Olesia', ru: 'Олеся' },
    color: '#8B5CF6',
    battlers: [
      {
        name: { en: 'Chupapi', ru: 'Чупапи' },
        color: '#708090',
        imageUrl: spikerImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Woofasaurus', ru: 'Вуфазавр' },
        imageUrl: woofasaurusImg,
        color: '#B7C652',
        movementType: 'wobble',
      },
      {
        name: { en: 'Manny', ru: 'Ламми' },
        imageUrl: mannyImg,
        color: '#7EA6A4',
        movementType: 'float',
      },
      {
        name: { en: 'Mr Moo', ru: 'Мистер Муу' },
        imageUrl: mrMooImg,
        color: '#2D46B3',
        movementType: 'float',
      },
      {
        name: { en: 'Aunty', ru: 'Тётя' },
        imageUrl: auntyImg,
        color: '#6599E8',
        movementType: 'wobble',
      },
      {
        name: { en: 'Star Nose', ru: 'Звёздный Нос' },
        imageUrl: starNoseImg,
        color: '#EFAED9',
        movementType: 'float',
      },
    ],
  },
  {
    name: { en: 'Irina', ru: 'Ирина' },
    color: '#EC4899',
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
    color: '#2563EB',
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
    color: '#10B981',
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
      {
        name: { en: 'Tsveta', ru: 'Цвета' },
        color: '#F7A8B8',
        imageUrl: flowerGirlImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Cat', ru: 'Кот' },
        color: '#5131F2',
        imageUrl: catImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Lucky', ru: 'Счастливчик' },
        color: '#B0E0E6',
        imageUrl: happyManImg,
        movementType: 'jump',
      },
    ],
  },
  {
    name: { en: 'Olga', ru: 'Ольга' },
    color: '#D946EF',
    battlers: [
      {
        name: { en: 'Zhuzheliza', ru: 'Жужелица' },
        color: '#956955',
        imageUrl: zhuzhelizaImg,
        movementType: 'slither',
      },
      {
        name: { en: 'Meduzo', ru: 'Медузо' },
        color: '#EB8C93',
        imageUrl: meduzoImg,
        movementType: 'float',
      },
      {
        name: { en: 'Longuy', ru: 'Долговяз' },
        color: '#849EC7',
        imageUrl: longuyImg,
        movementType: 'wobble',
      },
      {
        name: { en: 'Pizhon', ru: 'Пижон' },
        color: '#E3B15B',
        imageUrl: pizhonImg,
        movementType: 'float',
      },
      {
        name: { en: 'Scrambl', ru: 'Скрамбл' },
        color: '#BADE60',
        imageUrl: scramblImg,
        movementType: 'wobble',
      },
    ],
  }
];

// Teams are capped at this many fighters in a match; artists with more get a
// random selection each match.
const TEAM_CAP = 6;

// The flat list of fighters for a match, each tagged with its artist (no ids
// yet). Every artist with more than TEAM_CAP battlers is randomly trimmed to
// that many, so each match fields a different cut of their roster.
function flattenRoster(): Omit<Battler, 'id'>[] {
  return ARTIST_BATTLERS.flatMap((a) => {
    const chosen = a.battlers.length > TEAM_CAP ? shuffle(a.battlers).slice(0, TEAM_CAP) : a.battlers;
    return chosen.map((b) => ({ ...b, artist: a.name, teamColor: a.color }));
  });
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
    battlers: a.battlers.map((b) => ({ ...b, artist: a.name, teamColor: a.color, id: id++ })),
  }));
}

// A team: an artist, their colour, and the battlers from a given roster that
// fight for them. Used by the intro (one slide per team) and to reason about who
// has won. Teams are returned in the order they first appear in `battlers`.
export interface Team {
  artist: LocaleText;
  color: string;
  battlers: Battler[];
}

export function groupByTeam(battlers: Battler[]): Team[] {
  const teams: Team[] = [];
  const byKey = new Map<string, Team>();
  for (const b of battlers) {
    const key = teamKey(b);
    let team = byKey.get(key);
    if (!team) {
      team = { artist: b.artist ?? b.name, color: b.teamColor ?? b.color, battlers: [] };
      byKey.set(key, team);
      teams.push(team);
    }
    team.battlers.push(b);
  }
  return teams;
}

// Stable identity for a battler's team. Two battlers are team-mates iff this
// matches. Falls back to the battler's own name so an artist-less fighter is its
// own one-person team rather than merging with every other artist-less one.
export function teamKey(b: Battler): string {
  const a = b.artist;
  if (a == null) return typeof b.name === 'string' ? b.name : b.name.en;
  return typeof a === 'string' ? a : a.en;
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
