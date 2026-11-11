// Gráfico interactivo de la tesis: todas las orientaciones del campo volcánico en un
// semicírculo de 0° (N, arriba) a 180° (S, abajo). Los datos son axiales (un rumbo de
// 30° es el mismo que uno de 210°), así que basta la mitad derecha de una rosa.
// Solo reemplaza la imagen de respaldo si los datos llegan y el dibujo sale bien.

const SVG_NS = 'http://www.w3.org/2000/svg';

// Medidas en unidades del viewBox: el SVG se escala con su contenedor
const WIDTH = 386;
const HEIGHT = 440;
const CX = 28; // centro del semicírculo, pegado al borde izquierdo
const CY = 220;
const ROSE_R = 150; // radio de la clase con más conos
const RING_IN = 166; // anillo de las familias de lineamientos
const RING_OUT = 184;
const SHMAX_R = 191; // arco con el rango del SHmax
const LINE_R = 198; // largo de las líneas de rumbo
const FONT = 12.5;
const SMALL_FONT = 11.5;
const LINE_H = 16; // distancia vertical mínima entre etiquetas exteriores

// Capas que se pueden apagar; sus botones también hacen de leyenda
const LAYERS = [
  { id: 'rose', name: 'Elongación de los conos' },
  { id: 'families', name: 'Familias F1–F4' },
  { id: 'structures', name: 'Fallas y lineamiento' },
  { id: 'shmax', name: 'SHmax actual' },
];

const format = (value) => value.toLocaleString('es-CO');
const cones = (count) => `${count} ${count === 1 ? 'cono' : 'conos'}`;

export function initThesisChart(mount) {
  if (!mount) return;
  if (!('IntersectionObserver' in window)) {
    loadChart(mount);
    return;
  }
  // Pide los datos cuando el gráfico está a 600 px de entrar en pantalla
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    loadChart(mount);
  }, { rootMargin: '600px' });
  observer.observe(mount);
}

