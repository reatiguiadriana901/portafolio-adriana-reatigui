"""Figuras en SVG para las páginas de proyecto (las usa tools/build_cases.py).

Cada figura sale de una especificación en el JSON del proyecto y se inserta en
línea en el HTML: así toma los colores de la paleta activa (clases de
css/case.css) y sus textos cambian de idioma como el resto de la página (cada
texto va dos veces, con lang="es" y lang="en").

Tipos:
  flow    diagrama de cajas y flechas (arquitectura, procesos, esquemas)
  rose    media rosa de orientaciones axiales (0° a 180°), con media y SHmax
  funnel  embudo de depuración, de la cantidad mayor a la menor
  donut   anillo con una proporción, p. ej. 15 de 19
"""

import math
from html import escape
from itertools import count

_ids = count(1)


def esc(text):
    return escape(str(text), quote=True)


def text(x, y, es, en, cls, anchor="start", extra=""):
    """Un texto en los dos idiomas; si es igual, va una sola vez."""
    base = f'x="{x:.1f}" y="{y:.1f}" class="{cls}" text-anchor="{anchor}"{extra}'
    if es == en:
        return f"<text {base}>{esc(es)}</text>"
    return f'<text {base} lang="es">{esc(es)}</text><text {base} lang="en">{esc(en)}</text>'


def svg(width, height, body, title_es, title_en):
    """El SVG es decorativo para el lector de pantalla: el pie de figura (figcaption) lo describe."""
    uid = next(_ids)
    return (
        f'<svg class="fig" viewBox="0 0 {width} {height}" aria-hidden="true" focusable="false" data-title="{esc(title_es)}">'
        f'<defs><marker id="arrow{uid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0 0L10 5L0 10z" class="fig-arrow"/></marker></defs>'
        f"{body.replace('ARROW', f'arrow{uid}')}</svg>"
    )


# ---------- Diagrama de cajas y flechas ----------

def flow(spec):
    nodes = {node["id"]: node for node in spec["nodes"]}
    body = ""
    for group in spec.get("groups", []):
        body += (
            f'<rect x="{group["x"]}" y="{group["y"]}" width="{group["w"]}" height="{group["h"]}" rx="18" class="fig-group"/>'
            + text(group["x"] + 16, group["y"] + 22, group["es"], group["en"], "fig-tag")
        )
    labels = ""
    for edge in spec.get("edges", []):
        path, label = _edge(nodes[edge["from"]], nodes[edge["to"]], edge)
        body += path
        labels += label
    for node in spec["nodes"]:
        body += _node(node)
    # Las etiquetas de las flechas van encima de todo, con un borde del color del fondo
    return svg(spec["width"], spec["height"], body + labels, spec["title_es"], spec["title_en"])


def _node(node):
    kind = node.get("kind", "")
    x, y, w, h = node["x"], node["y"], node["w"], node["h"]
    dark = kind == "dark"
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" class="fig-node fig-node--{kind or "plain"}"/>'
    cx = x + w / 2
    lines = []
    if node.get("tag_es"):
        lines.append(("fig-tag" + (" fig-on-dark" if dark else ""), node["tag_es"], node["tag_en"], 11))
    lines.append(("fig-title" + (" fig-on-dark" if dark else ""), node["es"], node["en"], 16))
    if node.get("sub_es"):
        lines.append(("fig-sub" + (" fig-on-dark-muted" if dark else ""), node["sub_es"], node["sub_en"], 13))
    gap = 6
    total = sum(size for *_, size in lines) + gap * (len(lines) - 1)
    cursor = y + (h - total) / 2
    for cls, es, en, size in lines:
        cursor += size
        out += text(cx, cursor - 2, es, en, cls, "middle")
        cursor += gap
    return out


def _anchor(node, side):
    x, y, w, h = node["x"], node["y"], node["w"], node["h"]
    return {
        "right": (x + w, y + h / 2),
        "left": (x, y + h / 2),
        "top": (x + w / 2, y),
        "bottom": (x + w / 2, y + h),
    }[side]


