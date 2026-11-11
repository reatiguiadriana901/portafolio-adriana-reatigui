// Punto de entrada: arranca cada módulo en orden. Los que escuchan eventos se
// inician antes de que layout.js mida la página y emita el primer layout:change.

import { state } from './state.js';
import * as bus from './bus.js';
import * as loop from './loop.js';
import { initMotion } from './motion.js';
import { initNav } from './ui/nav.js';
import { initReveal } from './ui/reveal.js';
import { paintIcons } from './fx/icons.js';
import { initParticles } from './fx/particles.js';
import { initVolcanoes } from './fx/volcanoes.js';
import { initMascot } from './mascot/mascot.js';
import { initBrain } from './mascot/brain.js';
import { initRoute } from './scene/route.js';
import { initStage } from './scene/stage.js';
import { initScroll } from './scene/scroll.js';
import { initLayout } from './scene/layout.js';

// Si un módulo falla, el resto del sitio sigue funcionando
function start(name, init) {
  try {
    init();
  } catch (error) {
    console.error(`No se pudo iniciar ${name}:`, error);
  }
}

document.documentElement.classList.add('js');

start('motion', () => initMotion(document.querySelector('.motion-toggle')));
start('nav', initNav);
start('reveal', initReveal);
start('icons', paintIcons);
start('particles', initParticles);
start('volcanoes', initVolcanoes);
start('mascot', initMascot);
start('brain', initBrain);
start('route', initRoute);
start('stage', initStage);
start('scroll', initScroll);
start('layout', initLayout);

// ?debug deja el estado a mano en la consola para revisar el viaje
if (new URLSearchParams(location.search).has('debug')) {
  window.__pf = { state, bus, loop };
}
