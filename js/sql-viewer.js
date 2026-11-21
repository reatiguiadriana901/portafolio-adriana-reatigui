// Visor del SQL real de un proyecto de bases de datos (proyectos/as-techshop.html,
// proyectos/asogasinga.html). Pestañas por tipo de objeto, la lista de objetos y
// el código de cada uno. Los datos salen de tools/export_sql.py.

const TEXT = {
  file: { es: 'Archivo', en: 'File' },
  pick: { es: 'Elige un objeto de la lista para ver su código.', en: 'Pick an object from the list to see its code.' },
};
const SQL_WORDS = /\b(SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|INNER|LEFT|RIGHT|ON|AS|ORDER|BY|GROUP|HAVING|LIMIT|WITH|CASE|WHEN|THEN|ELSE|END|NULL|IS|IN|EXISTS|COUNT|SUM|AVG|MIN|MAX|COALESCE|DISTINCT|BETWEEN|CREATE|TABLE|TRIGGER|FUNCTION|PROCEDURE|EVENT|VIEW|BEGIN|DECLARE|RETURN|RETURNS|IF|ELSEIF|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|CHECK|AFTER|BEFORE|FOR|EACH|ROW|NEW|OLD|SIGNAL|SQLSTATE|CALL|GRANT|REVOKE|ROLE|USER|TO|ON|SCHEDULE|EVERY|DO|OVER|PARTITION|INT|VARCHAR|DECIMAL|DATE|DATETIME|ENUM|BOOLEAN|TEXT|START|TRANSACTION|COMMIT|ROLLBACK|DETERMINISTIC|READS|DATA|INTERVAL|LAG|PERCENT_RANK|ROW_NUMBER|RANK|DENSE_RANK)\b/gi;

const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const JAVA_WORDS = /\b(package|import|public|private|protected|static|final|class|interface|enum|record|extends|implements|new|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|throws|this|super|void|int|long|double|float|boolean|char|byte|short|var|null|true|false|instanceof)\b/g;

// Colores mínimos para SQL o Java (el JSON dice cuál con "lang")
function highlight(code, java) {
  const pattern = java
    ? /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:[^"\\]|\\.)*")/g
    : /(--[^\n]*|'(?:[^'\\]|\\.)*')/g;
  const words = java ? JAVA_WORDS : SQL_WORDS;
  return code.split(pattern).map((part, index) => {
    const safe = escapeHtml(part);
    if (index % 2) return `<span class="${/^(--|\/\/|\/\*)/.test(part) ? 'code__com' : 'code__str'}">${safe}</span>`;
    return safe.replace(words, '<span class="code__kw">$&</span>').replace(/\b\d+(\.\d+)?\b/g, '<span class="code__num">$&</span>');
  }).join('');
}

export async function mount(root) {
  const data = await fetch(root.dataset.sql).then((response) => response.json());
  root.innerHTML = `
    <div class="n8n__bar"><div class="n8n__tabs" role="tablist"></div></div>
    <div class="sqlv__body">
      <ul class="sqlv__list" aria-label="Objetos"></ul>
      <div class="sqlv__detail" aria-live="polite"></div>
    </div>`;
  const tabs = root.querySelector('.n8n__tabs');
  const list = root.querySelector('.sqlv__list');
  const detail = root.querySelector('.sqlv__detail');
  let group = data.groups[0];
  let selected = 0;

  function show(index) {
    selected = index;
    const item = group.items[index];
    list.querySelectorAll('.sqlv__item').forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
    const file = item.file ? `<p class="n8n__meta">${TEXT.file[lang()]}: ${escapeHtml(item.file)}</p>` : '';
    const note = item.note ? `<p class="sqlv__note">${escapeHtml(item.note)}</p>` : '';
    detail.innerHTML = `<p class="n8n__name">${escapeHtml(item.name)}</p>${file}${note}<pre class="code n8n__code"><code>${highlight(item.sql, data.lang === 'java')}</code></pre>`;
  }

  function open(nextGroup) {
    group = nextGroup;
    tabs.querySelectorAll('.n8n__tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.group === group.id)));
    list.replaceChildren(...group.items.map((item, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sqlv__item';
      button.textContent = item.name;
      button.addEventListener('click', () => show(index));
      li.append(button);
      return li;
    }));
    show(0);
  }

  function labelTabs() {
    tabs.querySelectorAll('.n8n__tab').forEach((tab) => {
      const g = data.groups.find((item) => item.id === tab.dataset.group);
      tab.textContent = `${lang() === 'en' ? g.label_en : g.label_es} · ${g.items.length}`;
    });
  }

  data.groups.forEach((g) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'n8n__tab';
    tab.setAttribute('role', 'tab');
    tab.dataset.group = g.id;
    tab.addEventListener('click', () => open(g));
    tabs.append(tab);
  });
  labelTabs();
  new MutationObserver(() => {
    labelTabs();
    show(selected);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  open(group);
}
