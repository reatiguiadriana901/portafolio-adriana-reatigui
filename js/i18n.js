// Idiomas del sitio. El HTML viene en español (así se lee sin JavaScript) y este
// módulo cambia al inglés los textos marcados con:
//   data-i18n="clave"             el texto del elemento
//   data-i18n-html="clave"        el contenido con etiquetas (textos nuestros, de data/en.js)
//   data-i18n-attr="attr:clave"   atributos, separados por ";" (aria-label, alt…)
// Guarda la elección en localStorage; ?lang=en sirve para probar.

import { state } from './state.js';
import { emit } from './bus.js';
import { EN } from './data/en.js';

const STORAGE_KEY = 'portafolio:idioma';
const LANGS = ['es', 'en'];
const debug = new URLSearchParams(location.search).has('debug');
const spanish = new Map(); // textos originales en español de cada elemento, para poder volver

/** Devuelve el texto en el idioma actual. Acepta { es, en } o un texto solo. */
export function pick(text) {
  if (typeof text === 'string') return text;
  return text?.[state.lang] ?? text?.es ?? '';
}

export function initI18n(button) {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  const lang = LANGS.includes(fromUrl) ? fromUrl : readSaved() ?? 'es';
  button.addEventListener('click', () => {
    const next = state.lang === 'es' ? 'en' : 'es';
    save(next);
    apply(next, button);
  });
  apply(lang, button);
}

function apply(lang, button) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => swap(el, 'text', el.dataset.i18n, lang));
  document.querySelectorAll('[data-i18n-html]').forEach((el) => swap(el, 'html', el.dataset.i18nHtml, lang));
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((part) => part.trim());
      swap(el, attr, key, lang);
    });
  });
  // El botón muestra el idioma al que cambia
  button.textContent = lang === 'es' ? 'EN' : 'ES';
  button.setAttribute('aria-label', lang === 'es' ? 'Ver el sitio en inglés' : 'View the site in Spanish');
  emit('lang:change', { lang });
}

// La primera vez guarda el original en español; luego pone el texto del idioma pedido
function swap(el, what, key, lang) {
  if (!spanish.has(el)) spanish.set(el, {});
  const originals = spanish.get(el);
  if (!(what in originals)) originals[what] = read(el, what);
  const value = lang === 'en' ? EN[key] : originals[what];
  if (value === undefined || value === null) {
    if (debug && lang === 'en') console.warn('Falta la traducción:', key);
    return; // sin traducción: se queda en español
  }
  write(el, what, value);
}

function read(el, what) {
  if (what === 'text') return el.textContent;
  if (what === 'html') return el.innerHTML;
  return el.getAttribute(what);
}

function write(el, what, value) {
  if (what === 'text') el.textContent = value;
  else if (what === 'html') el.innerHTML = value;
  else el.setAttribute(what, value);
}

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function save(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Sin almacenamiento (modo privado): el idioma dura solo esta visita
  }
}