def _edge(a, b, edge):
    ax, ay = a["x"] + a["w"] / 2, a["y"] + a["h"] / 2
    bx, by = b["x"] + b["w"] / 2, b["y"] + b["h"] / 2
    horizontal = abs(bx - ax) >= abs(by - ay)
    if horizontal:
        start, end = (_anchor(a, "right"), _anchor(b, "left")) if bx > ax else (_anchor(a, "left"), _anchor(b, "right"))
        mid = (start[0] + end[0]) / 2
        d = f"M{start[0]:.1f} {start[1]:.1f}C{mid:.1f} {start[1]:.1f} {mid:.1f} {end[1]:.1f} {end[0]:.1f} {end[1]:.1f}"
    else:
        start, end = (_anchor(a, "bottom"), _anchor(b, "top")) if by > ay else (_anchor(a, "top"), _anchor(b, "bottom"))
        mid = (start[1] + end[1]) / 2
        d = f"M{start[0]:.1f} {start[1]:.1f}C{start[0]:.1f} {mid:.1f} {end[0]:.1f} {mid:.1f} {end[0]:.1f} {end[1]:.1f}"
    cls = "fig-edge" + (" fig-edge--accent" if edge.get("accent") else "") + (" fig-edge--dashed" if edge.get("dashed") else "")
    both = ' marker-start="url(#ARROW)"' if edge.get("both") else ""
    path = f'<path d="{d}" class="{cls}" marker-end="url(#ARROW)"{both}/>'
    label = ""
    if edge.get("es"):
        lx = (start[0] + end[0]) / 2 + edge.get("dx", 0)
        ly = (start[1] + end[1]) / 2 + edge.get("dy", -8)
        label = text(lx, ly, edge["es"], edge["en"], "fig-edge-label", "middle")
    return path, label


# ---------- Media rosa de orientaciones (datos axiales) ----------

def rose(spec):
    width, height = 560, 600
    cx, cy, radius = 70, 300, 250
    counts = spec["counts"]
    step = 180 / len(counts)
    top = max(counts)

    def point(azimuth, r):
        rad = math.radians(azimuth)
        return cx + r * math.sin(rad), cy - r * math.cos(rad)

    def arc(r, start=0, end=180):
        x1, y1 = point(start, r)
        x2, y2 = point(end, r)
        large = 1 if end - start > 180 else 0
        return f"M{x1:.1f} {y1:.1f}A{r:.1f} {r:.1f} 0 {large} 1 {x2:.1f} {y2:.1f}"

    def sector(start, end, r):
        return f"M{cx} {cy}L{point(start, r)[0]:.1f} {point(start, r)[1]:.1f}" + arc(r, start, end)[arc(r, start, end).index("A"):] + "Z"

    body = ""
    # Banda del SHmax
    shmax = spec.get("shmax")
    if shmax:
        lo, hi = shmax["azimuth"] - shmax["spread"], shmax["azimuth"] + shmax["spread"]
        body += f'<path d="{sector(lo, hi, radius + 18)}" class="fig-band"/>'
    # Anillos de conteo (área proporcional: el radio crece con la raíz)
    for ring in spec.get("rings", []):
        r = radius * math.sqrt(ring / top)
        body += f'<path d="{arc(r)}" class="fig-grid"/>'
        lx, ly = point(0, r)
        body += f'<text x="{lx - 8:.1f}" y="{ly + 4:.1f}" class="fig-tick" text-anchor="end">{ring}</text>'
    # Rumbos cada 30°
    for azimuth in range(0, 181, 30):
        x1, y1 = point(azimuth, 0)
        x2, y2 = point(azimuth, radius + 4)
        body += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="fig-grid"/>'
        tx, ty = point(azimuth, radius + 30)
        body += f'<text x="{tx:.1f}" y="{ty + 4:.1f}" class="fig-tick" text-anchor="middle">{azimuth}°</text>'
    # Pétalos
    for index, value in enumerate(counts):
        if not value:
            continue
        r = radius * math.sqrt(value / top)
        start, end = index * step, (index + 1) * step
        body += f'<path d="{sector(start, end, r)}" class="fig-petal"/>'
        mx, my = point((start + end) / 2, r + 16)
        body += f'<text x="{mx:.1f}" y="{my + 4:.1f}" class="fig-value" text-anchor="middle">{value}</text>'
    # Media axial
    mean = spec.get("mean")
    if mean:
        x2, y2 = point(mean["azimuth"], radius + 40)
        body += f'<line x1="{cx}" y1="{cy}" x2="{x2:.1f}" y2="{y2:.1f}" class="fig-mean"/>'
        tx, ty = point(mean["azimuth"], radius + 58)
        body += text(tx, ty, mean["es"], mean["en"], "fig-label-strong", "middle")
    if shmax:
        tx, ty = point(shmax["azimuth"] + shmax["spread"] + 9, radius + 54)
        body += text(tx, ty, shmax["es"], shmax["en"], "fig-label", "middle")
    # Ejes
    body += f'<line x1="{cx}" y1="{cy - radius - 8}" x2="{cx}" y2="{cy + radius + 8}" class="fig-axis"/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="4" class="fig-center"/>'
    return svg(width, height, body, spec["title_es"], spec["title_en"])


