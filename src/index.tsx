/* @refresh reload */
import { render } from 'solid-js/web';
import 'solid-devtools';

import App from './App';
import { preloadImages } from './preload';

// Kick off image loading as early as possible, before the first render.
preloadImages();

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <App />, root!);
