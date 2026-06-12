import { createStore, produce } from 'solid-js/store';
import { createSignal, For, onCleanup, onMount } from 'solid-js';
import type { Battler } from './battlers';
import BattlerSprite from './BattlerSprite';
import { tx } from './i18n';
import arenaImg from './assets/arena.jpg';
import { ITEMS, type ItemType } from './items';

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
  let itemSeq = 0;
  let nextSpawn = now0 + SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);

  // The last fighter standing celebrates in place before the victory screen.
  const [championId, setChampionId] = createSignal<number | null>(null);
  const [jumping, setJumping] = createSignal(false);

  let raf = 0;
  let last = now0;
  let finished = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

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

    // --- spawn a new item every 3-6s (up to the cap) ---
    if (!finished && now >= nextSpawn) {
      nextSpawn = now + SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      if (items.length < ITEM_MAX) {
        const def = ITEMS[Math.floor(Math.random() * ITEMS.length)];
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
          },
        ]);
      }
    }

    // --- update items: drift the moving ones, fade out sprung traps ---
    const expired: number[] = [];
    setItems(
      produce((list: Item[]) => {
        for (const p of list) {
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

    const consumed: number[] = []; // collected items to remove
    const sprung: number[] = []; // bear traps triggered this tick

    setEntities(
      produce((list: Entity[]) => {
        const alive = list.filter((e) => !e.ko);

        // --- movement & simple AI ---
        for (const e of alive) {
          if (now >= e.nextRetarget) {
            e.nextRetarget = now + 600 + Math.random() * 1200;

            // Nearest item within sight, if any (ignore traps — fighters don't
            // knowingly seek them out; a sprung trap is no longer a target).
            let pu: Item | null = null;
            let puD = ITEM_SIGHT;
            for (const p of items) {
              if (p.type === 'beartrap') continue;
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
          // find the closest living enemy we are touching & facing
          for (const o of alive) {
            if (o === e || o.hp <= 0) continue;
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

        // --- collect items / spring traps ---
        for (const e of alive) {
          for (const p of items) {
            if (consumed.includes(p.id) || sprung.includes(p.id)) continue;
            if (p.sprungAt) continue; // an already-sprung trap is inert
            if (Math.hypot(p.x - e.x, p.y - e.y) >= ITEM_PICKUP) continue;
            if (p.type === 'beartrap') {
              // Snaps shut on whoever stands in the middle: 20 damage (unless
              // shielded). The trap itself is updated in the items store below.
              sprung.push(p.id);
              if (now < e.shieldUntil) continue; // shield absorbs the bite
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

    // --- win check ---
    const living = entities.filter((e) => !e.ko);
    if (!finished && living.length <= 1) {
      finished = true;
      cancelAnimationFrame(raf);
      if (living.length === 1) {
        const champ = living[0];
        // Winner stops moving immediately, starts jumping after 1s, and we
        // hold the celebration for 4s before showing the victory screen.
        setChampionId(champ.id);
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
      <div
        class="arena"
        style={{
          'background-image': `url(${arenaImg})`,
          '--arena-w': `${ARENA.width}px`,
          '--arena-h': `${ARENA.height}px`,
          '--floor-top': `${ARENA.floor.top}px`,
          '--floor-right': `${ARENA.floor.right}px`,
          '--floor-bottom': `${ARENA.floor.bottom}px`,
          '--floor-left': `${ARENA.floor.left}px`,
        }}
      >
        <div class="arena-floor" />
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
                }${
                  e.movementType === 'wobble' || e.movementType === 'jump'
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
              <img
                class={`item${p.moves ? '' : ' item-static'}`}
                src={p.imageUrl}
                alt={p.type}
                draggable={false}
              />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