# ---------- Embudo ----------

def funnel(spec):
    stages = spec["stages"]
    width = 760
    row, gap, top_pad = 52, 14, 10
    height = top_pad * 2 + len(stages) * row + (len(stages) - 1) * gap
    left, right = 250, width - 20
    span = right - left
    biggest = max(stage["value"] for stage in stages)

    def bar_width(value):
        # Raíz cuadrada: así las etapas pequeñas se siguen viendo
        return max(span * math.sqrt(value / biggest), 46)

    body = ""
    previous = None
    for index, stage in enumerate(stages):
        y = top_pad + index * (row + gap)
        w = bar_width(stage["value"])
        x = left + (span - w) / 2
        if previous:
            px, pw, py = previous
            body += (
                f'<path d="M{px:.1f} {py + row:.1f}L{px + pw:.1f} {py + row:.1f}L{x + w:.1f} {y:.1f}L{x:.1f} {y:.1f}Z" class="fig-funnel-neck"/>'
            )
        body += f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="{row}" rx="10" class="fig-funnel{" fig-funnel--last" if index == len(stages) - 1 else ""}"/>'
        body += f'<text x="{left + span / 2:.1f}" y="{y + row / 2 + 6:.1f}" class="fig-funnel-value" text-anchor="middle">{esc(stage["value"])}</text>'
        body += text(left - 18, y + row / 2 - 2, stage["es"], stage["en"], "fig-label-strong", "end")
        if stage.get("sub_es"):
            body += text(left - 18, y + row / 2 + 16, stage["sub_es"], stage["sub_en"], "fig-sub", "end")
        previous = (x, w, y)
    return svg(width, height, body, spec["title_es"], spec["title_en"])


# ---------- Anillo ----------

def donut(spec):
    size = 300
    cx = cy = size / 2
    r, stroke = 112, 34
    share = spec["value"] / spec["total"]
    circumference = 2 * math.pi * r
    body = (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" class="fig-donut-rest" stroke-width="{stroke}"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" class="fig-donut-value" stroke-width="{stroke}" '
        f'stroke-dasharray="{circumference * share:.1f} {circumference:.1f}" transform="rotate(-90 {cx} {cy})"/>'
        + text(cx, cy + 6, spec["big_es"], spec["big_en"], "fig-donut-big", "middle")
        + text(cx, cy + 36, spec["es"], spec["en"], "fig-sub", "middle")
    )
    return svg(size, size, body, spec["title_es"], spec["title_en"])


RENDERERS = {"flow": flow, "rose": rose, "funnel": funnel, "donut": donut}


def render(spec):
    return RENDERERS[spec["type"]](spec)
