// Warm the browser cache with every image asset (arena, battlers, items) at
// startup, so nothing pops in when the intro or battle first renders. Uses an
// eager glob so any newly added asset is picked up automatically.
const modules = import.meta.glob<{ default: string }>(
  './assets/**/*.{png,jpg,jpeg,webp,gif,svg}',
  { eager: true },
);

export function preloadImages(): void {
  for (const mod of Object.values(modules)) {
    const img = new Image();
    img.src = mod.default;
  }
}
