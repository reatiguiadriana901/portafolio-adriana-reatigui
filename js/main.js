// Punto de entrada: arranca cada módulo en orden. Los que escuchan eventos se
// inician antes de que layout.js mida la página y emita el primer layout:change.

import { state } from './state.js';
import * as bus from './bus.js';
import * as loop from './loop.js';
import { initMotion } from './motion.js';
import { initI18n } from './i18n.js';
import { initIntro } from './intro.js';
import { initNav } from './ui/nav.js';
import { initReveal } from './ui/reveal.js';
import { initProjects } from './ui/projects.js';
import { initSettings } from './ui/settings.js';
import { paintIcons } from './fx/icons.js';
import { initParticles } from './fx/particles.js';
import { initLandmarks } from './fx/landmarks.js';
import { initCrossSection } from './fx/cross-section.js';
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

// El idioma va primero: los demás módulos ya leen state.lang al iniciar
start('i18n', () => initI18n(document.querySelector('.lang-toggle')));
start('motion', () => initMotion(document.querySelector('.motion-toggle')));
start('settings', initSettings);
start('intro', initIntro);
start('nav', initNav);
start('reveal', initReveal);
start('projects', initProjects);
start('icons', paintIcons);
start('particles', initParticles);
start('landmarks', initLandmarks);
start('cross-section', initCrossSection);
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
