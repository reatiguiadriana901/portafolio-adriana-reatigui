// Fotogramas de Lapilli escritos como texto: cada carácter es un píxel y la
// paleta dice su color ('.' es transparente). Mira a la derecha; para que mire
// a la izquierda, mascot.js voltea el canvas con CSS.

export const FRAME_W = 20;
export const FRAME_H = 16;

export const PALETTE = {
  g: '#7A9A3A', // cuerpo verde olivino
  s: '#556B2A', // sombra
  b: '#C9D98A', // vientre
  o: '#1F1A17', // ojo (y el interior de la boca al rugir)
  m: '#9CA3AF', // cabeza de la piqueta
  w: '#A67C52', // mango de la piqueta (y la roca que analiza)
  c: '#F3E6D3', // dientes
};

const EMPTY = '....................';

// ----- Partes que comparten varios fotogramas (cabeza: filas 0-7, cuerpo: 8-12, piernas: 13-15)

const HEAD = [
  EMPTY,
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '..........gggggg....',
  '......gggggggbb.....',
];

// Estira el cuello y mira hacia adelante
const HEAD_LOOK = [
  '............ggggg...',
  '...........ggggggg..',
  '...........gggggogg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '..........gggggg....',
  '..........gggggg....',
  '......gggggggbb.....',
];

const HEAD_ROAR = [
  EMPTY,
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggcococ.',
  '...........gggooooo.',
  '......ggggggggcococ.',
];

const HEAD_ROAR_WIDE = [
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggcococ.',
  '...........gggooooo.',
  '...........gggooooo.',
  '......ggggggggcococ.',
];

// Cuerpo con la cola, el vientre y el bracito que sostiene la piqueta
const BODY = [
  '....ggggggggbbb.mmmm',
  '..ggggggggggbbbggw..',
  'gggggggggggbbbb..w..',
  'sssssgggggggbbb..w..',
  '.....ssggggggbb.....',
];

// La pierna de atrás va en sombra (s) y la de adelante en verde (g)
const LEGS = [
  '.....sss...ggg......',
  '......ss...ggg......',
  '.....sss...gggg.....',
];

const LEGS_BENT = [
  '.....sss...ggg......',
  '.....sss...gggg.....',
];

const STEP_1 = [
  '....sss.....ggg.....',
  '...sss.......ggg....',
  '..ssss.......gggg...',
];
const STEP_2 = [
  '......sss..ggg......',
  '......ss...gggg.....',
  '.....sss............',
];
const STEP_3 = [
  '.....ggg.....sss....',
  '....ggg.......sss...',
  '...gggg.......ssss..',
];
const STEP_4 = [
  '......sss..ggg......',
  '...........ggg......',
  '...........gggg.....',
];

// ----- Fotogramas completos

const TAP_UP = [
  EMPTY,
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '..........gggggg....',
  '......gggggggbb.mmmm',
  '....ggggggggbbbgw...',
  '..ggggggggggbbbg....',
  'gggggggggggbbbb.....',
  'sssssgggggggbbb.....',
  '.....ssggggggbb.....',
  '.....sss...ggg......',
  '......ss...ggg..www.',
  '.....sss...gggg.wwww',
];

const TAP_DOWN = [
  EMPTY,
  EMPTY,
  '............ggggg...',
  '...........ggggggg..',
  '...........gggggogg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '......gggggggggg....',
  '....ggggggggbbb.....',
  '..ggggggggggbbbg....',
  'gggggggggggbbbbg....',
  'sssssgggggggbbb.w...',
  '.....ssggggggbb..w..',
  '.....sss...ggg..mmm.',
  '......ss...ggg..www.',
  '.....sss...gggg.wwww',
];

// Acostado con los ojos cerrados y la piqueta en el suelo
const SLEEP_1 = [
  EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
  '...........ggggg....',
  '.....ggggggggssgggg.',
  '...ggggggggggggggggg',
  '..ggggggggggggggc.c.',
  'gggggggggggggggg....',
  'ggggggggbbbbbbgg.mmm',
  'sssssssssbbbbbsswww.',
];
// Al respirar, la espalda sube un píxel
const SLEEP_2 = [
  EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
  '......gggggggggg....',
  '....gggggggggssgggg.',
  '..gggggggggggggggggg',
  '.gggggggggggggggc.c.',
  'gggggggggggggggg....',
  'ggggggggbbbbbbgg.mmm',
  'sssssssssbbbbbsswww.',
];

const JUMP = [
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '..........gggggg....',
  'gg....gggggggbb.....',
  'ggggggggggggbbb.mmmm',
  '.gggggggggggbbbggw..',
  '..ssggggggggbbb..w..',
  '....ssgggggbbbb..w..',
  '.....ssggggggbb.....',
  '....sss...ggg.......',
  '...sss...ggg........',
  '..sss...gggg........',
  EMPTY,
];

// Saluda con el bracito; la piqueta queda parada en el suelo
const WAVE_1 = [
  EMPTY,
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '..........gggggg..g.',
  '......gggggggbb..g..',
  '....ggggggggbbbgg...',
  '..ggggggggggbbb.....',
  'gggggggggggbbbb.....',
  'sssssgggggggbbb.....',
  '.....ssggggggbb..w..',
  '.....sss...ggg...w..',
  '......ss...ggg...w..',
  '.....sss...gggg.mmm.',
];
const WAVE_2 = [
  EMPTY,
  '............ggggg...',
  '...........ggggggg..',
  '...........ggggoggg.',
  '...........ggggggggg',
  '...........gggggc.c.',
  '..........gggggg....',
  '......gggggggbb..gg.',
  '....ggggggggbbbgg...',
  '..ggggggggggbbb.....',
  'gggggggggggbbbb.....',
  'sssssgggggggbbb.....',
  '.....ssggggggbb..w..',
  '.....sss...ggg...w..',
  '......ss...ggg...w..',
  '.....sss...gggg.mmm.',
];

// fps: fotogramas por segundo. La velocidad de walk la ajusta mascot.js según el scroll.
export const ANIMATIONS = {
  idle: { fps: 2, frames: [[...HEAD, ...BODY, ...LEGS], [EMPTY, ...HEAD, ...BODY, ...LEGS_BENT]] },
  walk: {
    fps: 8,
    frames: [
      [...HEAD, ...BODY, ...STEP_1],
      [...HEAD, ...BODY, ...STEP_2],
      [...HEAD, ...BODY, ...STEP_3],
      [...HEAD, ...BODY, ...STEP_4],
    ],
  },
  tap: { fps: 3, frames: [TAP_UP, TAP_DOWN] },
  sleep: { fps: 1, frames: [SLEEP_1, SLEEP_2] },
  jump: { fps: 1, frames: [JUMP] },
  roar: { fps: 6, frames: [[...HEAD_ROAR, ...BODY, ...LEGS], [...HEAD_ROAR_WIDE, ...BODY, ...LEGS]] },
  look: { fps: 1, frames: [[...HEAD_LOOK, ...BODY, ...LEGS]] },
  wave: { fps: 4, frames: [WAVE_1, WAVE_2] },
};
