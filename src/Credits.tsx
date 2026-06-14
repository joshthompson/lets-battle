import { For } from 'solid-js';
import { t, tx } from './i18n';
import { uniqueArtists } from './battlers';
import LanguageToggle from './LanguageToggle';

export default function Credits(props: { onDone: () => void }) {
  // Join names with commas, but separate the final two with "and": "A, B and C".
  const artistList = () => {
    const names = uniqueArtists().map(tx);
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} ${t('and')} ${names[names.length - 1]}`;
  };

  return (
    <div class="screen credits">
      <LanguageToggle />
      <h1 class="credits-title">{t('credits')}</h1>
      <div class="credits-body">
        <div class="credits-heading">{t('developedBy')}</div>
        <div class="credits-artists">{t('developedByName')}</div>
        <div class="credits-heading">{t('gameArtBy')} </div>
        <div class="credits-artists">{t('gameArtByName')}</div>
        <div class="credits-heading">{t('characterArtBy')}</div>
        <div class="credits-artists">{artistList()}</div>
      </div>
      <button class="start-btn" onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}
