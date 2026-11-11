// Lo que dice Lapilli: una frase la primera vez que llega a cada parte de la
// página (sección o banda, por su data-segment) y otras cuando pasa algo.

export const SEGMENTS = {
  inicio: { line: '¡Hola! Soy Lapilli. Te acompaño mientras recorres el portafolio.' },
  'band-volcan': { line: 'Si le haces clic a ese volcán, vuelve a hacer erupción.' },
  'sobre-mi': { line: 'Adriana es geóloga y desarrolladora. Yo soy su asistente de campo.' },
  'band-fosiles': { line: 'Un trilobite, un helecho y un pez: fósiles del Paleozoico.' },
  proyectos: { line: 'Acércate a un proyecto y te cuento algo de él.' },
  'band-kpg': { line: 'El límite K-Pg: las aves son los dinosaurios que sobrevivieron.' },
  habilidades: { line: 'Bases de datos, Python, JavaScript, Java y SIG.' },
  intereses: { line: 'Geociencias y datos: lo que más le interesa a Adriana.' },
  'band-conos': { line: 'Conos monogenéticos, como los del campo volcánico de su tesis.' },
  contacto: { line: '¿Hablamos? Aquí están sus datos de contacto.' },
};

// Frases de Lapilli fuera de los segmentos
export const LINES = {
  eruption: {
    poly: 'Poligenético: hace erupción muchas veces por el mismo conducto.',
    fissure: 'Fisural: la lava sale por grietas largas, no por un cono.',
    mono: 'Monogenético: una sola erupción y no se repite.',
  },
  impact: 'Un asteroide: así terminó el Cretácico.',
  idleTap: 'Analizando este afloramiento…',
  sleep: 'Zzz…',
  wake: '¡Ya desperté!',
  // Datos curiosos al hacer clic en Lapilli (se recorren en orden)
  facts: [
    'Me llamo Lapilli: así se llaman los fragmentos volcánicos de 2 a 64 mm.',
    'Soy verde olivino, como el mineral más abundante del manto superior.',
    'Llevo piqueta porque soy geólogo, igual que Adriana.',
    'Este sitio está hecho con HTML, CSS y JavaScript, sin frameworks.',
    'Me dibujo píxel por píxel en un canvas de 20 × 16.',
    'Las aves son los dinosaurios que sobrevivieron al límite K-Pg.',
  ],
};
