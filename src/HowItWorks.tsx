import { t } from './i18n';
import LanguageToggle from './LanguageToggle';

// A short explainer of what the game is and the player's only point of control.
export default function HowItWorks(props: { onDone: () => void }) {
  return (
    <div class="screen credits how-it-works">
      <LanguageToggle />
      <h1 class="credits-title">{t('howItWorks')}</h1>
      <div class="credits-body how-it-works-body">
        <p>{t('howItWorks1')}</p>
        <p>{t('howItWorks2')}</p>
        <p>{t('howItWorks3')}</p>
      </div>
      <button class="start-btn" onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}
