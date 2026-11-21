"""Genera las páginas de cada proyecto (proyectos/<slug>.html) a partir de tools/cases/*.json.

Cada JSON trae el texto en español (es) y en inglés (en): resumen, cifras, contexto,
rol, pasos, resultados y figuras de barras, más el stack, el equipo, los enlaces y
las imágenes. La página lleva los dos idiomas y js/case.js muestra uno.

Uso, desde la carpeta del proyecto:
    py -3.12 tools/build_cases.py
"""

import json
import re
from html import escape
from pathlib import Path

from figures import render

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / "tools" / "cases"
OUT = ROOT / "proyectos"

FONTS = (
    "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700"
    "&amp;family=Fira+Code:wght@400..500"
    "&amp;family=Fraunces:ital,opsz,wght@0,9..144,500..700;1,9..144,500&amp;display=swap"
)

# Títulos de sección por defecto; cada caso puede cambiarlos con "titles"
TITLES = {
    "context": {"es": "Contexto", "en": "Context"},
    "role": {"es": "Mi rol", "en": "My role"},
    "steps": {"es": "Cómo funciona", "en": "How it works"},
    "figures": {"es": "Datos", "en": "Data"},
    "results": {"es": "Resultados", "en": "Results"},
    "images": {"es": "Capturas", "en": "Screenshots"},
    "facts": {"es": "Ficha técnica", "en": "Project details"},
    "visuals": {"es": "Cómo funciona", "en": "How it works"},
    "highlights": {"es": "Lo más destacado", "en": "Highlights"},
    "blocks": {"es": "Lo que hice", "en": "What I did"},
    "code": {"es": "Con Python", "en": "With Python"},
}


def esc(text):
    return escape(str(text), quote=True)


def bi(es, en, tag="span", cls=""):
    """El mismo texto en los dos idiomas; si es igual, va una sola vez."""
    attr = f' class="{cls}"' if cls else ""
    if es == en:
        return f"<{tag}{attr}>{esc(es)}</{tag}>"
    return f'<{tag}{attr} lang="es">{esc(es)}</{tag}><{tag}{attr} lang="en">{esc(en)}</{tag}>'


def inline(es, en):
    """Texto dentro de otro elemento (título, botón)."""
    if es == en:
        return esc(es)
    return f'<span lang="es">{esc(es)}</span><span lang="en">{esc(en)}</span>'


def section(key, case, body):
    titles = {**TITLES, **case.get("titles", {})}
    title = titles[key]
    return (
        f'      <section class="case-section" aria-labelledby="{key}">\n'
        f'        <h2 class="case-section__title" id="{key}">{inline(title["es"], title["en"])}</h2>\n'
        f"{body}"
        f"      </section>\n"
    )


def paragraphs(case, field):
    out = ""
    for lang in ("es", "en"):
        items = "".join(f"<p>{esc(text)}</p>" for text in case[lang][field])
        out += f'        <div lang="{lang}">{items}</div>\n'
    return out


def bullet_list(case, field):
    out = ""
    for lang in ("es", "en"):
        items = "".join(f"<li>{esc(text)}</li>" for text in case[lang][field])
        out += f'        <ul class="case-list" lang="{lang}">{items}</ul>\n'
    return out


def stats(case):
    if not case["es"]["stats"]:
        return ""
    items = ""
    for es, en in zip(case["es"]["stats"], case["en"]["stats"]):
        items += (
            '        <li class="case-stat">'
            f'{bi(es["value"], en["value"], "span", "case-stat__value")}'
            f'{bi(es["label"], en["label"], "span", "case-stat__label")}'
            "</li>\n"
        )
    return f'      <ul class="case-stats">\n{items}      </ul>\n'


def steps(case):
    items = ""
    for es, en in zip(case["es"]["steps"], case["en"]["steps"]):
        items += (
            '          <li class="case-step">'
            f'<h3 class="case-step__title">{inline(es["title"], en["title"])}</h3>'
            f'{bi(es["text"], en["text"], "p")}'
            "</li>\n"
        )
    return f'        <ol class="case-steps">\n{items}        </ol>\n'


