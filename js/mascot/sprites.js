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

// ----- Huevo de la entrada: al abrir la página, Lapilli sale de él

export const EGG_PALETTE = {
  x: '#2D3A47', // contorno y grietas
  e: '#F6E7C8', // cáscara
  h: '#FFFCF5', // brillo
  s: '#A8B58A', // manchas
};

// Cada fila del huevo: [columna donde empieza, píxeles]; ocupa las filas 3 a 15
const EGG = [
  [9, 'xx'], [8, 'xhhx'], [7, 'xheeex'], [6, 'xheeseex'], [6, 'xeeeeeex'], [6, 'xeseeeex'], [6, 'xeeeesex'],
  [6, 'xeeseeex'], [6, 'xeeeeeex'], [6, 'xseeeeex'], [6, 'xeeeesex'], [7, 'xeeeex'], [8, 'xxxx'],
];
const CRACK = [[8, 7], [9, 8], [8, 9], [9, 10], [8, 11], [9, 12]]; // [fila, columna]: grieta en zigzag

// tilt corre la mitad de arriba un píxel hacia un lado: así el huevo se bambolea
function eggFrame(tilt = 0, cracked = false) {
  const rows = Array.from({ length: FRAME_H }, () => EMPTY);
  EGG.forEach(([start, pixels], i) => {
    const left = start + (i < 6 ? tilt : 0);
    rows[i + 3] = '.'.repeat(left) + pixels + '.'.repeat(FRAME_W - left - pixels.length);
  });
  if (cracked) {
    CRACK.forEach(([row, col]) => {
      rows[row] = `${rows[row].slice(0, col)}x${rows[row].slice(col + 1)}`;
    });
  }
  return rows;
}

// fps: fotogramas por segundo. La velocidad de walk la ajusta mascot.js según el scroll.
// palette: paleta propia (si no tiene, se usa la de Lapilli).
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
  egg: { fps: 6, frames: [eggFrame(0), eggFrame(-1), eggFrame(0), eggFrame(1)], palette: EGG_PALETTE },
  crack: { fps: 1, frames: [eggFrame(0, true)], palette: EGG_PALETTE },
};
