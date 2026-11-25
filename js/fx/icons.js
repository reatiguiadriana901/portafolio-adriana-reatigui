// Íconos pixelados de los intereses, de los fósiles de las franjas y de los
// hallazgos del recorrido. Cada uno es una matriz de 12x12; el CSS los escala
// sin suavizado.

import { paintSprite } from '../pixel.js';

const PALETTE = {
  l: '#EE9AA8', // rosa
  d: '#9A4F58', // palo de rosa
  t: '#7F93A8', // azul niebla
  T: '#2D3A47', // azul medianoche
  s: '#D9C7A7', // arena
  b: '#A8B58A', // salvia
  k: '#6F7D55', // salvia oscura
  o: '#7A9A3A', // olivino
  O: '#C9D98A', // olivino claro
  c: '#FFFCF5', // crema
  x: '#2D3A47', // azul medianoche
};

const ICONS = {
  trilobite: [
    '....ssss....', '..ssbbbbss..', '.sbbbxxbbbs.', '.sbbbbbbbbs.',
    '..kkkkkkkk..', '.sbbsbbsbbs.', '..kkkkkkkk..', '.sbbsbbsbbs.',
    '..kkkkkkkk..', '..sbbsbbsb..', '...sbbbbs...', '....ssss....',
  ],
  fern: [
    '.....oo.....', '....oOOo....', '.o...oo...o.', '..oo.oo.oo..',
    '....oooo....', '.oo..oo..oo.', '...oooooo...', '.....oo.....',
    '..ooooooo...', '.....oo.....', '.....kk.....', '.....kk.....',
  ],
  fish: [
    '............', '............', '....TTTT...T', '..TTttttT.TT',
    '.TtxtttttTTT', '.Tttttttttt.', '.TtttttttTTT', '..TTttttT.TT',
    '....TTTT...T', '............', '............', '............',
  ],
  flask: [
    '....tttt....', '.....tt.....', '.....tt.....', '.....tt.....',
    '....t..t....', '...t....t...', '..t......t..', '..tllllllt..',
    '.tlllllllllt', '.tllldlllllt', '..tttttttt..', '............',
  ],
  drop: [
    '.....dd.....', '.....dd.....', '....dddd....', '....dlld....',
    '...dlllld...', '..dlllllld..', '..dlclllllld', '.dlcllllllld',
    '.dlclllllld.', '..dllllllld.', '...dddddd...', '............',
  ],
  crystal: [
    '.....tt.....', '....tTTt....', '...tTttTt...', '..tTttttTt..',
    '..tTtcttTt..', '..tTtcttTt..', '..tTttttTt..', '..tTttttTt..',
    '...tTttTt...', '....tTTt....', '.....tt.....', '............',
  ],
  ammonite: [
    '...ssssss...', '..sbbbbbbs..', '.sbsssssbbs.', '.sbsbbbsbbs.',
    '.sbsbsbsbbs.', '.sbsbbbsbbs.', '.sbsssssbbs.', '.sbbbbbbbbs.',
    '..sbbbbbbs..', '...ssssss...', '............', '............',
  ],
  chart: [
    '............', '.........ll.', '.........ll.', '......tt.ll.',
    '......tt.ll.', '...oo.tt.ll.', '...oo.tt.ll.', 'kk.oo.tt.ll.',
    'kk.oo.tt.ll.', 'kk.oo.tt.ll.', 'TTTTTTTTTTTT', '............',
  ],
  database: [
    '...ssssss...', '..s......s..', '..ssssssss..', '..sbbbbbbs..',
    '..ssssssss..', '..sbbbbbbs..', '..ssssssss..', '..sbbbbbbs..',
    '..ssssssss..', '...ssssss...', '............', '............',
  ],
  // Hoja: energía y medio ambiente
  leaf: [
    '.........kk.', '.......kbbk.', '.....kbbbbk.', '....kbbObbk.',
    '...kbbObbbk.', '..kbbObbbk..', '..kbObbbk...', '.kbObbkk....',
    '.kOkkk......', '.k..........', 'k...........', '............',
  ],
  // Piqueta de geóloga
  hammer: [
    '............', '.TTTTTTTTt..', '.TttttttTTTt', '.TTTTTTTTt..',
    '....dd......', '....dd......', '....dd......', '....dd......',
    '....dd......', '....dd......', '....kk......', '....kk......',
  ],
  // Un bug de verdad
  bug: [
    '...T....T...', '....T..T....', '...TTTTTT...', '..TkkkkkkT..',
    'T.TkbkkbkT.T', '.TkkkTTkkkT.', 'T.TkkTTkkT.T', '.TkkkTTkkkT.',
    'T.TkkTTkkT.T', '..TkkTTkkT..', '...TTTTTT...', '............',
  ],
  // Engranaje: automatización
  gear: [
    '.....TT.....', '.TT..TT..TT.', '.TTTTTTTTTT.', '..TTTttTTT..',
    '..TTt..tTT..', 'TTTt....tTTT', 'TTTt....tTTT', '..TTt..tTT..',
    '..TTTttTTT..', '.TTTTTTTTTT.', '.TT..TT..TT.', '.....TT.....',
  ],
  // Taza de café humeante: backend con Java
  cup: [
    '...t..t.....', '....t..t....', '...t..t.....', '............',
    '.dddddddd...', '.dTTTTTTd...', '.dlllllldddd', '.dlllllld..d',
    '.dlllllldddd', '..dlllld....', '...dddd.....', '.kkkkkkkkk..',
  ],
  // Ventana de terminal con su prompt
  terminal: [
    'tttttttttttt', 'tltbtttttttt', 'txxxxxxxxxxt', 'txbxxxxxxxxt',
    'txxbxxxxxxxt', 'txxxbxxxxxxt', 'txxbxxxxxxxt', 'txbxxxbbbbxt',
    'txxxxxxxxxxt', 'tttttttttttt', '............', '............',
  ],
};

/** Pinta un ícono por su nombre en un canvas. */
export function paintIcon(canvas, name) {
  const rows = ICONS[name];
  if (rows) paintSprite(canvas, rows, PALETTE);
}

export function paintIcons() {
  document.querySelectorAll('canvas[data-sprite]').forEach((canvas) => paintIcon(canvas, canvas.dataset.sprite));
}
