import { t } from './i18n';
import LanguageToggle from './LanguageToggle';

export default function Menu(props: { onStart: () => void; onCredits: () => void }) {
  return (
    <div class="screen">
      <LanguageToggle />
      <h1 class="menu-logo">
        <span class="lets">{t('lets')}</span>
        {t('battle')}
      </h1>
      <button class="start-btn" onClick={props.onStart}>
        {t('start')}
      </button>
      <button class="menu-credits-btn" onClick={props.onCredits} type="button">
        {t('credits')}
      </button>
    </div>
  );
}
