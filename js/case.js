// Punto de entrada de las páginas de cada proyecto (proyectos/*.html). Usa las
// mismas elecciones que el portafolio, guardadas en localStorage: idioma, paleta
// de colores y animaciones en pausa. Los textos vienen en los dos idiomas y aquí
// solo se cambia el lang de <html> (css/case.css esconde el otro idioma).

import { state } from './state.js';
import { emit } from './bus.js';
import { PALETTES } from './data/palettes.js';
import { initCrossSection } from './fx/cross-section.js';

const root = document.documentElement;
root.classList.add('js');

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
    // Sin almacenamiento: la elección dura solo esta visita
  }
}

// Paleta elegida en el portafolio
const palette = PALETTES.find((item) => item.id === read('portafolio:paleta'));
if (palette) {
  Object.entries(palette.colors).forEach(([name, value]) => root.style.setProperty(`--${name}`, value));
}

// Animaciones: apagadas con "reducir movimiento" del sistema o si se pausaron en el portafolio
state.motionOn = !matchMedia('(prefers-reduced-motion: reduce)').matches
  && read('portafolio:animaciones') !== 'off';
root.dataset.motion = state.motionOn ? 'on' : 'off';

// Idioma: ?lang=en sirve para probar
const button = document.querySelector('.lang-toggle');
const fromUrl = new URLSearchParams(location.search).get('lang');
let lang = ['es', 'en'].includes(fromUrl) ? fromUrl : read('portafolio:idioma') === 'en' ? 'en' : 'es';

function applyLang() {
  root.lang = lang;
  document.title = root.dataset[lang === 'en' ? 'titleEn' : 'titleEs'] || document.title;
  // Los textos alternativos de las imágenes no se pueden esconder con CSS
  document.querySelectorAll('img[data-alt-en]').forEach((img) => {
    img.alt = lang === 'en' ? img.dataset.altEn : img.dataset.altEs;
  });
  button.textContent = lang === 'es' ? 'EN' : 'ES';
  button.setAttribute('aria-label', lang === 'es' ? 'Ver la página en inglés' : 'View the page in Spanish');
}

button.addEventListener('click', () => {
  lang = lang === 'es' ? 'en' : 'es';
  write('portafolio:idioma', lang);
  applyLang();
});
applyLang();

// Visor de los workflows de n8n, solo en las páginas que lo tienen
const viewer = document.querySelector('[data-n8n]');
if (viewer) {
  import('./n8n-viewer.js')
    .then((module) => module.mount(viewer))
    .catch((error) => console.error('No se pudo cargar el visor de workflows:', error));
}

// Visor del SQL real, en las páginas de bases de datos
const sqlViewer = document.querySelector('[data-sql]');
if (sqlViewer) {
  import('./sql-viewer.js')
    .then((module) => module.mount(sqlViewer))
    .catch((error) => console.error('No se pudo cargar el visor de SQL:', error));
}

// Fondo animado con el corte geológico, igual que en el portafolio
initCrossSection();
const resize = () => emit('layout:change', {});
resize();
addEventListener('resize', resize);
