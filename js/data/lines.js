// Lo que dice Lapilli, en español y en inglés (i18n.js elige con pick): su
// presentación, una frase la primera vez que llega a cada parte de la página
// (por su data-segment), otras cuando pasa algo y los hallazgos del recorrido.

export const SEGMENTS = {
  inicio: { line: { es: '¡Hola! Soy Lapilli. Te acompaño mientras recorres el portafolio.', en: "Hi! I'm Lapilli. I'll walk with you through the portfolio." } },
  'band-1': { line: { es: 'Ley de superposición: las capas de abajo son las más antiguas.', en: 'Law of superposition: the lower layers are the oldest.' } },
  'sobre-mi': { line: { es: 'Adriana es geóloga y desarrolladora. Yo soy su asistente de campo.', en: "Adriana is a geologist and a developer. I'm her field assistant." } },
  'band-2': { line: { es: 'Arenisca, lutita, caliza y conglomerado: cada roca tiene su símbolo en un mapa.', en: 'Sandstone, shale, limestone and conglomerate: each rock has its own map symbol.' } },
  proyectos: { line: { es: 'Elige un núcleo de la caja y te cuento algo del proyecto.', en: "Pick a core from the box and I'll tell you about the project." } },
  'band-3': { line: { es: 'En campo se mide el rumbo y el buzamiento de cada capa con una brújula.', en: 'In the field, the strike and dip of each layer are measured with a compass.' } },
  habilidades: { line: { es: 'Bases de datos, Python, JavaScript, Java y SIG.', en: 'Databases, Python, JavaScript, Java and GIS.' } },
  intereses: { line: { es: 'Geociencias y datos: lo que más le interesa a Adriana.', en: 'Geosciences and data: what interests Adriana most.' } },
  'band-4': { line: { es: 'Del afloramiento a los datos: así se construye un mapa geológico.', en: 'From outcrop to data: that is how a geological map is built.' } },
  contacto: { line: { es: '¿Hablamos? Aquí están sus datos de contacto.', en: 'Shall we talk? Her contact details are here.' } },
};

// Frases de Lapilli fuera de los segmentos
export const LINES = {
  // Al salir del huevo, cuando se abre la página
  intro: {
    es: '¡Hola! Soy Lapilli, el asistente de campo de Adriana. ¡Vamos a recorrer su portafolio!',
    en: "Hi! I'm Lapilli, Adriana's field assistant. Let's explore her portfolio!",
  },
  idleTap: { es: 'Analizando este afloramiento…', en: 'Analyzing this outcrop…' },
  sleep: { es: 'Zzz…', en: 'Zzz…' },
  wake: { es: '¡Ya desperté!', en: "I'm awake!" },
  // Datos curiosos al hacer clic en Lapilli (se recorren en orden)
  facts: [
    { es: 'Me llamo Lapilli: así se llaman los fragmentos volcánicos de 2 a 64 mm.', en: "My name is Lapilli: that's what volcanic fragments from 2 to 64 mm are called." },
    { es: 'Soy verde olivino, como el mineral más abundante del manto superior.', en: "I'm olivine green, like the most abundant mineral in the upper mantle." },
    { es: 'Llevo piqueta porque soy geólogo, igual que Adriana.', en: "I carry a rock hammer because I'm a geologist, just like Adriana." },
    { es: 'Este sitio está hecho con HTML, CSS y JavaScript, sin frameworks.', en: 'This site is made with HTML, CSS and JavaScript, no frameworks.' },
    { es: 'Me dibujo píxel por píxel en un canvas de 20 × 16.', en: "I'm drawn pixel by pixel on a 20 × 16 canvas." },
    { es: 'Las aves son los dinosaurios que sobrevivieron al límite K-Pg.', en: 'Birds are the dinosaurs that survived the K-Pg boundary.' },
    { es: 'El basalto se enfría tan rápido que casi no forma cristales grandes.', en: 'Basalt cools so fast that it barely forms large crystals.' },
    { es: 'El diamante y el grafito son el mismo elemento: carbono puro.', en: 'Diamond and graphite are the same element: pure carbon.' },
    { es: 'La pirita brilla como el oro, pero es sulfuro de hierro: el oro de los tontos.', en: "Pyrite shines like gold, but it is iron sulfide: fool's gold." },
    { es: 'Los geólogos mojan las rocas para ver mejor sus minerales.', en: 'Geologists wet rocks to see their minerals better.' },
    { es: 'En Colombia hay volcanes activos como el Nevado del Ruiz y el Galeras.', en: 'Colombia has active volcanoes such as Nevado del Ruiz and Galeras.' },
    { es: 'La energía geotérmica aprovecha el calor del interior de la Tierra.', en: "Geothermal energy uses the heat from the Earth's interior." },
    { es: 'Las rocas sedimentarias cubren cerca de tres cuartas partes de los continentes.', en: 'Sedimentary rocks cover about three quarters of the continents.' },
    { es: 'El agua subterránea es la mayor reserva de agua dulce líquida del planeta.', en: "Groundwater is the planet's largest store of liquid fresh water." },
  ],
};

