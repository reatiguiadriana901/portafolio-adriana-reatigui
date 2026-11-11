// Cabecera: marca en el menú la sección que se está leyendo.

import { on } from '../bus.js';

export function initNav() {
  const links = [...document.querySelectorAll('.nav__link')];

  on('segment:enter', ({ id, kind }) => {
    if (kind !== 'section') return;
    links.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  });
}
