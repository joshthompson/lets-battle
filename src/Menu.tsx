import { createSignal } from 'solid-js';
import { t } from './i18n';
import { generateBattlers, type Battler } from './battlers';
import BattlerSprite from './BattlerSprite';
import LanguageToggle from './LanguageToggle';

// The roster shuffled once into a fixed order, then cycled through forever in
// that same order (no reshuffle), so the decor sequence is stable.
const ORDER: Battler[] = generateBattlers();
let cursor = 0;
const nextBattler = (): Battler => {
  const b = ORDER[cursor % ORDER.length];
  cursor++;
  return b;
};

export default function Menu(props: {
  onStart: () => void;
  onGallery: () => void;
  onHowItWorks: () => void;
  onCredits: () => void;
}) {
  // Two random battlers decorate the empty gutters either side of the menu,
  // pulsing in and out (the right one mirrored and offset by half the cycle).
  // Each fade-out boundary (animationiteration, fired while invisible) swaps in
  // a fresh battler.
  const [decorLeft, setDecorLeft] = createSignal(nextBattler());
  const [decorRight, setDecorRight] = createSignal(nextBattler());

  return (
    <div class="screen menu">
      <div
        class="menu-decor menu-decor-left"
        onAnimationIteration={() => setDecorLeft(nextBattler())}
      >
        <BattlerSprite battler={decorLeft()} class="menu-decor-sprite" width={320} height={460} />
      </div>
      <div
        class="menu-decor menu-decor-right"
        onAnimationIteration={() => setDecorRight(nextBattler())}
      >
        <BattlerSprite battler={decorRight()} class="menu-decor-sprite" width={320} height={460} />
      </div>
      <LanguageToggle />
      <h1 class="menu-logo">
        <span class="lets">{t('lets')}</span>
        {t('battle')}
      </h1>
      <button class="start-btn" onClick={props.onStart}>
        {t('start')}
      </button>
      <button class="menu-gallery-btn" onClick={props.onGallery} type="button">
        {t('gallery')}
      </button>
      <button class="menu-howitworks-btn" onClick={props.onHowItWorks} type="button">
        {t('howItWorks')}
      </button>
      <button class="menu-credits-btn" onClick={props.onCredits} type="button">
        {t('credits')}
      </button>
    </div>
  );
}
