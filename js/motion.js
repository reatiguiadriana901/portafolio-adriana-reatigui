// Movimiento: respeta "reducir movimiento" del sistema y el botón "Pausar animaciones".
// Con el movimiento apagado el sitio pasa a modo estático: Lapilli se queda quieto
// en el inicio y sigue contando datos si le hacen clic.

import { state } from './state.js';
import { emit } from './bus.js';

const STORAGE_KEY = 'portafolio:animaciones';

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function savePreference(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Sin almacenamiento (modo privado): la pausa dura solo esta visita
  }
}

export function initMotion(button) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  // ?motion=off sirve para probar el modo estático sin tocar el sistema
  let pausedByUser = new URLSearchParams(location.search).get('motion') === 'off'
    || readPreference() === 'off';

  const apply = (reason) => {
    const on = !reduce.matches && !pausedByUser;
    const changed = on !== state.motionOn;
    state.motionOn = on;
    document.documentElement.dataset.motion = on ? 'on' : 'off';

    if (reduce.matches) {
      button.disabled = true;
      button.textContent = 'Animaciones reducidas por tu sistema';
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.disabled = false;
      button.textContent = pausedByUser ? 'Reanudar animaciones' : 'Pausar animaciones';
      button.setAttribute('aria-pressed', String(pausedByUser));
    }

    if (changed || reason === 'init') emit('motion:change', { on, reason });
  };

  button.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    savePreference(pausedByUser ? 'off' : 'on');
    apply('user');
  });
  reduce.addEventListener('change', () => apply('system'));
  apply('init');
}

export function isMotionOn() {
  return state.motionOn;
}
