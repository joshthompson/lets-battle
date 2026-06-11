import { For } from 'solid-js';

// Anime-style dramatic speed lines. Each streak gets a randomised position,
// width, speed and delay so the field reads as a chaotic downpour. The whole
// field tilts to `baseAngle` so the rain comes in on a diagonal — every streak
// in one intro shares that exact angle (no per-streak jitter), so the fighter's
// rain is uniform; vary baseAngle between intros to keep them feeling fresh.
export default function Streaks(props: { count?: number; baseAngle?: number }) {
  const count = props.count ?? 40;
  const base = props.baseAngle ?? 0;
  const streaks = Array.from({ length: count }, () => ({
    // widen past the edges so the tilted field still covers the screen
    left: -20 + Math.random() * 140,
    width: 2 + Math.random() * 6,
    duration: 0.5 + Math.random() * 0.9,
    delay: -Math.random() * 1.5,
    opacity: 0.2 + Math.random() * 0.6,
    angle: base,
  }));

  return (
    <div class="streaks">
      <For each={streaks}>
        {(s) => (
          <div
            class="streak"
            style={{
              left: `${s.left}%`,
              width: `${s.width}px`,
              opacity: `${s.opacity}`,
              '--a': `${s.angle}deg`,
              'animation-duration': `${s.duration}s`,
              'animation-delay': `${s.delay}s`,
            }}
          />
        )}
      </For>
    </div>
  );
}
