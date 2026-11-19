// Mide la página y decide el modo del viaje:
//   'route'  escritorio: Lapilli camina por los carriles a los lados de la columna de texto
//   'stage'  celular y tableta: camina por una franja fija en la parte de abajo
//   'static' animaciones en pausa: Lapilli se queda quieto en el inicio
// Las alturas van en coordenadas del documento (getBoundingClientRect + scrollY).
// No hay scroll horizontal, así que la x del documento es la misma de la ventana.

import { state } from '../state.js';
import { on, emit } from '../bus.js';
import { ROUTE_MIN_WIDTH, LANE_MIN, SPRITE_W, SPRITE_H, SPRITE_SCALE } from '../config.js';

const DEBOUNCE_MS = 120;
const EDGE_GAP = 16; // espacio entre el borde de la ventana y el carril
const COLUMN_GAP = 24; // espacio entre el carril y la columna de texto

let probe = null;
let timerId = 0;
let lastSummary = '';

export function initLayout() {
  // Sonda fija de 100svh: su alto no cambia cuando aparece o se esconde la barra de iOS
  probe = document.createElement('div');
  probe.className = 'viewport-probe';
  probe.setAttribute('aria-hidden', 'true');
  document.body.append(probe);

  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleMeasure).observe(document.querySelector('main'));
  }
  window.addEventListener('resize', scheduleMeasure);
  window.addEventListener('load', scheduleMeasure);
  document.fonts?.ready.then(scheduleMeasure);
  watchPixelRatio();
  on('motion:change', scheduleMeasure);

  measure();
}

export function getLayout() {
  return state.layout;
}

// Muchos avisos seguidos (por ejemplo, al arrastrar la ventana) dan una sola medición
function scheduleMeasure() {
  clearTimeout(timerId);
  timerId = setTimeout(measure, DEBOUNCE_MS);
}

// Avisa cuando cambia la densidad de píxeles (zoom o cambio de pantalla).
// Cada consulta sirve para una sola densidad, por eso se crea otra después del cambio.
function watchPixelRatio() {
  const query = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  query.addEventListener('change', () => {
    scheduleMeasure();
    watchPixelRatio();
  }, { once: true });
}

function measure() {
  const viewport = {
    w: document.documentElement.clientWidth, // ancho sin la barra de scroll
    h: probe.getBoundingClientRect().height || window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
  const column = measureColumn(viewport.w);
  const lanes = {
    left: makeLane(EDGE_GAP, column.left - COLUMN_GAP),
    right: makeLane(column.right + COLUMN_GAP, viewport.w - EDGE_GAP),
  };
  const laneWidth = Math.max(0, Math.min(lanes.left.x1 - lanes.left.x0, lanes.right.x1 - lanes.right.x0));
  const mode = pickMode(viewport.w, laneWidth);

  // Un píxel del sprite mide un número entero de píxeles físicos: así se ve nítido
  const px = Math.max(1, Math.round(SPRITE_SCALE[mode] * viewport.dpr)) / viewport.dpr;
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.style.setProperty('--px', `${px}px`);
  root.style.setProperty('--lane-w', `${laneWidth}px`);

  // Las alturas se miden después de aplicar el modo: --px y el relleno del escenario las cambian
  const layout = {
    mode,
    viewport,
    column,
    lanes,
    segments: measureSegments(),
    // Alto del body (no scrollHeight): así la capa .scene no infla la medida
    docHeight: document.body.getBoundingClientRect().bottom + window.scrollY,
    spriteW: SPRITE_W * px,
    spriteH: SPRITE_H * px,
  };

  // Si nada cambió desde la última medición, no hace falta avisar a nadie
  const summary = summarize(layout);
  if (summary === lastSummary) return;
  lastSummary = summary;

  state.mode = mode;
  state.viewport = viewport;
  state.layout = layout;
  emit('layout:change', layout);
}

// La columna de texto va del borde izquierdo al derecho de los .section__inner
function measureColumn(viewportWidth) {
  let left = viewportWidth;
  let right = 0;
  document.querySelectorAll('.section__inner').forEach((inner) => {
    const rect = inner.getBoundingClientRect();
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
  });
  if (right <= left) return { left: 0, right: viewportWidth };
  return { left, right };
}

function makeLane(x0, x1) {
  return { x0, x1, center: (x0 + x1) / 2 };
}

function pickMode(width, laneWidth) {
  if (!state.motionOn) return 'static';
  if (width >= ROUTE_MIN_WIDTH && laneWidth >= LANE_MIN) return 'route';
  return 'stage';
}

// Secciones y bandas en el orden de la página
function measureSegments() {
  const scrollY = window.scrollY;
  const elements = document.querySelectorAll('.section[data-segment], .band[data-segment]');
  return [...elements].map((el, index) => {
    const rect = el.getBoundingClientRect();
    const segment = {
      id: el.dataset.segment,
      kind: el.dataset.kind,
      index,
      top: rect.top + scrollY,
      bottom: rect.bottom + scrollY,
      el,
    };
    // En las bandas, la escena (sin texto) es el único lugar donde la ruta cruza de lado
    const scene = el.querySelector('.band__scene');
    if (segment.kind === 'band' && scene) {
      const sceneRect = scene.getBoundingClientRect();
      segment.sceneTop = sceneRect.top + scrollY;
      segment.sceneBottom = sceneRect.bottom + scrollY;
    }
    return segment;
  });
}

// Resumen en texto de lo medido, redondeado a píxeles enteros, para comparar mediciones
function summarize(layout) {
  const numbers = [layout.viewport.w, layout.viewport.h, layout.column.left, layout.column.right, layout.docHeight];
  layout.segments.forEach((segment) => {
    numbers.push(segment.top, segment.bottom, segment.sceneTop ?? 0, segment.sceneBottom ?? 0);
  });
  const rounded = numbers.map((value) => Math.round(value));
  return `${layout.mode} ${layout.viewport.dpr} ${rounded.join(' ')}`;
}