def figures(case):
    out = ""
    for fig_es, fig_en in zip(case["es"].get("figures", []), case["en"].get("figures", [])):
        top = max(bar["value"] for bar in fig_es["bars"]) or 1
        bars = ""
        for es, en in zip(fig_es["bars"], fig_en["bars"]):
            share = round(es["value"] / top * 100, 1)
            bars += (
                '            <li class="case-bar">'
                f'{bi(es["label"], en["label"], "span", "case-bar__label")}'
                '<span class="case-bar__track">'
                f'<span class="case-bar__rail"><span class="case-bar__fill" style="--share: {share}%"></span></span>'
                f'{bi(es["note"], en["note"], "span", "case-bar__value")}'
                "</span></li>\n"
            )
        note = ""
        if fig_es.get("note"):
            note = f'          {bi(fig_es["note"], fig_en["note"], "p", "case-figure__note")}\n'
        out += (
            '        <figure class="case-figure">\n'
            f'          <figcaption class="case-figure__title">{inline(fig_es["title"], fig_en["title"])}</figcaption>\n'
            f'          <ul class="case-bars">\n{bars}          </ul>\n'
            f"{note}"
            "        </figure>\n"
        )
    return out


def gallery(case):
    shots = ""
    for image in case["images"]:
        url = esc(image["url"])
        shots += (
            '          <figure class="case-shot">'
            f'<a href="{url}" target="_blank" rel="noopener">'
            f'<img src="{url}" alt="{esc(image["alt_es"])}" data-alt-es="{esc(image["alt_es"])}" '
            f'data-alt-en="{esc(image["alt_en"])}" loading="lazy" decoding="async"></a>'
            f'<figcaption>{inline(image["caption_es"], image["caption_en"])}</figcaption>'
            "</figure>\n"
        )
    credit = ""
    if case.get("imagesCredit"):
        credit = f'        {bi(case["imagesCredit"]["es"], case["imagesCredit"]["en"], "p", "case-figure__note")}\n'
    return f'        <div class="case-gallery">\n{shots}        </div>\n{credit}'


def chip(item):
    """Una tecnología o un tema: texto, o {"es", "en"} si cambia con el idioma."""
    text = inline(item["es"], item["en"]) if isinstance(item, dict) else esc(item)
    return f'<li class="chip">{text}</li>'


def facts(case):
    rows = ""
    chips = "".join(chip(item) for item in case["stack"])
    label = case.get("stackLabel", {"es": "Tecnologías", "en": "Technologies"})
    rows += f'          <div><dt>{inline(label["es"], label["en"])}</dt><dd><ul class="chips">{chips}</ul></dd></div>\n'
    if case["team"]:
        people = ", ".join(
            f'<a href="{esc(person["url"])}" target="_blank" rel="noopener">{esc(person["name"])}</a>'
            if person.get("url") else esc(person["name"])
            for person in case["team"]
        )
        rows += f'          <div><dt>{inline("Equipo", "Team")}</dt><dd>{people}</dd></div>\n'
    if case["links"]:
        links = "".join(
            f'<a class="button button--ghost" href="{esc(link["url"])}" target="_blank" rel="noopener">'
            f'{inline(link["label_es"], link["label_en"])} <span aria-hidden="true">↗</span></a>'
            for link in case["links"]
        )
        rows += f'          <div><dt>{inline("Enlaces", "Links")}</dt><dd class="case-links">{links}</dd></div>\n'
    if case.get("note"):
        rows += f'          <div><dt>{inline("Nota", "Note")}</dt><dd>{bi(case["note"]["es"], case["note"]["en"], "span")}</dd></div>\n'
    return f'        <dl class="case-facts">\n{rows}        </dl>\n'


