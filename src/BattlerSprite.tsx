import { Show } from 'solid-js';
import type { JSX } from 'solid-js';
import type { Battler } from './battlers';
import { tx } from './i18n';

const DAMAGE_COLOR = '#ff2424';
const HEAL_COLOR = '#2ee65a';

// Shared visual for a battler. With artwork it renders just the (transparent)
// image; without artwork it falls back to the coloured block + border. Two
// tint overlays sit on top — red for damage (`flash`) and green for healing
// (`heal`) — their opacity driven by the props.
//
// For image fighters each tint is a solid-colour div masked by the artwork's
// alpha, so only the character lights up (not the transparent box). A plain
// `filter` recolour doesn't work here: brightness(0) blacks the image out and
// nothing downstream can tint pure black back to a colour.
export default function BattlerSprite(props: {
  battler: Battler;
  width?: number;
  height?: number;
  class?: string;
  style?: JSX.CSSProperties;
  flash?: number;
  heal?: number;
}) {
  const hasImage = () => !!props.battler.imageUrl;

  return (
    <div
      class={`battler-sprite${hasImage() ? ' has-image' : ''}${
        props.class ? ` ${props.class}` : ''
      }`}
      style={{
        width: props.width != null ? `${props.width}px` : '100%',
        height: props.height != null ? `${props.height}px` : '100%',
        // Coloured background only when there's no artwork.
        ...(hasImage() ? {} : { background: props.battler.color }),
        ...props.style,
      }}
    >
      <Show
        when={props.battler.imageUrl}
        fallback={
          <>
            <div class="attack-flash flash-solid" style={{ opacity: props.flash ?? 0, background: DAMAGE_COLOR }} />
            <div class="attack-flash flash-solid" style={{ opacity: props.heal ?? 0, background: HEAL_COLOR }} />
          </>
        }
      >
        <img src={props.battler.imageUrl} alt={tx(props.battler.name)} draggable={false} />
        <div
          class="attack-flash flash-mask"
          style={{
            opacity: props.flash ?? 0,
            background: DAMAGE_COLOR,
            'mask-image': `url(${props.battler.imageUrl})`,
            '-webkit-mask-image': `url(${props.battler.imageUrl})`,
          }}
        />
        <div
          class="attack-flash flash-mask"
          style={{
            opacity: props.heal ?? 0,
            background: HEAL_COLOR,
            'mask-image': `url(${props.battler.imageUrl})`,
            '-webkit-mask-image': `url(${props.battler.imageUrl})`,
          }}
        />
      </Show>
    </div>
  );
}
