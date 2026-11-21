// Visor de los workflows reales de n8n de Campus OPS (proyectos/campus-ops.html).
// Dibuja cada workflow como en el editor de n8n, con los nodos en su posición
// original, las conexiones y las notas. Se arrastra para moverse, se acerca con
// los botones (o Ctrl + rueda) y al tocar un nodo se ve su código o su consulta.
// Los datos salen de tools/export_workflows.py, sin credenciales.

const NS = 'http://www.w3.org/2000/svg';
const NODE = 100; // lado de un nodo, como en n8n
const KINDS = {
  webhook: { label: 'Webhook', glyph: 'API', color: '#e2667a' },
  respondToWebhook: { label: 'Respuesta', glyph: '↩', color: '#2f9e72' },
  postgres: { label: 'PostgreSQL', glyph: 'SQL', color: '#336791' },
  code: { label: 'Código', glyph: 'JS', color: '#d9822b' },
  if: { label: 'Condición', glyph: 'IF', color: '#5c7c4c' },
  httpRequest: { label: 'Petición HTTP', glyph: 'HTTP', color: '#3a6ea5' },
  executeWorkflow: { label: 'Llama a otro workflow', glyph: '▶', color: '#7b5ea7' },
  executeWorkflowTrigger: { label: 'Inicio desde otro workflow', glyph: '⇥', color: '#7b5ea7' },
};
const TEXT = {
  hint: { es: 'Toca un nodo para ver lo que hace.', en: 'Tap a node to see what it does.' },
  fit: { es: 'Ajustar', en: 'Fit' },
  nodes: { es: 'nodos', en: 'nodes' },
};
const JS_WORDS = /\b(const|let|var|return|if|else|for|of|in|new|function|await|async|throw|try|catch|null|true|false|typeof)\b/g;
const SQL_WORDS = /\b(SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|ON|AS|ORDER|BY|GROUP|HAVING|LIMIT|RETURNING|WITH|CASE|WHEN|THEN|ELSE|END|NULL|IS|IN|EXISTS|COUNT|COALESCE|DISTINCT|BETWEEN|CREATE|TABLE|TRIGGER|FUNCTION)\b/gi;

const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
const say = (key) => TEXT[key][lang()];

