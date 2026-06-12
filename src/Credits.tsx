import { For } from 'solid-js';
import { t, tx } from './i18n';
import { uniqueArtists } from './battlers';
import LanguageToggle from './LanguageToggle';

export default function Credits(props: { onDone: () => void }) {
  return (
    <div class="screen credits">
      <LanguageToggle />
      <h1 class="credits-title">{t('credits')}</h1>
      <div class="credits-body">
        <p>{t('developedBy')}</p>
        <p>{t('gameArtBy')} </p>
        <p class="credits-heading">{t('characterArtBy')}</p>
        <ul class="credits-artists">
          <For each={uniqueArtists()}>{(artist) => <li>{tx(artist)}</li>}</For>
        </ul>
      </div>
      <button class="start-btn" onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}
