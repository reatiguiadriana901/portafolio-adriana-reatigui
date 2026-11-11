// Decide qué hace y qué dice Lapilli según lo que pasa en la página.

import { on } from '../bus.js';
import { state } from '../state.js';
import { play, say, hideBubble } from './mascot.js';
import { SEGMENTS, LINES } from '../data/lines.js';
import { BUBBLE_GAP_MS, BUBBLE_MAX_SPEED } from '../config.js';

const spoken = new Set(); // segmentos y volcanes que ya comentó en esta visita
let lastChat = 0;
let factIndex = 0;

// Las burbujas automáticas no aparecen si el scroll va muy rápido o si acaba de hablar
function canChat() {
  return state.motionOn
    && state.mode !== 'static'
    && state.scroll.speed < BUBBLE_MAX_SPEED
    && performance.now() - lastChat > BUBBLE_GAP_MS;
}

function chat(text) {
  lastChat = performance.now();
  say(text);
}

export function initBrain() {
  on('segment:enter', ({ id }) => {
    if (id === 'contacto' && state.motionOn) play('wave');
    const line = SEGMENTS[id]?.line;
    if (!line || spoken.has(id) || !canChat()) return;
    spoken.add(id);
    chat(line);
  });

  on('volcano:erupt', ({ id, kind }) => {
    play('jump');
    if (spoken.has(id)) return;
    spoken.add(id);
    chat(LINES.eruption[kind]);
  });

  on('impact', () => {
    play('jump');
    chat(LINES.impact);
  });

  // Clic o teclado: ruge y cuenta un dato curioso (también en modo estático)
  on('mascot:poke', () => {
    if (state.motionOn) play('roar');
    say(LINES.facts[factIndex % LINES.facts.length], { announce: true });
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

  // Comenta el proyecto que estás mirando y voltea a verlo
  document.querySelectorAll('[data-rex]').forEach((card) => {
    const react = () => {
      if (!state.motionOn || state.mode === 'static') return;
      const rect = card.getBoundingClientRect();
      const cardX = rect.left + rect.width / 2 + (state.mode === 'route' ? scrollX : 0);
      play('look', { face: cardX < state.pose.x ? -1 : 1 });
      say(card.dataset.rex);
    };
    card.addEventListener('mouseenter', react);
    card.addEventListener('focusin', react);
  });
}