def pager(previous, following):
    def link(case, kind):
        hint = {"prev": ("← Anterior", "← Previous"), "next": ("Siguiente →", "Next →")}[kind]
        return (
            f'        <a class="case-pager__link case-pager__link--{kind}" href="{esc(case["slug"])}.html">'
            f'<span class="case-pager__hint">{inline(*hint)}</span>'
            f'<span class="case-pager__name">{inline(case["es"]["title"], case["en"]["title"])}</span></a>\n'
        )

    items = ""
    if previous:
        items += link(previous, "prev")
    if following:
        items += link(following, "next")
    label = 'aria-label="Otros proyectos"'
    return f'      <nav class="case-pager" {label}>\n{items}      </nav>\n' if items else ""


# ---------- Versión visual: poco texto, figuras grandes ----------

def visual_item(item):
    """Una figura de la página: SVG generado, imagen o barras, con su pie."""
    if "figure" in item:
        figure = item["figure"]
        content = render(figure)
        scroll = " case-visual__scroll" if figure["type"] == "flow" else ""
        # Ancho máximo de cada tipo de figura, para que no crezca de más en pantallas grandes
        widest = figure.get("maxWidth") or {"rose": 560, "donut": 300, "funnel": 860}.get(figure["type"])
        style = f' style="--fig-max: {widest}px"' if widest else ""
        inner = f'<div class="case-visual__art{scroll}"{style}>{content}</div>'
    elif "image" in item:
        image = item["image"]
        url = esc(image["src"])
        inner = (
            f'<a class="case-visual__art" href="{url}" target="_blank" rel="noopener">'
            f'<img src="{url}" alt="{esc(image["alt_es"])}" data-alt-es="{esc(image["alt_es"])}" '
            f'data-alt-en="{esc(image["alt_en"])}" loading="lazy" decoding="async"></a>'
        )
    else:
        spec = item["bars"]
        top = max(bar["value"] for bar in spec["bars"]) or 1
        rows = "".join(
            '<li class="case-bar">'
            f'{bi(bar["label_es"], bar["label_en"], "span", "case-bar__label")}'
            '<span class="case-bar__track">'
            f'<span class="case-bar__rail"><span class="case-bar__fill" style="--share: {round(bar["value"] / top * 100, 1)}%"></span></span>'
            f'{bi(bar["note_es"], bar["note_en"], "span", "case-bar__value")}'
            "</span></li>"
            for bar in spec["bars"]
        )
        inner = f'<div class="case-visual__art"><ul class="case-bars">{rows}</ul></div>'
    size = item.get("size", "wide")
    caption = f'<figcaption>{inline(item["caption_es"], item["caption_en"])}</figcaption>'
    return f'        <figure class="case-visual case-visual--{size}">{inner}{caption}</figure>\n'


def visual_header(case):
    es, en = case["es"], case["en"]
    actions = "".join(
        f'<a class="button {"button--primary" if index == 0 else "button--ghost"}" href="{esc(link["url"])}" target="_blank" rel="noopener">'
        f'{inline(link["label_es"], link["label_en"])} <span aria-hidden="true">↗</span></a>'
        for index, link in enumerate(case["links"])
    )
    actions = f'<div class="case-actions">{actions}</div>' if actions else ""
    chips = "".join(chip(item) for item in case["stack"][:5])
    stacked = " case-hero2--stacked" if case["hero"].get("figure", {}).get("type") == "flow" else ""
    return f"""      <header class="case-hero2{stacked}">
        <div class="case-hero2__text">
          <span class="case-hero__id"><span class="case-hero2__core" data-litho="{esc(case["litho"])}" aria-hidden="true"></span>{inline("Núcleo " + case["core"], "Core " + case["core"])}</span>
          {bi(es["eyebrow"], en["eyebrow"], "p", "case-hero__eyebrow")}
          <h1 class="case-hero2__title">{inline(es["title"], en["title"])}</h1>
          {bi(es["tagline"], en["tagline"], "p", "case-hero2__tagline")}
          {actions}
          <ul class="chips">{chips}</ul>
        </div>
{visual_item(case["hero"])}      </header>
"""


