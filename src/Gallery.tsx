import { For } from 'solid-js';
import { t, tx } from './i18n';
import { battlersByArtist } from './battlers';
import BattlerSprite from './BattlerSprite';
import LanguageToggle from './LanguageToggle';
import { backgroundGradient } from './colors';

// Every character on display, grouped by the artist who drew them. The width/
// height set the logical canvas (window size ÷ the shared stage scale) so the
// gallery fills the window at the game's normal scale rather than the fixed
// 1200x800 box.
export default function Gallery(props: { onDone: () => void; width: number; height: number }) {
  const groups = () => battlersByArtist().sort((a, b) => a.battlers.length - b.battlers.length);

  return (
    <div class="screen gallery" style={{ width: `${props.width}px`, height: `${props.height}px` }}>
      <LanguageToggle />
      <h1 class="gallery-title">{t('gallery')}</h1>
      <div class="gallery-scroll">
        <For each={groups()}>
          {(group) => (
            <section class="gallery-group">
              <h2 class="gallery-artist">{tx(group.artist)}</h2>
              <div class="gallery-grid">
                <For each={group.battlers}>
                  {(b) => (
                    <div class="gallery-card-outer">
                      <div class="gallery-card" style={{ background: backgroundGradient(b.color) }}>
                        <BattlerSprite battler={b} class="gallery-sprite" width={120} height={150} />
                        <span class="gallery-name">{tx(b.name)}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </section>
          )}
        </For>
      </div>
      <button class="start-btn gallery-back" onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}
