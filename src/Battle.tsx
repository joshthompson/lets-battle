import { createStore, produce } from 'solid-js/store';
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import type { Battler } from './battlers';
import BattlerSprite from './BattlerSprite';
import Arena from './Arena';
import { t, tx } from './i18n';
import launcherBaseImg from './assets/misc/launcher-base.png';
import launcherTubeImg from './assets/misc/launcher-tube.png';
import explode1Img from './assets/misc/explode1.png';
import explode2Img from './assets/misc/explode2.png';
import explode3Img from './assets/misc/explode3.png';
import explode4Img from './assets/misc/explode4.png';
import random1Img from './assets/misc/random1.png';
import random2Img from './assets/misc/random2.png';
import random3Img from './assets/misc/random3.png';
import random4Img from './assets/misc/random4.png';
import { getItem, SPAWN_ITEMS, LAUNCHER_ITEMS, type ItemType } from './items';

// Explosion animation frames, shown in turn once a bomb lands.
const EXPLODE_FRAMES = [explode1Img, explode2Img, explode3Img, explode4Img];

// Squiggle frames cycled in the launcher base while reloading.
const RANDOM_FRAMES = [random1Img, random2Img, random3Img, random4Img];
const RANDOM_FRAME_MS = 100; // how long each squiggle shows

// Single source of truth for arena geometry. The floor is the oval the fighters
// move within, inset from the arena edges to match the background art. These
// values are also handed to CSS as custom properties (see the .arena style in
// the render) so the layout and the simulation never drift apart.
const ARENA = {
  width: 1200,
  height: 800,
  // Inset of the oval floor from the arena edges, in px.
  floor: { top: 300, right: 230, bottom: 50, left: 230 },
};

// Derive the floor oval (centre + radii) from the inset.
const FLOOR_LEFT = ARENA.floor.left;
const FLOOR_RIGHT = ARENA.width - ARENA.floor.right;
const FLOOR_TOP = ARENA.floor.top;
const FLOOR_BOTTOM = ARENA.height - ARENA.floor.bottom;
const CX = (FLOOR_LEFT + FLOOR_RIGHT) / 2;
const CY = (FLOOR_TOP + FLOOR_BOTTOM) / 2;
// Keep the fighter's *centre* inside the oval, shrunk by ~half a sprite so the
// 60x90 box stays within the floor.
const RX = (FLOOR_RIGHT - FLOOR_LEFT) / 2 - 40;
const RY = (FLOOR_BOTTOM - FLOOR_TOP) / 2 - 55;

const FIGHTER_MAX_W = 60; // sprite is fitted within this box, preserving aspect
const FIGHTER_MAX_H = 90;

const SPEED = 75; // px / sec
const ATTACK_RANGE = 25; // distance between fighters' bottom-middle (feet) to land a hit
const ATTACK_COOLDOWN = 500; // ms between a fighter's hits
const FLASH_MS = 300; // duration of the damage/heal flash
const FLASH_PEAK = 0.5; // peak opacity of the flash overlay
const RED_HOLD_MS = 500; // how long the red damage-trail bar holds before fading
const RED_FADE_MS = 400; // how long the red damage-trail bar takes to fade out

// --- items ---
const ITEM_SIZE = 48;
const ITEM_SPEED = 55; // px / sec, drifts and bounces
const ITEM_PICKUP = 42; // centre distance to collect / trigger
const ITEM_SIGHT = 420; // how far a fighter notices an item
const ITEM_MAX = 5; // cap simultaneously on the arena
const ITEM_CLEARANCE = ITEM_PICKUP + 20; // keep new items this far from any fighter
const SPAWN_MIN = 2000;
const SPAWN_MAX = 4000;

const HEAL_AMOUNT = 30; // +30 of 100 max hp
const EFFECT_MS = 10000; // shield / strength / speed duration
const SHIELD_FADE = 600; // ms the shield takes to fade out at the end
const SHIELD_OPACITY = 0.6; // peak opacity of the shield bubble
const STRENGTH_DAMAGE = 1.5; // hits 1.5x harder
const STRENGTH_SCALE = 1.5; // sprite 1.5x larger
const SPEED_MULT = 2; // moves 2x faster

const TRAP_DAMAGE = 20; // damage dealt when a fighter steps on a bear trap
const TRAP_HOLD_MS = 1000; // how long the sprung trap stays before fading
const TRAP_FADE_MS = 400; // how long the sprung trap takes to fade out

// --- spring (stationary): launches whoever steps on it to a random spot ---
const SPRING_REST_SCALE = 0.3; // resting yScale — compressed flat on the floor
const SPRING_ANIM_MS = 700; // duration of the expand-and-settle "boing"
const SPRING_AIR_MS = 2000; // how long a launched fighter is airborne
const SPRING_AIR_HEIGHT = 260; // peak height of the launch arc, px
const SPRING_MAX_USES = 3; // distinct fighters it can launch before it's spent
const SPRING_HOLD_MS = 1000; // after its last use, how long before it fades
const SPRING_FADE_MS = 400; // fade-out duration once spent

// The boing: from rest, expand up past full, then a couple of damped bounces
// back to rest. Linear-interpolated keyframes (progress -> yScale).
const SPRING_SCALE_KEYS: [number, number][] = [
  [0, SPRING_REST_SCALE],
  [0.22, 1.05],
  [0.42, 0.72],
  [0.6, 0.95],
  [0.78, 0.84],
  [1, SPRING_REST_SCALE],
];
function springScaleY(elapsed: number): number {
  if (elapsed >= SPRING_ANIM_MS) return SPRING_REST_SCALE;
  const p = elapsed / SPRING_ANIM_MS;
  for (let i = 1; i < SPRING_SCALE_KEYS.length; i++) {
    if (p <= SPRING_SCALE_KEYS[i][0]) {
      const [p0, v0] = SPRING_SCALE_KEYS[i - 1];
      const [p1, v1] = SPRING_SCALE_KEYS[i];
      return v0 + (v1 - v0) * ((p - p0) / (p1 - p0));
    }
  }
  return SPRING_REST_SCALE;
}