def visual_body(case):
    es, en = case["es"], case["en"]
    stats_html = "".join(
        f'<li class="case-band__item">{bi(a["value"], b["value"], "span", "case-band__value")}'
        f'{bi(a["label"], b["label"], "span", "case-band__label")}</li>'
        for a, b in zip(es["stats"], en["stats"])
    )
    body = f'      <ul class="case-band theme-dark">{stats_html}</ul>\n'
    body += (
        '      <div class="case-duo">\n'
        f'        <article class="case-card"><p class="case-card__label">{inline("El reto", "The challenge")}</p>{bi(es["challenge"], en["challenge"], "p")}</article>\n'
        f'        <article class="case-card case-card--accent"><p class="case-card__label">{inline("La solución", "The solution")}</p>{bi(es["solution"], en["solution"], "p")}</article>\n'
        "      </div>\n"
    )
    if case.get("visuals"):
        items = "".join(visual_item(item) for item in case["visuals"])
        body += section("visuals", case, f'        <div class="case-visuals">\n{items}        </div>\n')
    highlights = "".join(
        f'<li class="case-highlight"><span class="case-highlight__n" aria-hidden="true">{index:02d}</span>'
        f'<h3 class="case-highlight__title">{inline(a["title"], b["title"])}</h3>{bi(a["text"], b["text"], "p")}</li>'
        for index, (a, b) in enumerate(zip(es["highlights"], en["highlights"]), start=1)
    )
    body += section("highlights", case, f'        <ul class="case-highlights">{highlights}</ul>\n')
    body += section("facts", case, facts(case))
    return body


# ---------- Versión "vitrina": figuras y capturas reales, paso a paso ----------

PY_TOKENS = re.compile(
    r'(?P<str>"""[\s\S]*?"""|"[^"\n]*"|\'[^\'\n]*\')'
    r"|(?P<com>#[^\n]*)"
    r"|(?P<kw>\b(?:def|return|import|from|as|if|else|for|in|is|None|not|and|or|lambda)\b)"
    r"|(?P<num>\b\d+(?:\.\d+)?\b)"
    r"|(?P<name>\b[A-Za-z_]\w*\b)"
)


def highlight_python(code):
    """Colores mínimos para un fragmento de Python (css/case.css, .code)."""
    out, after_def = [], False
    position = 0
    for match in PY_TOKENS.finditer(code):
        out.append(esc(code[position:match.start()]))
        kind, value = match.lastgroup, match.group()
        if kind == "name":
            out.append(f'<span class="code__fn">{esc(value)}</span>' if after_def else esc(value))
            after_def = False
        else:
            cls = {"str": "code__str", "com": "code__com", "kw": "code__kw", "num": "code__num"}[kind]
            out.append(f'<span class="{cls}">{esc(value)}</span>')
            after_def = value == "def"
        position = match.end()
    out.append(esc(code[position:]))
    return "".join(out)


def media_html(media):
    caption = f'<figcaption>{inline(media["caption_es"], media["caption_en"])}</figcaption>'
    if "workflows" in media:
        fallback = inline("Activa JavaScript para explorar los workflows.", "Turn on JavaScript to explore the workflows.")
        inner = f'<div class="n8n" data-n8n="{esc(media["workflows"])}"><p class="n8n__fallback">{fallback}</p></div>'
        return f'<figure class="show-media show-media--app">{inner}{caption}</figure>'
    if "sql" in media or "code" in media:
        # El mismo visor sirve para SQL y para Java (el JSON trae "lang")
        fallback = inline("Activa JavaScript para explorar el código.", "Turn on JavaScript to explore the code.")
        src = media.get("sql") or media["code"]
        inner = f'<div class="sqlv" data-sql="{esc(src)}"><p class="n8n__fallback">{fallback}</p></div>'
        return f'<figure class="show-media show-media--app">{inner}{caption}</figure>'
    if "demo" in media:
        src = esc(media["demo"])
        title = esc(media.get("title", "Demo"))
        inner = f'<div class="show-demo"><iframe src="{src}" title="{title}" loading="lazy"></iframe></div>'
        return f'<figure class="show-media show-media--app">{inner}{caption}</figure>'
    if "video" in media:
        src = esc(media["video"])
        inner = f'<video class="show-media__video" src="{src}" controls preload="metadata" playsinline></video>'
    else:
        src = esc(media["src"])
        # "full": una versión más grande, la que se abre al tocar la imagen
        href = esc(media.get("full", media["src"]))
        inner = (
            f'<a href="{href}" target="_blank" rel="noopener">'
            f'<img src="{src}" alt="{esc(media["alt_es"])}" data-alt-es="{esc(media["alt_es"])}" '
            f'data-alt-en="{esc(media["alt_en"])}" loading="lazy" decoding="async"></a>'
        )
    # "portrait": imágenes verticales (un póster) más angostas, para que no ocupen varias pantallas
    portrait = " show-media--portrait" if media.get("portrait") else ""
    return f'<figure class="show-media{portrait}">{inner}{caption}</figure>'


