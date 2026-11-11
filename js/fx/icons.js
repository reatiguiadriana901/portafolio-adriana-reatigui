// Íconos pixelados de los intereses y de los fósiles de las bandas.
// Cada uno es una matriz de 12x12; el CSS los escala sin suavizado.

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
    '....cccc....', '.....cc.....', '.....cc.....', '.....cc.....',
    '....c..c....', '...c....c...', '..c......c..', '..cllllllc..',
    '.clllllllllc', '.cllldlllllc', '..cccccccc..', '............',
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
    'kk.oo.tt.ll.', 'kk.oo.tt.ll.', 'cccccccccccc', '............',
  ],
  database: [
    '...ssssss...', '..s......s..', '..ssssssss..', '..sbbbbbbs..',
    '..ssssssss..', '..sbbbbbbs..', '..ssssssss..', '..sbbbbbbs..',
    '..ssssssss..', '...ssssss...', '............', '............',
  ],
};

export function paintIcons() {
  document.querySelectorAll('canvas[data-sprite]').forEach((canvas) => {
    const rows = ICONS[canvas.dataset.sprite];
    if (rows) paintSprite(canvas, rows, PALETTE);
  });
}
