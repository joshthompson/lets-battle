// Item definitions. Most drift around the arena and apply a buff or heal when a
// fighter walks into them. The bear trap is different: it stays put, lying open
// until a fighter steps on it, then snaps shut, deals damage, and fades out.
import healthImg from './assets/items/health.png';
import shieldImg from './assets/items/shield.png';
import strengthImg from './assets/items/strength.png';
import speedImg from './assets/items/speed.png';
import bearTrapOpenImg from './assets/items/bear-trap-open.png';
import bearTrapClosedImg from './assets/items/bear-trap-closed.png';
import bombImg from './assets/items/bomb.png';
import springImg from './assets/items/spring.png';

export type ItemType = 'health' | 'shield' | 'strength' | 'speed' | 'beartrap' | 'bomb' | 'spring';

export interface ItemDef {
  type: ItemType;
  imageUrl: string;
  // Bear trap only: the sprite shown once it has snapped shut.
  closedImageUrl?: string;
  // Whether the item drifts around the arena. Traps stay put; defaults to true.
  moves?: boolean;
}

export const ITEMS: ItemDef[] = [
  { type: 'health', imageUrl: healthImg },
  { type: 'shield', imageUrl: shieldImg },
  { type: 'strength', imageUrl: strengthImg },
  { type: 'speed', imageUrl: speedImg },
  { type: 'beartrap', imageUrl: bearTrapOpenImg, closedImageUrl: bearTrapClosedImg, moves: false },
  { type: 'bomb', imageUrl: bombImg },
  { type: 'spring', imageUrl: springImg, moves: false },
];

// Look up a definition by type.
const ITEM_BY_TYPE = new Map(ITEMS.map((i) => [i.type, i] as const));
export const getItem = (type: ItemType): ItemDef => ITEM_BY_TYPE.get(type)!;

// Which items appear where. SPAWN_ITEMS drift loose on the floor for fighters to
// pick up; LAUNCHER_ITEMS load into the player's launcher. An item can be in
// both, one, or neither.
export const SPAWN_ITEMS: ItemType[] = ['health', 'shield', 'strength', 'speed', 'beartrap', 'spring'];
export const LAUNCHER_ITEMS: ItemType[] = [
  'health',
  'shield',
  'strength',
  'beartrap',
  'bomb',
  'bomb',
  'spring',
  'spring',
  'spring',
];