async function loadChart(mount) {
  try {
    const response = await fetch(new URL('../data/thesis.json', import.meta.url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const plot = document.createElement('div');
    plot.className = 'thesis-chart__plot';
    plot.append(buildSvg(data));
    const hideTooltip = addTooltip(plot);
    mount.replaceChildren(buildToggles(plot, hideTooltip), plot, buildNote(data.elongacion.intervalo));
  } catch (error) {
    // Si algo falla se quedan la imagen de respaldo y la tabla
    console.warn('No se pudo dibujar el gráfico de la tesis:', error);
  }
}

function buildSvg(data) {
  const svg = svgEl('svg', {
    class: 'thesis-chart__svg',
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    role: 'group',
    'aria-labelledby': 'grafico-titulo',
    'aria-describedby': 'thesis-chart-desc',
    'font-size': FONT,
  });
  svgEl('desc', { id: 'thesis-chart-desc' }, svg, describe(data));

  // El radio crece con la raíz del conteo: así el ÁREA de cada cuña es proporcional
  // al número de conos (Sanderson y Peacock, 2020). La rejilla tiene 4 anillos.
  const step = Math.ceil(Math.max(...data.elongacion.conteos) / 4);
  const radius = (count) => ROSE_R * Math.sqrt(count / (step * 4));

  // Grupos en orden de dibujo: lo último queda encima
  const grid = svgEl('g', { class: 'thesis-chart__grid', 'aria-hidden': 'true' }, svg);
  const shmaxBand = addLayer(svg, 'shmax');
  const wedges = addLayer(svg, 'rose');
  const families = addLayer(svg, 'families');
  const shmaxLine = addLayer(svg, 'shmax');
  const structures = addLayer(svg, 'structures');
  const mean = addLayer(svg, 'rose');

  const labels = []; // etiquetas de afuera: se ubican al final, todas juntas
  drawGrid(grid, step, radius);
  drawShmax(shmaxBand, shmaxLine, data.shmax, labels);
  drawWedges(wedges, data.elongacion, radius);
  drawFamilies(families, data.familias);
  drawStructures(structures, data.estructuras, labels);
  drawMean(mean, data.elongacion.mediaAxial, labels);
  placeLabels(labels);
  return svg;
}

// Resumen para lectores de pantalla (los detalles van en cada cuña y en la tabla)
function describe(data) {
  const { n, intervalo, mediaAxial } = data.elongacion;
  return `Semicírculo de 0° (norte) a 180° (sur). Elongación de ${n} conos en clases de ${intervalo}°, `
    + `con media axial de ${format(mediaAxial)}°; ${data.familias.length} familias de lineamientos; `
    + `rumbo de ${data.estructuras.length} fallas y lineamientos; `
    + `SHmax de ${data.shmax.azimut}° ± ${data.shmax.incertidumbre}°.`;
}

// Crea un elemento SVG con sus atributos (y su texto, si lo tiene) dentro de `parent`
function svgEl(tag, attributes, parent, text) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  if (text !== undefined) element.textContent = text;
  parent?.append(element);
  return element;
}

function addLayer(svg, id) {
  return svgEl('g', { class: 'thesis-chart__layer', 'data-layer': id }, svg);
}

// Azimut (0° = N, 90° = E, 180° = S) y radio → coordenadas del SVG
function point(azimuth, radius) {
  const angle = (azimuth * Math.PI) / 180;
  const x = CX + radius * Math.sin(angle);
  const y = CY - radius * Math.cos(angle);
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

// Arco en sentido horario (de menor a mayor azimut)
function arcPath(from, to, radius) {
  const [x1, y1] = point(from, radius);
  const [x2, y2] = point(to, radius);
  return `M${x1} ${y1} A${radius} ${radius} 0 0 1 ${x2} ${y2}`;
}

// Trozo de anillo entre dos azimuts; con inner = 0 es una cuña que sale del centro
function sectorPath(from, to, inner, outer) {
  const [x3, y3] = point(to, inner);
  const [x4, y4] = point(from, inner);
  return `${arcPath(from, to, outer)} L${x3} ${y3} A${inner} ${inner} 0 0 0 ${x4} ${y4} Z`;
}

// Línea desde el centro con un borde del color del fondo, para que se lea sobre las cuñas
function radialLine(parent, azimuth, className) {
  const [x, y] = point(azimuth, LINE_R);
  svgEl('line', { class: 'thesis-chart__casing', x1: CX, y1: CY, x2: x, y2: y }, parent);
  svgEl('line', { class: className, x1: CX, y1: CY, x2: x, y2: y }, parent);
}

// Rejilla: anillos de conteo, radios cada 30° y el eje N-S con sus rótulos
function drawGrid(group, step, radius) {
  const tick = (x, y, text, extra) => svgEl('text', {
    class: 'thesis-chart__tick', x, y, dy: '0.35em', 'font-size': SMALL_FONT, ...extra,
  }, group, text);

  for (let count = step; count <= step * 4; count += step) {
    svgEl('path', { d: arcPath(0, 180, radius(count)) }, group);
    tick(CX - 5, CY - radius(count), count, { 'text-anchor': 'end' });
  }
  for (let azimuth = 30; azimuth < 180; azimuth += 30) {
    const [x, y] = point(azimuth, ROSE_R);
    svgEl('line', { x1: CX, y1: CY, x2: x, y2: y }, group);
  }
  svgEl('line', { class: 'thesis-chart__axis', x1: CX, y1: CY - LINE_R, x2: CX, y2: CY + LINE_R }, group);
  tick(CX, CY - LINE_R - 12, 'N 0°', { 'text-anchor': 'middle' });
  tick(CX, CY + LINE_R + 12, 'S 180°', { 'text-anchor': 'middle' });
  tick(CX + ROSE_R + 3, CY + 10, 'E');
}

// SHmax: una franja suave de ± incertidumbre, su arco en el borde y la línea central
function drawShmax(band, lines, shmax, labels) {
  const from = shmax.azimut - shmax.incertidumbre;
  const to = shmax.azimut + shmax.incertidumbre;
  const text = `SHmax ${shmax.azimut}° ± ${shmax.incertidumbre}°`;
  svgEl('path', { class: 'thesis-chart__shmax-band', d: sectorPath(from, to, 0, SHMAX_R) }, band);
  const item = svgEl('g', { role: 'img', 'aria-label': text }, lines);
  svgEl('path', { class: 'thesis-chart__shmax-range', d: arcPath(from, to, SHMAX_R) }, item);
  radialLine(item, shmax.azimut, 'thesis-chart__shmax');
  labels.push({ parent: item, azimuth: shmax.azimut, text });
}

// Roseta: una cuña enfocable por clase angular, con su tooltip
function drawWedges(group, elongation, radius) {
  const total = elongation.n;
  elongation.conteos.forEach((count, index) => {
    if (count === 0) return;
    const from = index * elongation.intervalo;
    const to = from + elongation.intervalo;
    const range = `Elongación entre ${from}° y ${to}°`;
    svgEl('path', {
      class: 'thesis-chart__wedge',
      d: sectorPath(from, to, 0, radius(count)),
      tabindex: 0,
      role: 'img',
      'aria-label': `${range}: ${cones(count)} de ${total}`,
      'data-value': cones(count),
      'data-detail': `${range} · ${Math.round((count / total) * 100)} % de ${total}`,
    }, group);
  });
}

// Familias: trozos del anillo exterior según su rango de rumbos
function drawFamilies(group, families) {
  families.forEach((family) => {
    const [from, to] = family.rango;
    const range = `${from}° a ${to}°`;
    const amount = `${family.n} lineamientos y fallas · ${format(family.km)} km`;
    const item = svgEl('g', {
      class: 'thesis-chart__family',
      tabindex: 0,
      role: 'img',
      'aria-label': `Familia ${family.id}, ${family.direccion}, de ${range}: ${amount}`,
      'data-value': amount,
      'data-detail': `Familia ${family.id} · ${family.direccion} (${range})`,
    }, group);
    // F4 cruza el norte (130° → 10°): se dibuja en dos trozos, 130°-180° y 0°-10°
    const pieces = from < to ? [[from, to]] : [[from, 180], [0, to]];
    pieces.forEach(([start, end]) => {
      svgEl('path', { class: 'thesis-chart__piece', d: sectorPath(start, end, RING_IN, RING_OUT) }, item);
      const [x, y] = point((start + end) / 2, (RING_IN + RING_OUT) / 2);
      svgEl('text', {
        class: 'thesis-chart__family-label', x, y, dy: '0.35em', 'text-anchor': 'middle', 'font-size': SMALL_FONT,
      }, item, family.id);
    });
  });
}

function drawStructures(group, structures, labels) {
  structures.forEach((structure) => {
    const item = svgEl('g', { role: 'img', 'aria-label': `${structure.nombre}, rumbo ${structure.rumbo}°` }, group);
    radialLine(item, structure.rumbo, 'thesis-chart__structure');
    // Etiqueta corta: el botón de la capa ya dice que son fallas
    labels.push({ parent: item, azimuth: structure.rumbo, text: `${structure.nombre.replace('Falla ', '')} ${structure.rumbo}°` });
  });
}

function drawMean(group, mean, labels) {
  const text = `media ${format(mean)}°`;
  const item = svgEl('g', { role: 'img', 'aria-label': `Elongación ${text}` }, group);
  radialLine(item, mean, 'thesis-chart__mean');
  labels.push({ parent: item, azimuth: mean, text });
}

// Cada etiqueta va a la derecha del final de su línea. Si queda muy cerca de la de
// arriba, la bajo lo justo y dibujo una guía hasta su línea (así nunca se tapan).
function placeLabels(labels) {
  let previousY = -Infinity;
  labels
    .map((label) => ({ ...label, end: point(label.azimuth, LINE_R) }))
    .sort((a, b) => a.end[1] - b.end[1])
    .forEach(({ parent, end, text }) => {
      const [x, y] = end;
      const labelY = Math.max(y, previousY + LINE_H);
      previousY = labelY;
      if (labelY > y) {
        svgEl('line', { class: 'thesis-chart__leader', x1: x, y1: y, x2: x + 6, y2: labelY }, parent);
      }
      svgEl('text', { class: 'thesis-chart__label', x: x + 8, y: labelY, dy: '0.35em' }, parent, text);
    });
}

function buildToggles(plot, hideTooltip) {
  const group = document.createElement('div');
  group.className = 'thesis-chart__toggles';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Capas del gráfico');

  LAYERS.forEach((layer) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thesis-chart__toggle';
    button.setAttribute('aria-pressed', 'true');
    const key = document.createElement('span');
    key.className = `thesis-chart__key thesis-chart__key--${layer.id}`;
    key.setAttribute('aria-hidden', 'true');
    button.append(key, layer.name);

    button.addEventListener('click', () => {
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      plot.querySelectorAll(`[data-layer="${layer.id}"]`).forEach((element) => {
        element.classList.toggle('thesis-chart__layer--off', !visible);
      });
      hideTooltip();
    });
    group.append(button);
  });
  return group;
}

// Tooltip de cuñas y familias: sale al pasar el puntero y al enfocar con Tab. Repite
// lo que ya dice el aria-label, por eso se oculta a los lectores de pantalla.
function addTooltip(plot) {
  const svg = plot.querySelector('svg');
  const tooltip = document.createElement('div');
  tooltip.className = 'thesis-chart__tooltip';
  tooltip.hidden = true;
  tooltip.setAttribute('aria-hidden', 'true');
  const value = document.createElement('strong');
  value.className = 'thesis-chart__tooltip-value';
  const detail = document.createElement('span');
  detail.className = 'thesis-chart__tooltip-detail';
  tooltip.append(value, detail);
  plot.append(tooltip);

  const hide = () => {
    tooltip.hidden = true;
  };
  const show = (mark, clientX, clientY) => {
    value.textContent = mark.dataset.value;
    detail.textContent = mark.dataset.detail;
    tooltip.hidden = false;
    // Encima del punto y dentro del gráfico; si no cabe arriba, va debajo
    const box = plot.getBoundingClientRect();
    const left = clientX - box.left - tooltip.offsetWidth / 2;
    const top = clientY - box.top - tooltip.offsetHeight - 12;
    tooltip.style.left = `${Math.max(0, Math.min(left, box.width - tooltip.offsetWidth))}px`;
    tooltip.style.top = `${top < 0 ? clientY - box.top + 16 : top}px`;
  };

  const onPointer = (event) => {
    const mark = event.target.closest('[data-value]');
    if (mark) show(mark, event.clientX, event.clientY);
    else hide();
  };
  svg.addEventListener('pointermove', onPointer);
  svg.addEventListener('pointerdown', onPointer);
  // Con el dedo no hay "salir": el tooltip se va al tocar otra cosa (pierde el foco)
  svg.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') hide();
  });
  svg.addEventListener('focusin', (event) => {
    const mark = event.target.closest('[data-value]');
    if (!mark) return;
    const rect = mark.getBoundingClientRect();
    show(mark, rect.left + rect.width / 2, rect.top);
  });
  svg.addEventListener('focusout', hide);
  svg.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
  return hide;
}

function buildNote(interval) {
  const note = document.createElement('p');
  note.className = 'thesis-chart__note';
  note.textContent = `Cada cuña reúne los conos de una clase de ${interval}°: su área es proporcional `
    + 'al número de conos (Sanderson y Peacock, 2020), que marcan los anillos. Pasa el puntero '
    + 'o usa Tab sobre las cuñas y las familias para ver sus valores.';
  return note;
}
