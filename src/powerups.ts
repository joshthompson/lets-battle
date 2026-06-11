// Power-up definitions. `sword` exists as an asset but is intentionally left
// out of the spawn pool for now.
import healthImg from './assets/power-ups/health.png';
import shieldImg from './assets/power-ups/shield.png';
import strengthImg from './assets/power-ups/strength.png';
import speedImg from './assets/power-ups/speed.png';

export type PowerUpType = 'health' | 'shield' | 'strength' | 'speed';

export interface PowerUpDef {
  type: PowerUpType;
  imageUrl: string;
}

export const POWER_UPS: PowerUpDef[] = [
  { type: 'health', imageUrl: healthImg },
  { type: 'shield', imageUrl: shieldImg },
  { type: 'strength', imageUrl: strengthImg },
  { type: 'speed', imageUrl: speedImg },
];