// Hallazgos del recorrido (fx/landmarks.js): ícono de fx/icons.js, etiqueta y lo
// que dice Lapilli al pasar. Se reparten en orden y, si faltan, se repiten.
export const LANDMARKS = [
  { sprite: 'hammer', label: { es: 'piqueta', en: 'rock hammer' }, line: { es: 'La piqueta: la herramienta básica de una geóloga en campo.', en: "The rock hammer: a geologist's basic field tool." } },
  { sprite: 'terminal', label: { es: 'terminal', en: 'terminal' }, line: { es: 'git commit: guardar cada cambio, capa por capa.', en: 'git commit: saving every change, layer by layer.' } },
  { sprite: 'crystal', label: { es: 'cuarzo', en: 'quartz' }, line: { es: 'Cuarzo: dureza 7 en la escala de Mohs.', en: 'Quartz: hardness 7 on the Mohs scale.' } },
  { sprite: 'database', label: { es: 'SQL', en: 'SQL' }, line: { es: 'Una buena base de datos no repite información.', en: 'A good database never repeats information.' } },
  { sprite: 'ammonite', label: { es: 'amonita', en: 'ammonite' }, line: { es: 'Las amonitas son fósiles guía: ayudan a fechar rocas.', en: 'Ammonites are index fossils: they help date rocks.' } },
  { sprite: 'bug', label: { es: 'bug', en: 'bug' }, line: { es: 'Un bug. Toca depurar antes de seguir.', en: 'A bug. Time to debug before moving on.' } },
  { sprite: 'flask', label: { es: 'geoquímica', en: 'geochemistry' }, line: { es: 'Con elementos traza se estudia el origen de un magma.', en: 'Trace elements help us study where a magma came from.' } },
  { sprite: 'chart', label: { es: 'datos', en: 'data' }, line: { es: 'Una roseta resume cientos de direcciones en un gráfico.', en: 'A rose diagram sums up hundreds of directions in one chart.' } },
  { sprite: 'trilobite', label: { es: 'trilobite', en: 'trilobite' }, line: { es: 'Los trilobites tenían ojos con lentes de calcita.', en: 'Trilobites had eyes with calcite lenses.' } },
  { sprite: 'drop', label: { es: 'petróleo', en: 'oil' }, line: { es: 'El petróleo migra hasta quedar atrapado en una trampa.', en: 'Oil migrates until it gets caught in a trap.' } },
  { sprite: 'fern', label: { es: 'helecho', en: 'fern' }, line: { es: 'Los helechos ya existían antes que los dinosaurios.', en: 'Ferns existed before the dinosaurs.' } },
];

// Fotos de campo de Adriana: fx/landmarks.js las pone como polaroids junto al
// recorrido (en escritorio) y Lapilli comenta cada una al pasar
export const PHOTOS = [
  { src: 'assets/img/campo-afloramiento.webp', w: 703, h: 900, caption: { es: 'Frente a un afloramiento', en: 'Facing an outcrop' }, line: { es: '¡Adriana en una salida de campo, leyendo las capas de un afloramiento!', en: 'Adriana on a field trip, reading the layers of an outcrop!' } },
  { src: 'assets/img/campo-costa.webp', w: 679, h: 900, caption: { es: 'Salida de campo a la costa', en: 'Field trip to the coast' }, line: { es: 'Salida de campo a la costa: la arena también cuenta su historia.', en: 'A field trip to the coast: the sand tells its own story too.' } },
  { src: 'assets/img/campo-volcan.webp', w: 900, h: 506, caption: { es: 'Un volcán nevado y su lago', en: 'A snowy volcano and its lake' }, line: { es: 'Un estratovolcán nevado: crece con muchas erupciones a lo largo del tiempo.', en: 'A snowy stratovolcano: it grows through many eruptions over time.' } },
];
