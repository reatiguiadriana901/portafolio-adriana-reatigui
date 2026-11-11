// Bus de eventos mínimo: los módulos se avisan cosas sin importarse entre sí.
//
// Eventos del viaje:
//   layout:change   { mode, viewport, column, lanes, segments, docHeight }   (scene/layout.js)
//   route:ready     { startY, endY, length }                                 (scene/route.js)
//   segment:enter   { id, prevId, kind, index, dir }                         (scene/scroll.js)
//   scroll:jump     { from, to }                                             (scene/scroll.js)
//   volcano:erupt   { id, kind, x, y, clip }  coordenadas del documento      (fx/volcanoes.js)
//   impact          { x, y, clip }                                           (fx/volcanoes.js)
//   mascot:poke     { source: 'pointer' | 'keyboard' }                       (mascot/mascot.js)
//   motion:change   { on, reason: 'init' | 'system' | 'user' }               (motion.js)

const listeners = new Map();
const debug = new URLSearchParams(location.search).has('debug');

/** Escucha un evento. Devuelve una función para dejar de escucharlo. */
export function on(type, handler) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(handler);
  return () => listeners.get(type).delete(handler);
}

/** Avisa a todos los que escuchan `type`. */
export function emit(type, detail = {}) {
  if (debug) console.debug('[bus]', type, detail);
  listeners.get(type)?.forEach((handler) => handler(detail));
}
