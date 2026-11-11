// Partículas de las erupciones: cuadritos de lava y ceniza en un canvas fijo.
// Cada partícula se recorta a la escena de su banda, así nunca tapan texto.

import { state } from '../state.js';
import { on } from '../bus.js';
import { addTask, wake } from '../loop.js';
import { PARTICLES_MAX } from '../config.js';

const COUNTS = { mono: 36, poly: 60, fissure: 48, impact: 50 };
const GRAVITY = 900; // px/s²

let canvas;
let ctx;
let particles = [];

export function initParticles() {
  canvas = document.querySelector('#fx-canvas');
  ctx = canvas.getContext('2d');
  canvas.hidden = true;
  on('layout:change', resize);
  on('volcano:erupt', burst);
  on('impact', (detail) => burst({ ...detail, kind: 'impact' }));
  on('motion:change', ({ on: motionOn }) => {
    if (!motionOn) particles = [];
  });
  addTask('particles', update, 30);
}

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** Lanza una ráfaga en (x, y), coordenadas del documento, recortada a `clip`. */
export function burst({ x, y, w = 0, kind, clip }) {
  if (!state.motionOn || state.mode === 'static') return;
  const pixel = (state.layout?.spriteW ?? 80) / 20;
  const count = COUNTS[kind] ?? 40;
  for (let i = 0; i < count; i++) {
    // En las fisuras la lava sale a lo largo de la grieta, no de un solo punto
    const spread = kind === 'fissure' ? (Math.random() - 0.5) * w * 0.8 : 0;
    particles.push({
      x: x + spread,
      y,
      vx: (Math.random() - 0.5) * (kind === 'impact' ? 520 : 260),
      vy: -(220 + Math.random() * (kind === 'poly' ? 520 : 360)),
      life: 0,
      ttl: 0.8 + Math.random() * 0.8,
      size: pixel * (2 + Math.floor(Math.random() * 3)),
      ash: kind === 'impact' || Math.random() < 0.25,
      clip,
    });
  }
  // Si hay demasiadas, se descartan las más viejas
  const max = PARTICLES_MAX[state.mode] ?? 80;
  if (particles.length > max) particles.splice(0, particles.length - max);
  canvas.hidden = false;
  wake('particles');
}

function update(dt) {
  if (!particles.length) return Infinity;
  const seconds = dt / 1000;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles = particles.filter((particle) => (particle.life += seconds) < particle.ttl);

  for (const particle of particles) {
    particle.vy += GRAVITY * seconds;
    particle.x += particle.vx * seconds;
    particle.y += particle.vy * seconds;

    const { clip } = particle;
    ctx.save();
    ctx.beginPath();
    ctx.rect(clip.left - scrollX, clip.top - scrollY, clip.right - clip.left, clip.bottom - clip.top);
    ctx.clip();
    ctx.fillStyle = particle.ash ? '#55606C' : particle.life / particle.ttl < 0.5 ? '#EE9AA8' : '#9A4F58';
    ctx.fillRect(Math.round(particle.x - scrollX), Math.round(particle.y - scrollY), particle.size, particle.size);
    ctx.restore();
  }

  if (!particles.length) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    canvas.hidden = true;
    return Infinity;
  }
  return 0;
}