function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (parent) parent.append(node);
  return node;
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Colores mínimos: comentarios, textos y palabras clave
function highlight(text, kind) {
  const words = kind === 'sql' ? SQL_WORDS : kind === 'js' ? JS_WORDS : null;
  const parts = text.split(/(\/\/[^\n]*|--[^\n]*|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")/g);
  return parts.map((part, index) => {
    const safe = escapeHtml(part);
    if (index % 2) return `<span class="${part.startsWith('//') || part.startsWith('--') ? 'code__com' : 'code__str'}">${safe}</span>`;
    return words ? safe.replace(words, '<span class="code__kw">$&</span>') : safe;
  }).join('');
}

export async function mount(root) {
  const data = await fetch(root.dataset.n8n).then((response) => response.json());
  root.innerHTML = `
    <div class="n8n__bar">
      <div class="n8n__tabs" role="tablist"></div>
      <div class="n8n__zoom">
        <button type="button" data-zoom="out" aria-label="Alejar">−</button>
        <button type="button" data-zoom="in" aria-label="Acercar">+</button>
        <button type="button" data-zoom="fit"></button>
      </div>
    </div>
    <div class="n8n__body">
      <div class="n8n__stage"><svg class="n8n__canvas" aria-label="Workflow"><g class="n8n__world"></g></svg></div>
      <aside class="n8n__detail" aria-live="polite"></aside>
    </div>`;
  const tabs = root.querySelector('.n8n__tabs');
  const stage = root.querySelector('.n8n__stage');
  const svg = root.querySelector('.n8n__canvas');
  const world = root.querySelector('.n8n__world');
  const detail = root.querySelector('.n8n__detail');
  const fitButton = root.querySelector('[data-zoom="fit"]');
  let view = { scale: 1, x: 0, y: 0 };
  let bounds = null;
  let current = null;

  const apply = () => world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.scale})`);

  function fit() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const pad = 40;
    const scale = Math.min((width - pad * 2) / bounds.w, (height - pad * 2) / bounds.h, 1.1);
    view = { scale, x: (width - bounds.w * scale) / 2 - bounds.x * scale, y: (height - bounds.h * scale) / 2 - bounds.y * scale };
    apply();
  }

  function zoom(factor) {
    const cx = stage.clientWidth / 2;
    const cy = stage.clientHeight / 2;
    const scale = Math.min(2.5, Math.max(0.2, view.scale * factor));
    view.x = cx - ((cx - view.x) * scale) / view.scale;
    view.y = cy - ((cy - view.y) * scale) / view.scale;
    view.scale = scale;
    apply();
  }

  function showIdle(workflow) {
    detail.innerHTML = `<p class="n8n__name">${escapeHtml(workflow.name)}</p>
      <p class="n8n__meta">${workflow.nodes.length} ${say('nodes')}</p><p class="n8n__hint">${say('hint')}</p>`;
  }

  function select(node, element) {
    world.querySelectorAll('.n8n__node.is-selected').forEach((other) => other.classList.remove('is-selected'));
    element.classList.add('is-selected');
    const kind = KINDS[node.kind] ?? { label: node.kind };
    const body = node.detail
      ? `<pre class="code n8n__code"><code>${highlight(node.detail.text, node.detail.lang)}</code></pre>`
      : '';
    detail.innerHTML = `<p class="n8n__name">${escapeHtml(node.name)}</p><p class="n8n__meta">${escapeHtml(kind.label)}</p>${body}`;
  }

  function draw(workflow) {
    current = workflow;
    world.replaceChildren();
    const byName = new Map(workflow.nodes.map((node) => [node.name, node]));
    const xs = [];
    const ys = [];
    // Notas: los textos que dejó el equipo dentro del workflow
    workflow.notes.forEach((note) => {
      el('rect', { x: note.x, y: note.y, width: note.w, height: note.h, rx: 8, class: 'n8n__note' }, world);
      const box = el('foreignObject', { x: note.x + 10, y: note.y + 8, width: note.w - 20, height: note.h - 16 }, world);
      const div = document.createElement('div');
      div.className = 'n8n__note-text';
      div.textContent = note.text.replace(/[#*_`]/g, '');
      box.append(div);
      xs.push(note.x, note.x + note.w);
      ys.push(note.y, note.y + note.h);
    });
    // Conexiones, de la salida (derecha) a la entrada (izquierda)
    workflow.links.forEach(([from, to]) => {
      const a = byName.get(from);
      const b = byName.get(to);
      if (!a || !b) return;
      const x1 = a.x + NODE;
      const y1 = a.y + NODE / 2;
      const x2 = b.x;
      const y2 = b.y + NODE / 2;
      const bend = Math.max(40, Math.abs(x2 - x1) / 2);
      el('path', { d: `M${x1} ${y1}C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`, class: 'n8n__link' }, world);
    });
    // Nodos
    workflow.nodes.forEach((node) => {
      const kind = KINDS[node.kind] ?? { glyph: '•', color: '#6b7280', label: node.kind };
      const group = el('g', { class: 'n8n__node', tabindex: 0, role: 'button', 'aria-label': node.name }, world);
      const trigger = node.kind === 'webhook' || node.kind === 'executeWorkflowTrigger';
      el('rect', { x: node.x, y: node.y, width: NODE, height: NODE, rx: trigger ? 30 : 12, class: 'n8n__box', style: `--kind: ${kind.color}` }, group);
      const glyph = el('text', { x: node.x + NODE / 2, y: node.y + NODE / 2 + 8, class: 'n8n__glyph', 'text-anchor': 'middle', style: `fill: ${kind.color}` }, group);
      glyph.textContent = kind.glyph;
      const label = el('foreignObject', { x: node.x - 30, y: node.y + NODE + 6, width: NODE + 60, height: 44 }, group);
      const name = document.createElement('div');
      name.className = 'n8n__label';
      name.textContent = node.name;
      label.append(name);
      group.addEventListener('click', () => select(node, group));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(node, group);
        }
      });
      xs.push(node.x, node.x + NODE);
      ys.push(node.y, node.y + NODE + 50);
    });
    bounds = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    showIdle(workflow);
    fit();
  }

  // Pestañas, una por workflow
  data.workflows.forEach((workflow, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'n8n__tab';
    button.setAttribute('role', 'tab');
    button.textContent = workflow.name.replace(/^[^·]*·\s*/, '');
    button.title = workflow.name;
    button.addEventListener('click', () => {
      tabs.querySelectorAll('.n8n__tab').forEach((tab) => tab.setAttribute('aria-selected', 'false'));
      button.setAttribute('aria-selected', 'true');
      draw(workflow);
    });
    button.setAttribute('aria-selected', String(index === 0));
    tabs.append(button);
  });

  // Moverse arrastrando; acercarse con los botones o con Ctrl + rueda
  let drag = null;
  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.n8n__node')) return;
    drag = { x: event.clientX - view.x, y: event.clientY - view.y };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    view.x = event.clientX - drag.x;
    view.y = event.clientY - drag.y;
    apply();
  });
  const stop = () => {
    drag = null;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  stage.addEventListener('wheel', (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });
  root.querySelector('[data-zoom="in"]').addEventListener('click', () => zoom(1.25));
  root.querySelector('[data-zoom="out"]').addEventListener('click', () => zoom(1 / 1.25));
  fitButton.addEventListener('click', fit);

  const relabel = () => {
    fitButton.textContent = say('fit');
    if (current && !world.querySelector('.is-selected')) showIdle(current);
  };
  new MutationObserver(relabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  new ResizeObserver(() => bounds && fit()).observe(stage);
  relabel();
  draw(data.workflows[0]);
}
