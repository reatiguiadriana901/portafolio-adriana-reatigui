// Constantes del viaje. Cambiarlas aquí es más fácil que buscarlas en cada módulo.

export const MASCOT_NAME = 'Lapilli';

// Lapilli se ubica en la ruta a esta fracción del alto de la ventana
export const ANCHOR = 0.6;

// El modo ruta solo se activa con ventanas anchas y carriles laterales suficientes
export const ROUTE_MIN_WIDTH = 1200;
export const LANE_MIN = 192;

// Tamaño del dibujo de Lapilli (en píxeles del sprite) y su escala en cada modo
export const SPRITE_W = 20;
export const SPRITE_H = 16;
export const SPRITE_SCALE = { route: 6, stage: 4, static: 6 };

// Comportamiento de la mascota
export const IDLE_TAP_MS = 8000; // empieza a golpear la roca con la piqueta
export const IDLE_SLEEP_MS = 30000; // se duerme
export const BUBBLE_MS = 3200; // cuánto dura una burbuja
export const BUBBLE_GAP_MS = 2500; // mínimo entre dos burbujas automáticas

// Velocidades de scroll (px/s) desde las que se suprimen efectos
export const ERUPTION_MAX_SPEED = 2500;
export const BUBBLE_MAX_SPEED = 1500;

// Volcanes y partículas
export const ERUPTION_COOLDOWN_MS = 6000;
export const PARTICLES_MAX = { route: 160, stage: 80 };