def showcase_header(case):
    es, en = case["es"], case["en"]
    return f"""      <header class="show-hero">
        <span class="case-hero__id"><span class="case-hero2__core" data-litho="{esc(case["litho"])}" aria-hidden="true"></span>{inline("Núcleo " + case["core"], "Core " + case["core"])}</span>
        {bi(es["eyebrow"], en["eyebrow"], "p", "case-hero__eyebrow")}
        <h1 class="show-hero__title">{inline(es["title"], en["title"])}</h1>
        {bi(es["subtitle"], en["subtitle"], "p", "show-hero__subtitle")}
        {bi(es["intro"], en["intro"], "p", "show-hero__intro")}
      </header>
      {media_html(case["hero"])}
"""


def showcase_body(case):
    es, en = case["es"], case["en"]
    body = stats(case)
    blocks = ""
    for index, (a, b) in enumerate(zip(es.get("blocks", []), en.get("blocks", []))):
        media = case["blocks"][index]
        side = " show-block--flip" if index % 2 else ""
        blocks += (
            f'        <article class="show-block{side}">'
            f'<div class="show-block__text"><span class="show-block__step">{inline(a["step"], b["step"])}</span>'
            f'<h3 class="show-block__title">{inline(a["title"], b["title"])}</h3>{bi(a["text"], b["text"], "p")}</div>'
            f"{media_html(media)}</article>\n"
        )
    if blocks:
        body += section("blocks", case, blocks)
    code = case.get("code")
    if code:
        snippet = f'<pre class="code" tabindex="0"><code>{highlight_python(code["source"])}</code></pre>'
        body += section(
            "code",
            case,
            f'        <div class="show-code"><div class="show-code__text">{bi(es["code"], en["code"], "p")}{snippet}</div>'
            f'{media_html(code["media"])}</div>\n',
        )
    results = "".join(f"<li>{esc(item)}</li>" for item in es["results"])
    results_en = "".join(f"<li>{esc(item)}</li>" for item in en["results"])
    body += section(
        "results",
        case,
        f'        <ul class="show-results" lang="es">{results}</ul><ul class="show-results" lang="en">{results_en}</ul>\n',
    )
    body += section("facts", case, facts(case))
    return body


def page(case, previous, following):
    es, en = case["es"], case["en"]
    if case.get("layout") == "showcase":
        return shell(case, showcase_header(case), showcase_body(case) + pager(previous, following), "case--showcase")
    if "tagline" in es:
        return shell(case, visual_header(case), visual_body(case) + pager(previous, following), "case--visual")
    header = f"""      <header class="case-hero">
        <span class="case-hero__core" data-litho="{esc(case["litho"])}" aria-hidden="true"></span>
        <div>
          <span class="case-hero__id">{inline("Núcleo " + case["core"], "Core " + case["core"])}</span>
          {bi(es["eyebrow"], en["eyebrow"], "p", "case-hero__eyebrow")}
          <h1 class="case-hero__title">{inline(es["title"], en["title"])}</h1>
          {bi(es["subtitle"], en["subtitle"], "p", "case-hero__subtitle")}
          {bi(es["summary"], en["summary"], "p", "case-hero__summary")}
        </div>
      </header>
"""
    body = stats(case)
    body += section("context", case, paragraphs(case, "context"))
    if es["role"]:
        body += section("role", case, bullet_list(case, "role"))
    if es["steps"]:
        body += section("steps", case, steps(case))
    if es.get("figures"):
        body += section("figures", case, figures(case))
    if es["results"]:
        body += section("results", case, bullet_list(case, "results"))
    if case["images"]:
        body += section("images", case, gallery(case))
    body += section("facts", case, facts(case))
    body += pager(previous, following)
    return shell(case, header, body, "")


