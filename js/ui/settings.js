// Panel "Ajustes" de la cabecera (un <details>): pausar animaciones (motion.js),
// ocultar o mostrar a Lapilli y probar paletas de colores. Las elecciones se
// guardan en localStorage. Lapilli se ve salvo que 'portafolio:mascota' valga
// 'oculto' (el script del <head> lo lee antes de pintar la página).

import { on, emit } from '../bus.js';
import { pick } from '../i18n.js';
import { PALETTES } from '../data/palettes.js';

const LAPILLI_KEY = 'portafolio:mascota';
const PALETTE_KEY = 'portafolio:paleta';
const LABELS = {
  hide: { es: 'Ocultar a Lapilli', en: 'Hide Lapilli' },
  show: { es: 'Mostrar a Lapilli', en: 'Show Lapilli' },
};

export function initSettings() {
  const panel = document.querySelector('.settings');
  const lapilliButton = panel.querySelector('.settings__lapilli');
  const list = panel.querySelector('.settings__palettes');
  const root = document.documentElement;

  // Lapilli: oculto quita la mascota, su globo, los hallazgos y las huellas (css/scene.css)
  let hidden = read(LAPILLI_KEY) === 'oculto';
  const showLapilliState = () => {
    root.classList.toggle('no-lapilli', hidden);
    lapilliButton.textContent = pick(hidden ? LABELS.show : LABELS.hide);
    lapilliButton.setAttribute('aria-pressed', String(hidden));
  };
  lapilliButton.addEventListener('click', () => {
    hidden = !hidden;
    write(LAPILLI_KEY, hidden ? 'oculto' : 'visible');
    showLapilliState();
    emit('lapilli:toggle', { hidden });
  });

  // Paletas: un botón por paleta, con sus colores en miniatura
  PALETTES.forEach((palette) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings__palette';
    button.dataset.palette = palette.id;
    const { midnight, rosewood, blush, sage, vanilla } = palette.colors;
    button.innerHTML = `<span class="settings__swatches" aria-hidden="true">${[midnight, rosewood, blush, sage, vanilla]
      .map((color) => `<span style="background: ${color}"></span>`).join('')}</span><span class="settings__palette-name"></span>`;
    button.addEventListener('click', () => {
      applyPalette(palette.id);
      write(PALETTE_KEY, palette.id);
    });
    list.append(button);
  });
  const nameButtons = () => list.querySelectorAll('.settings__palette-name').forEach((label, i) => {
    label.textContent = pick(PALETTES[i].name);
  });

  // Se cierra al hacer clic fuera o con Esc
  document.addEventListener('click', (event) => {
    if (panel.open && !panel.contains(event.target)) panel.open = false;
  });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      panel.open = false;
      panel.querySelector('summary').focus();
    }
  });

  on('lang:change', () => {
    showLapilliState();
    nameButtons();
  });
  showLapilliState();
  nameButtons();
  applyPalette(read(PALETTE_KEY) ?? PALETTES[0].id);
}

function applyPalette(id) {
  const palette = PALETTES.find((item) => item.id === id) ?? PALETTES[0];
  Object.entries(palette.colors).forEach(([name, value]) => {
    document.documentElement.style.setProperty(`--${name}`, value);
  });
  document.querySelectorAll('.settings__palette').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.palette === palette.id));
  });
  emit('palette:change', { id: palette.id });
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento (modo privado): la elección dura solo esta visita
  }
}