// --- sword (launcher-only): orbits whoever picks it up, slashing rivals ---
const SWORD_IMG = getItem('sword').imageUrl;
const SWORD_SPIN_MS = 1000; // one full orbit around the holder
const SWORD_DURATION_MS = 5000; // how long the holder keeps the sword
const SWORD_FADE_MS = 500; // fade-out once the duration is up
const SWORD_RADIUS = 46; // orbit radius around the holder, px
const SWORD_PERSPECTIVE = 600; // 3D perspective depth for the orbit, px
const SWORD_DAMAGE = 5; // health a rival loses on contact
const SWORD_HIT_RANGE = 30; // distance from the blade to a rival's feet to land a hit

// --- bomb (launcher-only): detonates where it lands ---
const BOMB_DAMAGE = 20; // peak damage at the blast centre
const BOMB_INNER = 50; // within this radius a fighter takes full damage
const BOMB_OUTER = 120; // beyond this radius a fighter takes none (linear falloff between)
const EXPLODE_SIZE = 200; // px box the explosion art is drawn into
const EXPLODE_FRAME_MS = 60; // how long each explosion frame shows

// --- item launcher (player-controlled) ---
const LAUNCHER_X = CX; // launcher sits bottom-centre
const LAUNCHER_PIVOT_Y = 760; // the barrel's hinge, down in the floor lip
const MUZZLE_DIST = 80; // distance from the pivot to the tube's open end (matches the art)
const AIM_MIN = -65; // barrel sweep limits, degrees (0 = straight up)
const AIM_MAX = 65;
const AIM_SPEED = 75; // degrees / sec while aiming
const POWER_SPEED = 1.7; // power-meter oscillation (full 0→1→0 sweeps / sec)
const LAUNCH_SPEED_MIN = 25; // px / sec at zero power — barely leaves the muzzle
const LAUNCH_SPEED_MAX = 700; // px / sec at full power
const LAUNCH_DRAG = 1.6; // per-second exponential speed decay while a projectile flies
// Items are lobbed: they arc up off the floor and fall back down. The shadow
// stays on the ground while the sprite rises by `lift`.
const LAUNCH_GRAVITY = 900; // px/sec^2 pulling a flying item back to the floor
const LAUNCH_LIFT_MIN = 160; // upward launch velocity at zero power (px/sec) — a small hop
const LAUNCH_LIFT_MAX = 540; // upward launch velocity at full power (px/sec) — a high arc
const RELOAD_MS = 3500; // delay before a new item loads into the launcher

interface Item {
  id: number;
  type: ItemType;
  imageUrl: string; // current sprite (the trap swaps to its closed image)
  closedImageUrl?: string; // bear trap: sprite to show once sprung
  moves: boolean; // false for the stationary bear trap
  x: number;
  y: number;
  vx: number;
  vy: number;
  sprungAt: number; // bear trap: timestamp it snapped shut (0 = still open)
  opacity: number; // display opacity (1; ramps to 0 after a trap springs)
  flying: boolean; // launched projectile still in the air (arcing toward the floor)
  lift: number; // height above the floor (px); the sprite renders this far above its shadow
  vlift: number; // vertical velocity of the arc (px/sec; gravity pulls it back down)
  // spring only:
  springAt: number; // timestamp of the last boing trigger (0 = at rest)
  sprungIds: number[]; // distinct fighter ids it has launched
  doneAt: number; // timestamp it became fully used (0 = still usable)
  scaleY: number; // current display yScale (springs compress to SPRING_REST_SCALE)
}

// A bomb blast playing out where a launched bomb came to rest.
interface Explosion {
  id: number;
  x: number;
  y: number;
  startedAt: number; // timestamp the blast began
  frame: number; // index into EXPLODE_FRAMES, advanced each tick from elapsed time
}

interface Entity extends Battler {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  ko: boolean;
  koDir: 1 | -1; // which way it topples when knocked out
  koAt: number; // timestamp it was knocked out (0 = alive)
  facing: 1 | -1; // 1 = facing right (art default), -1 = mirrored
  flashUntil: number; // timestamp the damage flash ends
  flash: number; // current red-overlay opacity (0..FLASH_PEAK)
  healUntil: number; // timestamp the heal flash ends
  heal: number; // current green-overlay opacity (0..FLASH_PEAK)
  redHp: number; // damage-trail bar: hp % it holds at (the pre-damage value)
  redUntil: number; // timestamp the red trail holds until, then it fades
  redOpacity: number; // current red-trail opacity (display)
  shieldUntil: number; // timestamp the shield ends
  shieldOpacity: number; // current shield-circle opacity (display)
  strengthUntil: number; // timestamp the strength buff ends
  speedUntil: number; // timestamp the speed buff ends
  speedActive: boolean; // display: speed buff currently active (speeds the walk cycle)
  scale: number; // current sprite scale (display; 1 or STRENGTH_SCALE)
  nextAttack: number; // timestamp the fighter may attack again
  nextRetarget: number; // timestamp to re-pick a heading
  // spring launch (airborne arc to a random spot; invulnerable in the air):
  airUntil: number; // timestamp the fighter lands (0 = grounded)
  airStart: number; // timestamp the launch began
  airFromX: number; // launch origin
  airFromY: number;
  airToX: number; // landing target
  airToY: number;
  lift: number; // current height above the floor (display; 0 on the ground)
  // sword (orbits the holder, slashing rivals it sweeps through):
  swordStart: number; // timestamp the sword was picked up (0 = none); drives the orbit angle
  swordUntil: number; // timestamp the sword stops dealing damage (then it fades out)
  swordRotation: number; // current orbit index; rivals can be hit once per rotation
  swordHitIds: number[]; // rivals already struck during the current rotation
  swordAngle: number; // display: current orbit angle, radians
  swordOpacity: number; // display: sword opacity (1, ramps to 0 during the fade)
}

function randomHeading(): { vx: number; vy: number } {
  const a = Math.random() * Math.PI * 2;
  return { vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED };
}

// Is (x, y) inside the inner movement ellipse?
function insideEllipse(x: number, y: number): boolean {
  const dx = (x - CX) / RX;
  const dy = (y - CY) / RY;
  return dx * dx + dy * dy <= 1;
}

