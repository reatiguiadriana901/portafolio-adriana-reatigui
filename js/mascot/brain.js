// Decide qué hace y qué dice Lapilli según lo que pasa en la página: su entrada
// al abrirla, secciones, hallazgos del recorrido, clics y proyectos.

import { on } from '../bus.js';
import { state } from '../state.js';
import { play, say, hideBubble, hatch } from './mascot.js';
import { SEGMENTS, LINES } from '../data/lines.js';
import { pick } from '../i18n.js';
import { isIntroPlaying } from '../intro.js';
import { BUBBLE_GAP_MS, BUBBLE_MAX_SPEED } from '../config.js';

const INTRO_MS = 5200; // cuánto dura la burbuja de la presentación

const spoken = new Set(); // segmentos que ya comentó en esta visita
let lastChat = 0;
let factIndex = 0;

// Lapilli se puede ocultar en Ajustes (css/scene.css): oculto no habla
const isHidden = () => document.documentElement.classList.contains('no-lapilli');

// Las burbujas automáticas no aparecen si Lapilli está oculto, si el scroll va
// muy rápido o si acaba de hablar
function canChat() {
  return !isHidden()
    && state.motionOn
    && state.mode !== 'static'
    && state.scroll.speed < BUBBLE_MAX_SPEED
    && performance.now() - lastChat > BUBBLE_GAP_MS;
}

function chat(text, options) {
  lastChat = performance.now();
  say(pick(text), options);
}

// Comenta el proyecto que estás mirando y voltea a verlo
function lookAt(card) {
  if (!state.motionOn || state.mode === 'static') return;
  const rect = card.getBoundingClientRect();
  const cardX = rect.left + rect.width / 2 + (state.mode === 'route' ? scrollX : 0);
  play('look', { face: cardX < state.pose.x ? -1 : 1 });
  say(state.lang === 'en' && card.dataset.rexEn ? card.dataset.rexEn : card.dataset.rex);
}

export function initBrain() {
  on('segment:enter', ({ id, prevId }) => {
    if (id === 'contacto' && state.motionOn) play('wave');
    if (id === 'inicio' && prevId === null) {
      // Con la presentación a pantalla completa ya se presentó: al final solo saluda
      if (isIntroPlaying()) {
        spoken.add(id);
        return;
      }
      // Si ya la vio en esta sesión, sale de un huevo pequeño en el inicio
      if (!isHidden() && state.motionOn && state.mode !== 'static' && scrollY < 80) {
        spoken.add(id);
        hatch(() => chat(LINES.intro, { ms: INTRO_MS }));
        return;
      }
    }
    const line = SEGMENTS[id]?.line;
    if (!line || spoken.has(id) || !canChat()) return;
    spoken.add(id);
    chat(line);
  });

  // Hallazgos del recorrido: los mira y cuenta algo de ellos
  on('landmark:found', ({ x, line }) => {
    if (!canChat()) return;
    play('look', { face: x < state.pose.x ? -1 : 1 });
    chat(line);
  });

  // Clic o teclado: ruge y cuenta un dato curioso (también en modo estático)
  on('mascot:poke', () => {
    if (state.motionOn) play('roar');
    say(pick(LINES.facts[factIndex % LINES.facts.length]), { announce: true });
    factIndex++;
  });

  on('mascot:state', ({ name, prev }) => {
    if (!canChat()) return;
    if (name === 'tap') chat(LINES.idleTap);
    else if (name === 'sleep') chat(LINES.sleep);
    else if (prev === 'sleep' && name === 'walk') chat(LINES.wake);
  });

  on('motion:change', ({ on: motionOn }) => {
    if (!motionOn) hideBubble();
  });

  // Una burbuja en el idioma anterior se esconde al cambiar de idioma
  on('lang:change', () => hideBubble());

  // Al terminar la presentación, Lapilli ya está en su sitio y saluda
  on('intro:done', () => {
    if (state.motionOn) play('wave');
  });

  // Recién activado desde Ajustes: saluda y se presenta
  on('lapilli:toggle', ({ hidden }) => {
    if (hidden || !state.motionOn || state.mode === 'static') return;
    play('wave');
    chat(LINES.intro);
  });

  // Proyecto abierto en la caja de núcleos (ui/projects.js)
  on('project:show', ({ card }) => lookAt(card));

  document.querySelectorAll('[data-rex]').forEach((card) => {
    card.addEventListener('mouseenter', () => lookAt(card));
    card.addEventListener('focusin', () => lookAt(card));
  });
}