def shell(case, header, body, modifier):
    """La página completa: cabecera, contenido y pie."""
    es, en = case["es"], case["en"]
    title_es = f'{es["title"]} · Adriana Reatigui'
    title_en = f'{en["title"]} · Adriana Reatigui'
    return f"""<!DOCTYPE html>
<!-- Generado por tools/build_cases.py a partir de tools/cases/{case["slug"]}.json: edita el JSON, no este archivo -->
<html lang="es" data-motion="on" data-title-es="{esc(title_es)}" data-title-en="{esc(title_en)}">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#2d3a47">
  <title>{esc(title_es)}</title>
  <meta name="description" content="{esc(es.get("tagline") or es.get("intro") or es["summary"])}">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{FONTS}">
  <link rel="stylesheet" href="../css/tokens.css">
  <link rel="stylesheet" href="../css/base.css">
  <link rel="stylesheet" href="../css/case.css">
  <script>
    // Idioma elegido en el portafolio, antes de pintar la página (js/case.js hace el resto)
    try {{
      if (/[?&]lang=en\\b/.test(location.search) || (!/[?&]lang=es\\b/.test(location.search) && localStorage.getItem('portafolio:idioma') === 'en')) document.documentElement.lang = 'en';
    }} catch (error) {{
      // Sin almacenamiento: queda en español
    }}
  </script>
  <script type="module" src="../js/case.js"></script>
</head>

<body>
  <a class="skip-link" href="#contenido">{inline("Saltar al contenido", "Skip to content")}</a>

  <header class="header case-header theme-dark">
    <div class="header__bar">
      <a class="case-back" href="../index.html#proyectos"><span aria-hidden="true">←</span> {inline("Volver a proyectos", "Back to projects")}</a>
      <a class="header__brand" href="../index.html">Adriana Reatigui</a>
      <button class="lang-toggle" type="button" aria-label="Ver la página en inglés">EN</button>
    </div>
  </header>

  <main class="case {modifier}" id="contenido">
    <div class="case__inner">
{header}
{body}    </div>
  </main>

  <footer class="footer theme-dark">
    <p class="footer__credits">Adriana Reatigui · {inline("Geóloga y desarrolladora de software", "Geologist and software developer")}</p>
  </footer>

  <!-- Fondo animado: corte geológico (fx/cross-section.js) -->
  <canvas class="cross-section" id="cross-section" aria-hidden="true"></canvas>
</body>

</html>
"""


def main():
    cases = sorted(
        (json.loads(path.read_text(encoding="utf-8")) for path in CASES.glob("*.json")),
        key=lambda case: case["order"],
    )
    # Un caso con "draft": true se genera para verlo en local, pero las demás páginas no lo enlazan
    published = [case for case in cases if not case.get("draft")]
    OUT.mkdir(exist_ok=True)
    for case in cases:
        sequence = cases if case.get("draft") else published
        index = next(i for i, item in enumerate(sequence) if item is case)
        previous = sequence[index - 1] if index > 0 else None
        following = sequence[index + 1] if index + 1 < len(sequence) else None
        target = OUT / f'{case["slug"]}.html'
        target.write_text(page(case, previous, following), encoding="utf-8", newline="\n")
        print("ok", target.relative_to(ROOT))


if __name__ == "__main__":
    main()
