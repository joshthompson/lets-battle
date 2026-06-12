// Item definitions. Most drift around the arena and apply a buff or heal when a
// fighter walks into them. The bear trap is different: it stays put, lying open
// until a fighter steps on it, then snaps shut, deals damage, and fades out.
import healthImg from './assets/items/health.png';
import shieldImg from './assets/items/shield.png';
import strengthImg from './assets/items/strength.png';
import speedImg from './assets/items/speed.png';
import bearTrapOpenImg from './assets/items/bear-trap-open.png';
import bearTrapClosedImg from './assets/items/bear-trap-closed.png';

export type ItemType = 'health' | 'shield' | 'strength' | 'speed' | 'beartrap';

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
];
