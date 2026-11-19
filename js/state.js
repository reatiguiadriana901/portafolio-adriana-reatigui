// Estado compartido del viaje. Todos los módulos lo leen, pero cada campo
// lo escribe un solo módulo (su "dueño"), así es fácil saber quién lo cambia.

export const state = {
  // 'route' (escritorio), 'stage' (móvil y tableta) o 'static' (animaciones en pausa)
  mode: 'static', // dueño: scene/layout.js
  motionOn: true, // dueño: motion.js
  lang: 'es', // 'es' o 'en', dueño: i18n.js
  viewport: { w: 0, h: 0, dpr: 1 }, // dueño: scene/layout.js
  layout: null, // última medición de la página (ver layout:change), dueño: scene/layout.js

  // anchor = scrollY + ANCHOR * alto de la ventana; speed en px/s; dir: 1 baja, -1 sube
  scroll: { y: 0, anchor: 0, dir: 0, speed: 0 }, // dueño: scene/scroll.js

  // Segmento (sección o banda) donde está el ancla y cuánto lleva recorrido (0 a 1)
  segment: { id: 'inicio', kind: 'section', index: 0, progress: 0 }, // dueño: scene/scroll.js

  // Dónde está Lapilli. En modo ruta, coordenadas del documento (los pies sobre la ruta);
  // en modo escenario, coordenadas de la ventana dentro de la franja inferior.
  pose: { x: 0, y: 0, facing: 1, speed: 0, moving: false }, // dueño: scene/scroll.js o scene/stage.js
};
