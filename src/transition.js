import { flushSync } from 'react-dom';

/**
 * Run a state update inside a View Transition. `kind` picks the animation in index.css:
 * 'page' cross-fades between screens, 'theme' wipes the new theme over the old one.
 * Falls back to an instant update when unsupported or when reduced motion is on.
 */
export function viewTransition(update, kind = 'page') {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduceMotion) {
    update();
    return;
  }
  root.dataset.vt = kind;
  const transition = document.startViewTransition(() => flushSync(update));
  transition.finished.finally(() => {
    if (root.dataset.vt === kind) delete root.dataset.vt;
  });
}