export default function Battle(props: {
  battlers: Battler[];
  onWin: (b: Battler) => void;
  onDraw: (battlers: Battler[]) => void;
}) {
  const n = props.battlers.length;
  const now0 = performance.now();

  const initial: Entity[] = props.battlers.map((b, i) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    const h = randomHeading();
    return {
      ...b,
      x: CX + Math.cos(angle) * RX * 0.62,
      y: CY + Math.sin(angle) * RY * 0.62,
      vx: h.vx,
      vy: h.vy,
      hp: 100,
      ko: false,
      koDir: 1,
      koAt: 0,
      facing: h.vx < 0 ? -1 : 1,
      flashUntil: 0,
      flash: 0,
      healUntil: 0,
      heal: 0,
      redHp: 100,
      redUntil: 0,
      redOpacity: 0,
      shieldUntil: 0,
      shieldOpacity: 0,
      strengthUntil: 0,
      speedUntil: 0,
      speedActive: false,
      scale: 1,
      nextAttack: now0 + Math.random() * 400,
      nextRetarget: now0 + 500 + Math.random() * 1000,
      airUntil: 0,
      airStart: 0,
      airFromX: 0,
      airFromY: 0,
      airToX: 0,
      airToY: 0,
      lift: 0,
      swordStart: 0,
      swordUntil: 0,
      swordRotation: 0,
      swordHitIds: [],
      swordAngle: 0,
      swordOpacity: 0,
    };
  });

  const [entities, setEntities] = createStore(initial);

  // Per-fighter sprite size, fitted to the image's aspect ratio within the max
  // box. Defaults to the full box (used by colour-block fighters and until an
  // image's natural size is known).
  const initialSizes: Record<number, { w: number; h: number }> = {};
  for (const b of props.battlers) initialSizes[b.id] = { w: FIGHTER_MAX_W, h: FIGHTER_MAX_H };
  const [sizes, setSizes] = createStore(initialSizes);

  // Items drifting around the arena (or, for traps, lying in wait).
  const [items, setItems] = createStore<Item[]>([]);
  const [explosions, setExplosions] = createStore<Explosion[]>([]);
  let explosionSeq = 0;
  let itemSeq = 0;
  let nextSpawn = now0 + SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);

  // Player-controlled launcher. 'aiming' sweeps the barrel; one press locks the
  // angle and starts the power meter ('powering'); a second press fires and the
  // launcher reloads ('reloading') before loading a fresh item.
  const [launcher, setLauncher] = createStore({
    phase: 'aiming' as 'aiming' | 'powering' | 'reloading',
    itemIndex: Math.floor(Math.random() * LAUNCHER_ITEMS.length),
    angle: AIM_MIN, // barrel rotation, degrees (0 = straight up)
    angleDir: 1,
    power: 0, // 0..1
    powerDir: 1,
    reloadUntil: 0,
    reloadProgress: 0, // 0..1, drives the progress bar in the button while reloading
    randomFrame: 0, // index into RANDOM_FRAMES, cycled while reloading
  });

  const fireLauncher = () => {
    if (finished) return;
    if (launcher.phase === 'aiming') {
      // Lock the aim and start charging power.
      setLauncher({ phase: 'powering', power: 0, powerDir: 1 });
    } else if (launcher.phase === 'powering') {
      // Lock the power and fire the loaded item out of the tube's end, travelling
      // in exactly the direction the tube points.
      const def = getItem(LAUNCHER_ITEMS[launcher.itemIndex]);
      const rad = (launcher.angle * Math.PI) / 180;
      const dirX = Math.sin(rad);
      const dirY = -Math.cos(rad);
      const speed = LAUNCH_SPEED_MIN + (LAUNCH_SPEED_MAX - LAUNCH_SPEED_MIN) * launcher.power;
      const moves = def.moves !== false;
      setItems((list) => [
        ...list,
        {
          id: itemSeq++,
          type: def.type,
          imageUrl: def.imageUrl,
          closedImageUrl: def.closedImageUrl,
          moves,
          x: LAUNCHER_X + dirX * MUZZLE_DIST,
          y: LAUNCHER_PIVOT_Y + dirY * MUZZLE_DIST,
          vx: dirX * speed,
          vy: dirY * speed,
          sprungAt: 0,
          opacity: 1,
          flying: true,
          lift: 0,
          vlift: LAUNCH_LIFT_MIN + (LAUNCH_LIFT_MAX - LAUNCH_LIFT_MIN) * launcher.power,
          springAt: 0,
          sprungIds: [],
          doneAt: 0,
          scaleY: def.type === 'spring' ? SPRING_REST_SCALE : 1,
        },
      ]);
      setLauncher({ phase: 'reloading', reloadUntil: performance.now() + RELOAD_MS, reloadProgress: 0 });
    }
  };

  // The last fighter standing celebrates in place before the victory screen.
  const [championId, setChampionId] = createSignal<number | null>(null);
  const [jumping, setJumping] = createSignal(false);
  // True once the match is decided (a winner or a draw) — greys out the arena.
  const [over, setOver] = createSignal(false);
  // When there's a single winner, the arena zooms in on their position.
  const [zoom, setZoom] = createSignal<{ x: number; y: number } | null>(null);

  let raf = 0;
  let last = now0;
  let finished = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  // Screen-y of the middle of a fighter's body, where the orbiting sword rides.
  // e.y is the centre of the 90px box; the sprite is bottom-anchored, so its feet
  // sit at e.y + FIGHTER_MAX_H/2 and its mid-body is half a sprite-height above that.
  const bodyMidY = (e: Entity) =>
    e.y + FIGHTER_MAX_H / 2 - ((sizes[e.id]?.h ?? FIGHTER_MAX_H) * e.scale) / 2;

  // Apply a collected item's effect to the fighter.
  const applyEffect = (e: Entity, type: ItemType, now: number) => {
    if (type === 'health') {
      e.hp = Math.min(100, e.hp + HEAL_AMOUNT);
      e.healUntil = now + FLASH_MS;
    } else if (type === 'shield') {
      e.shieldUntil = now + EFFECT_MS;
    } else if (type === 'strength') {
      e.strengthUntil = now + EFFECT_MS;
    } else if (type === 'speed') {
      e.speedUntil = now + EFFECT_MS;
    } else if (type === 'sword') {
      e.swordStart = now;
      e.swordUntil = now + SWORD_DURATION_MS;
      e.swordRotation = 0;
      e.swordHitIds = [];
    }
  };

  // Triangle ramp 0 -> peak -> 0 across a flash window ending at `until`.
  const flashRamp = (now: number, until: number) => {
    if (now >= until) return 0;
    const t = 1 - (until - now) / FLASH_MS;
    return FLASH_PEAK * (1 - Math.abs(2 * t - 1));
  };

  // A random point well inside the floor oval.
  const randomFloorPoint = () => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.85;
    return { x: CX + Math.cos(a) * RX * r, y: CY + Math.sin(a) * RY * r };
  };

  // A random floor point clear of all living fighters, so items don't spawn on
  // top of someone (which would instantly collect them / spring a trap). Tries a
  // handful of times, then falls back to the last point if the arena is crowded.
  const randomSpawnPoint = () => {
    let pos = randomFloorPoint();
    const clear = (p: { x: number; y: number }) =>
      entities.every((e) => e.ko || Math.hypot(e.x - p.x, e.y - p.y) >= ITEM_CLEARANCE);
    for (let i = 0; i < 12 && !clear(pos); i++) pos = randomFloorPoint();
    return pos;
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // --- launcher: sweep the aim, oscillate the power, reload after firing ---
    if (!finished) {
      setLauncher(
        produce((l) => {
          if (l.phase === 'aiming') {
            l.angle += AIM_SPEED * dt * l.angleDir;
            if (l.angle >= AIM_MAX) {
              l.angle = AIM_MAX;
              l.angleDir = -1;
            } else if (l.angle <= AIM_MIN) {
              l.angle = AIM_MIN;
              l.angleDir = 1;
            }
          } else if (l.phase === 'powering') {
            l.power += POWER_SPEED * dt * l.powerDir;
            if (l.power >= 1) {
              l.power = 1;
              l.powerDir = -1;
            } else if (l.power <= 0) {
              l.power = 0;
              l.powerDir = 1;
            }
          } else if (l.phase === 'reloading') {
            l.reloadProgress = Math.min(1, 1 - (l.reloadUntil - now) / RELOAD_MS);
            l.randomFrame = Math.floor(now / RANDOM_FRAME_MS) % RANDOM_FRAMES.length;
            if (now >= l.reloadUntil) {
              // Resume sweeping from the angle the barrel was left at (it was
              // locked when the last shot fired), so the aim doesn't jump.
              l.phase = 'aiming';
              l.itemIndex = Math.floor(Math.random() * LAUNCHER_ITEMS.length);
              l.reloadProgress = 0;
            }
          }
        }),
      );
    }

    // --- spawn a new item every 3-6s (up to the cap) ---
    if (!finished && now >= nextSpawn) {
      nextSpawn = now + SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      if (items.length < ITEM_MAX) {
        const def = getItem(SPAWN_ITEMS[Math.floor(Math.random() * SPAWN_ITEMS.length)]);
        const pos = randomSpawnPoint();
        const moves = def.moves !== false;
        const h = randomHeading();
        const sp = ITEM_SPEED / SPEED;
        setItems((list) => [
          ...list,
          {
            id: itemSeq++,
            type: def.type,
            imageUrl: def.imageUrl,
            closedImageUrl: def.closedImageUrl,
            moves,
            x: pos.x,
            y: pos.y,
            vx: moves ? h.vx * sp : 0,
            vy: moves ? h.vy * sp : 0,
            sprungAt: 0,
            opacity: 1,
            flying: false,
            lift: 0,
            vlift: 0,
            springAt: 0,
            sprungIds: [],
            doneAt: 0,
            scaleY: def.type === 'spring' ? SPRING_REST_SCALE : 1,
          },
        ]);
      }
    }

    // --- update items: drift the moving ones, fade out sprung traps ---
    const expired: number[] = [];
    const detonations: { x: number; y: number }[] = []; // bombs that landed this tick
    setItems(
      produce((list: Item[]) => {
        for (const p of list) {
          if (p.flying) {
            // Launched projectile: arc up off the floor and fall back down while
            // drifting forward, bouncing off the floor edge. It lands when its
            // lift returns to the ground.
            p.vlift -= LAUNCH_GRAVITY * dt;
            p.lift += p.vlift * dt;
            const k = Math.exp(-LAUNCH_DRAG * dt);
            p.vx *= k;
            p.vy *= k;
            const nx = p.x + p.vx * dt;
            const ny = p.y + p.vy * dt;
            if (!insideEllipse(p.x, p.y) || insideEllipse(nx, ny)) {
              p.x = nx;
              p.y = ny;
            } else {
              p.vx = -p.vx;
              p.vy = -p.vy;
            }
            if (p.lift <= 0) {
              p.lift = 0;
              if (p.type === 'bomb') {
                // A bomb detonates the instant it lands rather than settling into
                // a collectible item: record the blast and remove the bomb.
                detonations.push({ x: p.x, y: p.y });
                expired.push(p.id);
              } else {
                // Come to rest where it lands.
                p.flying = false;
                p.vx = 0;
                p.vy = 0;
                p.vlift = 0;
              }
            }
            continue;
          }
          if (p.type === 'spring') {
            // Drive the boing scale, and once spent (two fighters launched) hold
            // briefly then fade out.
            p.scaleY = p.springAt ? springScaleY(now - p.springAt) : SPRING_REST_SCALE;
            if (p.springAt && now - p.springAt >= SPRING_ANIM_MS) p.springAt = 0;
            if (p.doneAt) {
              const since = now - p.doneAt;
              if (since >= SPRING_HOLD_MS) {
                const f = (since - SPRING_HOLD_MS) / SPRING_FADE_MS;
                p.opacity = f >= 1 ? 0 : 1 - f;
                if (f >= 1) expired.push(p.id);
              }
            }
            continue;
          }
          if (p.sprungAt) {
            // A sprung trap holds, then fades out and is removed.
            const since = now - p.sprungAt;
            if (since >= TRAP_HOLD_MS) {
              const f = (since - TRAP_HOLD_MS) / TRAP_FADE_MS;
              p.opacity = f >= 1 ? 0 : 1 - f;
              if (f >= 1) expired.push(p.id);
            }
            continue;
          }
          if (!p.moves) continue; // open trap: stays put
          const nx = p.x + p.vx * dt;
          const ny = p.y + p.vy * dt;
          if (insideEllipse(nx, ny)) {
            p.x = nx;
            p.y = ny;
          } else {
            p.vx = -p.vx;
            p.vy = -p.vy;
          }
        }
      }),
    );
    if (expired.length) setItems((list) => list.filter((p) => !expired.includes(p.id)));

    // Play an explosion at each bomb that just landed.
    if (detonations.length) {
      setExplosions((list) => [
        ...list,
        ...detonations.map((d) => ({ id: explosionSeq++, x: d.x, y: d.y, startedAt: now, frame: 0 })),
      ]);
    }

    // Advance each explosion's frame from elapsed time and drop finished ones.
    const explodeLife = EXPLODE_FRAMES.length * EXPLODE_FRAME_MS;
    if (explosions.length) {
      setExplosions(produce((list: Explosion[]) => {
        for (const x of list) {
          x.frame = Math.min(EXPLODE_FRAMES.length - 1, Math.floor((now - x.startedAt) / EXPLODE_FRAME_MS));
        }
      }));
      if (explosions.some((x) => now - x.startedAt >= explodeLife)) {
        setExplosions((list) => list.filter((x) => now - x.startedAt < explodeLife));
      }
    }

    const consumed: number[] = []; // collected items to remove
    const sprung: number[] = []; // bear traps triggered this tick
    const springLaunches = new Map<number, number[]>(); // spring id -> fighter ids it launched this tick

    setEntities(
      produce((list: Entity[]) => {
        const alive = list.filter((e) => !e.ko);

        // --- movement & simple AI ---
        for (const e of alive) {
          // Spring launch: arc from origin to a random landing spot over 2s,
          // ignoring normal movement. Lift is a parabola peaking mid-flight.
          if (now < e.airUntil) {
            const p = Math.min(1, (now - e.airStart) / SPRING_AIR_MS);
            e.x = e.airFromX + (e.airToX - e.airFromX) * p;
            e.y = e.airFromY + (e.airToY - e.airFromY) * p;
            e.lift = SPRING_AIR_HEIGHT * 4 * p * (1 - p);
            const dx = e.airToX - e.airFromX;
            if (dx > 8) e.facing = 1;
            else if (dx < -8) e.facing = -1;
            continue;
          }
          if (e.lift !== 0) {
            // Just landed: settle on the ground and pick a fresh heading.
            e.lift = 0;
            const h = randomHeading();
            e.vx = h.vx;
            e.vy = h.vy;
          }

          if (now >= e.nextRetarget) {
            e.nextRetarget = now + 600 + Math.random() * 1200;

            // Nearest item within sight, if any (ignore traps — fighters don't
            // knowingly seek them out; a sprung trap is no longer a target).
            let pu: Item | null = null;
            let puD = ITEM_SIGHT;
            for (const p of items) {
              if (p.type === 'beartrap' || p.type === 'spring' || p.flying) continue;
              const d = Math.hypot(p.x - e.x, p.y - e.y);
              if (d < puD) {
                puD = d;
                pu = p;
              }
            }

            const headTo = (tx: number, ty: number) => {
              const dx = tx - e.x;
              const dy = ty - e.y;
              const len = Math.hypot(dx, dy) || 1;
              e.vx = (dx / len) * SPEED;
              e.vy = (dy / len) * SPEED;
            };

            if (pu && Math.random() < 0.6) {
              // Go grab the item.
              headTo(pu.x, pu.y);
            } else if (Math.random() < 0.6) {
              // Charge the nearest living enemy.
              let best: Entity | null = null;
              let bestD = Infinity;
              for (const o of alive) {
                if (o === e) continue;
                const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
                if (d < bestD) {
                  bestD = d;
                  best = o;
                }
              }
              if (best) headTo(best.x, best.y);
              else {
                const h = randomHeading();
                e.vx = h.vx;
                e.vy = h.vy;
              }
            } else {
              const h = randomHeading();
              e.vx = h.vx;
              e.vy = h.vy;
            }
          }

          // jitter so charges don't look robotic
          e.vx += (Math.random() - 0.5) * 20;
          e.vy += (Math.random() - 0.5) * 20;

          // Speed item scales the step (so it kicks in/out immediately).
          const sm = now < e.speedUntil ? SPEED_MULT : 1;
          e.speedActive = sm > 1; // also speeds up the walk-cycle animation
          const nx = e.x + e.vx * dt * sm;
          const ny = e.y + e.vy * dt * sm;
          if (insideEllipse(nx, ny)) {
            e.x = nx;
            e.y = ny;
          } else {
            // Hit the arena wall: bounce back toward the centre.
            const dx = CX - e.x;
            const dy = CY - e.y;
            const len = Math.hypot(dx, dy) || 1;
            e.vx = (dx / len) * SPEED;
            e.vy = (dy / len) * SPEED;
          }

          // Face the way we're moving (hysteresis band keeps it from flickering
          // when vx hovers around zero).
          if (e.vx > 8) e.facing = 1;
          else if (e.vx < -8) e.facing = -1;
        }

        // --- combat ---
        for (const e of alive) {
          if (now < e.airUntil) continue; // airborne: can't attack
          // find the closest living enemy we are touching & facing
          for (const o of alive) {
            if (o === e || o.hp <= 0) continue;
            if (now < o.airUntil) continue; // airborne: invulnerable
            const dx = o.x - e.x;
            const dy = o.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > ATTACK_RANGE) continue;
            // "facing" = our heading points roughly toward the target
            const facing = e.vx * dx + e.vy * dy > 0;
            if (!facing) continue;
            if (now < e.nextAttack) continue;

            e.nextAttack = now + ATTACK_COOLDOWN;

            // Shielded targets take no damage (the hit is absorbed).
            if (now < o.shieldUntil) break;

            let dmg = 5 + Math.floor(Math.random() * 6); // 5-10
            if (now < e.strengthUntil) dmg = Math.round(dmg * STRENGTH_DAMAGE);
            // Damage trail: the red bar anchors at the hp *before* this damage
            // burst and holds there. If it's still showing from a recent hit,
            // keep its original anchor; only re-anchor once it has faded out.
            if (now >= o.redUntil + RED_FADE_MS) o.redHp = o.hp;
            o.redUntil = now + RED_HOLD_MS; // (re)start the hold each hit
            o.hp = Math.max(0, o.hp - dmg);
            o.flashUntil = now + FLASH_MS; // the fighter that got hit flashes
            if (o.hp <= 0) {
              o.ko = true;
              o.koDir = Math.random() < 0.5 ? 1 : -1; // topple left or right
              o.koAt = now;
            }
            break;
          }
        }

        // --- bomb blasts: full damage at the centre, falling off to zero by
        // BOMB_OUTER. Like a trap, a shield does not absorb it. ---
        for (const d of detonations) {
          for (const e of alive) {
            if (e.ko) continue;
            if (now < e.airUntil) continue; // airborne: invulnerable
            const dist = Math.hypot(e.x - d.x, e.y - d.y);
            if (dist >= BOMB_OUTER) continue;
            const falloff =
              dist <= BOMB_INNER ? 1 : (BOMB_OUTER - dist) / (BOMB_OUTER - BOMB_INNER);
            const dmg = Math.round(BOMB_DAMAGE * falloff);
            if (dmg <= 0) continue;
            if (now >= e.redUntil + RED_FADE_MS) e.redHp = e.hp;
            e.redUntil = now + RED_HOLD_MS;
            e.hp = Math.max(0, e.hp - dmg);
            e.flashUntil = now + FLASH_MS;
            if (e.hp <= 0) {
              e.ko = true;
              e.koDir = Math.random() < 0.5 ? 1 : -1;
              e.koAt = now;
            }
          }
        }

        // --- orbiting swords: a held sword sweeps a circle around its holder,
        // slashing any vulnerable rival it passes through (once per rotation). ---
        for (const e of alive) {
          if (now >= e.swordUntil) continue; // no sword, or it has stopped biting
          // Reset the per-rotation hit list each time a fresh spin begins.
          const rotation = Math.floor((now - e.swordStart) / SWORD_SPIN_MS);
          if (rotation !== e.swordRotation) {
            e.swordRotation = rotation;
            e.swordHitIds = [];
          }
          // The orbit is a turntable around the holder's vertical axis: the blade
          // swings out to e.x ± SWORD_RADIUS horizontally, riding at mid-body height.
          const angle = ((now - e.swordStart) / SWORD_SPIN_MS) * Math.PI * 2;
          const bx = e.x + Math.sin(angle) * SWORD_RADIUS;
          const by = bodyMidY(e);
          for (const o of alive) {
            if (o === e || o.hp <= 0) continue;
            if (now < o.airUntil) continue; // airborne: invulnerable
            if (now < o.shieldUntil) continue; // shielded: blade is turned aside
            if (e.swordHitIds.includes(o.id)) continue; // already cut this rotation
            if (Math.hypot(bx - o.x, by - bodyMidY(o)) >= SWORD_HIT_RANGE) continue;
            e.swordHitIds.push(o.id);
            if (now >= o.redUntil + RED_FADE_MS) o.redHp = o.hp;
            o.redUntil = now + RED_HOLD_MS;
            o.hp = Math.max(0, o.hp - SWORD_DAMAGE);
            o.flashUntil = now + FLASH_MS;
            if (o.hp <= 0) {
              o.ko = true;
              o.koDir = Math.random() < 0.5 ? 1 : -1;
              o.koAt = now;
            }
          }
        }

        // --- collect items / spring traps ---
        for (const e of alive) {
          if (now < e.airUntil) continue; // airborne: can't collect or trigger
          for (const p of items) {
            if (consumed.includes(p.id) || sprung.includes(p.id)) continue;
            if (p.flying) continue; // a mid-flight projectile can't be picked up yet
            if (p.sprungAt) continue; // an already-sprung trap is inert
            if (Math.hypot(p.x - e.x, p.y - e.y) >= ITEM_PICKUP) continue;
            if (p.type === 'spring') {
              // Launches whoever stands on it up into the air to a random spot.
              // Only two distinct fighters; then it's spent (fades below).
              if (p.doneAt) continue; // already spent
              const launched = springLaunches.get(p.id) ?? [];
              const distinct = new Set([...p.sprungIds, ...launched]);
              if (distinct.size >= SPRING_MAX_USES || distinct.has(e.id)) continue;
              launched.push(e.id);
              springLaunches.set(p.id, launched);
              // Send this fighter airborne to a random floor point (invulnerable).
              const dest = randomFloorPoint();
              e.airStart = now;
              e.airUntil = now + SPRING_AIR_MS;
              e.airFromX = e.x;
              e.airFromY = e.y;
              e.airToX = dest.x;
              e.airToY = dest.y;
            } else if (p.type === 'beartrap') {
              // Snaps shut on whoever stands in the middle: 20 damage, which a
              // shield does NOT block. The trap is updated in the items store below.
              sprung.push(p.id);
              if (now >= e.redUntil + RED_FADE_MS) e.redHp = e.hp;
              e.redUntil = now + RED_HOLD_MS;
              e.hp = Math.max(0, e.hp - TRAP_DAMAGE);
              e.flashUntil = now + FLASH_MS;
              if (e.hp <= 0) {
                e.ko = true;
                e.koDir = Math.random() < 0.5 ? 1 : -1;
                e.koAt = now;
              }
            } else {
              applyEffect(e, p.type, now);
              consumed.push(p.id);
            }
          }
        }

        // --- per-frame display state (flashes, shield, scale) ---
        for (const e of list) {
          e.flash = flashRamp(now, e.flashUntil);
          e.heal = flashRamp(now, e.healUntil);

          // Damage trail: hold solid through redUntil, then fade over RED_FADE_MS.
          if (now < e.redUntil) {
            e.redOpacity = 1;
          } else {
            const f = (now - e.redUntil) / RED_FADE_MS;
            e.redOpacity = f >= 1 ? 0 : 1 - f;
          }

          if (now < e.shieldUntil) {
            const remaining = e.shieldUntil - now;
            const base = remaining < SHIELD_FADE ? remaining / SHIELD_FADE : 1;
            e.shieldOpacity = base * SHIELD_OPACITY;
          } else if (e.shieldOpacity !== 0) {
            e.shieldOpacity = 0;
          }

          const scale = now < e.strengthUntil ? STRENGTH_SCALE : 1;
          if (e.scale !== scale) e.scale = scale;

          // Sword: keep spinning while held, then fade out over SWORD_FADE_MS.
          if (e.swordStart) {
            e.swordAngle = ((now - e.swordStart) / SWORD_SPIN_MS) * Math.PI * 2;
            if (now < e.swordUntil) {
              e.swordOpacity = 1;
            } else if (now < e.swordUntil + SWORD_FADE_MS) {
              e.swordOpacity = 1 - (now - e.swordUntil) / SWORD_FADE_MS;
            } else {
              // Fully faded: retire the sword.
              e.swordStart = 0;
              e.swordOpacity = 0;
            }
          }
        }
      }),
    );

    if (consumed.length) setItems((list) => list.filter((p) => !consumed.includes(p.id)));

    // Snap shut any traps triggered this tick: swap to the closed sprite and
    // start their hold-then-fade timer.
    if (sprung.length) {
      setItems(
        produce((list: Item[]) => {
          for (const p of list) {
            if (sprung.includes(p.id) && !p.sprungAt) {
              p.sprungAt = now;
              if (p.closedImageUrl) p.imageUrl = p.closedImageUrl;
            }
          }
        }),
      );
    }

    // Fire the boing on any springs that launched a fighter this tick; mark them
    // spent (to fade) once they've sent off SPRING_MAX_USES distinct fighters.
    if (springLaunches.size) {
      setItems(
        produce((list: Item[]) => {
          for (const p of list) {
            const launched = springLaunches.get(p.id);
            if (!launched || !launched.length) continue;
            p.springAt = now;
            p.sprungIds = [...new Set([...p.sprungIds, ...launched])];
            if (p.sprungIds.length >= SPRING_MAX_USES && !p.doneAt) p.doneAt = now;
          }
        }),
      );
    }

    // --- win check ---
    const living = entities.filter((e) => !e.ko);
    if (!finished && living.length <= 1) {
      finished = true;
      setOver(true);
      cancelAnimationFrame(raf);
      if (living.length === 1) {
        const champ = living[0];
        // Winner stops moving immediately, starts jumping after 1s, and we
        // hold the celebration for 4s before showing the victory screen.
        setChampionId(champ.id);
        setZoom({ x: champ.x, y: champ.y });
        timers.push(setTimeout(() => setJumping(true), 1000));
        timers.push(setTimeout(() => props.onWin(champ), 4000));
      } else {
        // Nobody left: the last 2+ fighters were knocked out on the same tick.
        // Declare a draw between those who fell at that final moment.
        const lastAt = Math.max(...entities.map((e) => e.koAt));
        const drawn = entities
          .filter((e) => e.koAt === lastAt)
          .map((e) => props.battlers.find((b) => b.id === e.id)!);
        timers.push(setTimeout(() => props.onDraw(drawn), 2000));
      }
      return;
    }

    raf = requestAnimationFrame(tick);
  };

  onMount(() => {
    // Measure each image's natural aspect ratio and fit it within the max box.
    for (const b of props.battlers) {
      if (!b.imageUrl) continue;
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(FIGHTER_MAX_W / img.naturalWidth, FIGHTER_MAX_H / img.naturalHeight);
        setSizes(b.id, {
          w: Math.round(img.naturalWidth * scale),
          h: Math.round(img.naturalHeight * scale),
        });
      };
      img.src = b.imageUrl;
    }

    raf = requestAnimationFrame(tick);
  });
  onCleanup(() => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
  });

  return (
    <div class="screen battle">
      <Arena geometry={ARENA} greyscale={over()} zoom={zoom()}>
        <For each={entities}>
          {(e) => (
            <div
              class="fighter-wrap"
              style={{
                left: `${e.x - 30}px`,
                top: `${e.y - 45}px`,
                'z-index': Math.round(e.y),
              }}
            >
              <div
                class="fighter-shadow"
                style={{ width: `${(e.ko ? sizes[e.id].h : sizes[e.id].w) * e.scale}px` }}
              />
              <span class="label">{tx(e.name)}</span>
              {/* Per-fighter health bar; fades out once knocked out. */}
              <div class="health-bar" style={{ opacity: e.ko ? 0 : 1 }}>
                <div class="health-bar-damage" style={{ width: `${e.redHp}%`, opacity: e.redOpacity }} />
                <div class="health-bar-fill" style={{ width: `${e.hp}%` }} />
              </div>
              <div
                class={`fighter${e.ko ? ' ko' : ''}${
                  jumping() && e.id === championId() ? ' jumping' : ''
                }${e.lift > 0 ? ' airborne' : ''}${
                  e.movementType === 'wobble' || e.movementType === 'jump' || e.movementType === 'float'
                    ? ` move-${e.movementType}`
                    : ''
                }`}
                style={{
                  // Correction applied when knocked out (rotated ±90deg): bring the
                  // bottom-anchored sprite back onto the floor and re-centre it. The
                  // horizontal shift flips with the topple direction.
                  '--ko-dx': `${e.koDir * (FIGHTER_MAX_H / 2 - sizes[e.id].h / 2)}px`,
                  '--ko-dy': `${FIGHTER_MAX_H / 2 - sizes[e.id].w / 2}px`,
                  '--ko-rot': `${e.koDir * 90}deg`,
                  // Spring launch: lift the sprite off the floor (shadow stays put).
                  ...(e.lift > 0 ? { transform: `translateY(${-e.lift}px)` } : {}),
                }}
              >
                {/* scaleX carries facing; scale grows from the feet (strength) */}
                <div
                  class="fighter-flip"
                  style={{ transform: `scaleX(${e.facing * e.scale}) scaleY(${e.scale})` }}
                >
                  {/* body carries the walk animation, so the shield rides along */}
                  <div
                    class="fighter-body"
                    style={{
                      // Smaller value = shorter duration = faster cycle; the
                      // speed item shortens it by SPEED_MULT to match.
                      '--anim-speed': (e.animSpeed ?? 1) / (e.speedActive ? SPEED_MULT : 1),
                      '--anim-delay': `${-(e.animDelay ?? 0)}s`,
                    }}
                  >
                    <BattlerSprite
                      battler={e}
                      width={sizes[e.id].w}
                      height={sizes[e.id].h}
                      flash={e.flash}
                      heal={e.heal}
                    />
                    <div class="shield" style={{ opacity: e.shieldOpacity }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </For>

        <For each={items}>
          {(p) => (
            <div
              class="item-wrap"
              style={{
                left: `${p.x - ITEM_SIZE / 2}px`,
                top: `${p.y - ITEM_SIZE / 2}px`,
                'z-index': Math.round(p.y),
                opacity: p.opacity,
              }}
            >
              <div class="item-shadow" />
              {/* The shadow stays on the floor; the sprite rises by its lift. */}
              <div class="item-rise" style={{ transform: `translateY(${-p.lift}px)` }}>
                <img
                  class={`item${p.moves ? '' : ' item-static'}`}
                  src={p.imageUrl}
                  alt={p.type}
                  draggable={false}
                  // Spring compresses/expands vertically (from its base on the floor).
                  style={p.type === 'spring' ? { transform: `scaleX(1.5) scaleY(${p.scaleY})` } : undefined}
                />
              </div>
            </div>
          )}
        </For>

        {/* Orbiting swords. Each rides a 3D turntable around its holder via a
            matrix3d (rotateY · translateZ): the blade always faces radially
            outward, sweeping in front of the holder (drawn over) and behind it
            (drawn under), and fades out when the holder's time is up. */}
        <For each={entities}>
          {(e) => (
            <Show when={e.swordStart > 0}>
              <div
                class="sword-orbit"
                style={{
                  left: `${e.x}px`,
                  // Ride at the middle of the holder's body, not at its feet.
                  top: `${bodyMidY(e)}px`,
                  perspective: `${SWORD_PERSPECTIVE}px`,
                  // In front of the holder while swinging toward the viewer (cos > 0),
                  // behind it on the far half of the orbit.
                  'z-index': Math.round(e.y) + (Math.cos(e.swordAngle) >= 0 ? 1 : -1),
                  opacity: e.swordOpacity,
                }}
              >
                <img
                  class="sword-orbit-img"
                  src={SWORD_IMG}
                  alt="sword"
                  draggable={false}
                  // rotateY(angle)·translateZ(radius), written out as a matrix3d so the
                  // blade orbits the vertical axis and keeps facing outward.
                  style={{
                    transform: `matrix3d(${Math.cos(e.swordAngle)},0,${-Math.sin(e.swordAngle)},0, 0,1,0,0, ${Math.sin(
                      e.swordAngle,
                    )},0,${Math.cos(e.swordAngle)},0, ${Math.sin(e.swordAngle) * SWORD_RADIUS},0,${
                      Math.cos(e.swordAngle) * SWORD_RADIUS
                    },1)`,
                  }}
                />
              </div>
            </Show>
          )}
        </For>

        <For each={explosions}>
          {(x) => (
            <img
              class="explosion"
              src={EXPLODE_FRAMES[x.frame]}
              style={{
                left: `${x.x - EXPLODE_SIZE / 2}px`,
                top: `${x.y - EXPLODE_SIZE / 2}px`,
                width: `${EXPLODE_SIZE}px`,
                height: `${EXPLODE_SIZE}px`,
                'z-index': Math.round(x.y) + 1000,
              }}
              alt=""
              draggable={false}
            />
          )}
        </For>

        {/* Player-controlled item launcher at the bottom-centre of the arena.
            The tube rotates to aim (behind the base); the loaded item sits in the
            base's ring; the button is to the right. */}
        <div class="launcher">
          <img
            class="launcher-tube"
            src={launcherTubeImg}
            style={{ left: `${LAUNCHER_X}px`, top: `${LAUNCHER_PIVOT_Y}px`, transform: `rotate(${launcher.angle}deg)` }}
            alt=""
            draggable={false}
          />
          <img
            class="launcher-base"
            src={launcherBaseImg}
            style={{ left: `${LAUNCHER_X}px`, top: `${LAUNCHER_PIVOT_Y}px` }}
            alt=""
            draggable={false}
          />
          <Show when={launcher.phase !== 'reloading'}>
            <img
              class="launcher-item"
              src={getItem(LAUNCHER_ITEMS[launcher.itemIndex]).imageUrl}
              style={{ left: `${LAUNCHER_X}px`, top: `${LAUNCHER_PIVOT_Y}px` }}
              alt=""
              draggable={false}
            />
          </Show>
          {/* While reloading, flicker through squiggle frames in the base ring. */}
          <Show when={launcher.phase === 'reloading'}>
            <img
              class="launcher-item launcher-reload-squiggle"
              src={RANDOM_FRAMES[launcher.randomFrame]}
              style={{ left: `${LAUNCHER_X}px`, top: `${LAUNCHER_PIVOT_Y}px` }}
              alt=""
              draggable={false}
            />
          </Show>
          <div class="launcher-controls" style={{ left: `${LAUNCHER_X + 62}px`, top: `${LAUNCHER_PIVOT_Y}px` }}>
            <Show when={launcher.phase === 'powering'}>
              <div class="launcher-power">
                <div class="launcher-power-fill" style={{ height: `${launcher.power * 100}%` }} />
              </div>
            </Show>
            <button
              class="launcher-btn"
              onClick={fireLauncher}
              disabled={launcher.phase === 'reloading'}
              type="button"
            >
              <Show when={launcher.phase === 'reloading'}>
                <span class="launcher-btn-progress" style={{ width: `${launcher.reloadProgress * 100}%` }} />
              </Show>
              <span class="launcher-btn-label">
                {launcher.phase === 'aiming' ? t('aim') : launcher.phase === 'powering' ? t('fire') : t('reloading')}
              </span>
            </button>
          </div>
        </div>
      </Arena>
    </div>
  );
}
