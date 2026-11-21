"""Exporta los workflows de n8n de Campus OPS a un JSON liviano para el visor del portafolio.

Toma la carpeta backend/workflows del repositorio de Campus OPS y guarda, por
workflow, sus nodos (nombre, tipo, posición y lo que hace: código, SQL, ruta del
webhook…), sus notas y sus conexiones. Nunca copia credenciales: n8n solo guarda
una referencia a ellas, y aquí se descarta.

Uso (Campus OPS; para otro proyecto, pasa el archivo del workflow y el nombre de salida):
    py -3.12 tools/export_workflows.py "ruta/a/gestionSalonesHackaton/backend/workflows"
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "proyectos" / "datos" / "campus-ops-workflows.json"

# Orden en el que se muestran, del flujo principal a los de apoyo
ORDER = [
    "m3-incidencias", "ia-triaje-incidencias", "ia-cliente", "ia-efectos-incidencias",
    "m1-espacios-reservas", "m2-recursos-prestamos", "panel-salud-historial", "datos-importacion",
]
MAX_LINES = 60  # el código muy largo se recorta en el visor


def short(node_type):
    return node_type.split(".")[-1]


def clip(text):
    lines = str(text).strip().splitlines()
    if len(lines) > MAX_LINES:
        lines = lines[:MAX_LINES] + [f"… ({len(lines) - MAX_LINES} líneas más)"]
    return "\n".join(lines)


def detail(node):
    """Lo más útil de cada nodo para mostrar en el visor (nunca credenciales)."""
    kind, p = short(node["type"]), node.get("parameters", {})
    if kind == "code":
        return {"lang": "js", "text": clip(p.get("jsCode", ""))}
    if kind == "postgres":
        query = p.get("query") or p.get("table", {}).get("value") or p.get("operation", "")
        return {"lang": "sql", "text": clip(query)}
    if kind == "webhook":
        return {"lang": "txt", "text": f'{p.get("httpMethod", "GET")} /webhook/{p.get("path", "")}'}
    if kind == "respondToWebhook":
        code = p.get("options", {}).get("responseCode", 200)
        return {"lang": "txt", "text": f"Responde con HTTP {code}"}
    if kind in ("executeWorkflow", "executeWorkflowTrigger"):
        return {"lang": "txt", "text": "Llama a otro workflow" if kind == "executeWorkflow" else "Lo llaman otros workflows"}
    if kind == "httpRequest":
        return {"lang": "txt", "text": f'{p.get("method", "POST")} {p.get("url", "")}'}
    if kind == "if":
        return {"lang": "txt", "text": "Decide el camino según una condición"}
    return None


def export(source, out_name=None, display_name=None):
    source = Path(source)
    if source.is_file():
        files = [source]  # un solo workflow, como el de TalentFlow AI
    elif all((source / f"{stem}.json").exists() for stem in ORDER):
        files = [source / f"{stem}.json" for stem in ORDER]
    else:
        files = sorted(source.glob("*.json"))
    out = OUT.with_name(out_name) if out_name else OUT
    workflows = []
    for path in files:
        stem = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        nodes, notes = [], []
        for node in data["nodes"]:
            x, y = node.get("position", [0, 0])
            if short(node["type"]) == "stickyNote":
                p = node.get("parameters", {})
                notes.append({"x": x, "y": y, "w": p.get("width", 240), "h": p.get("height", 160), "text": clip(p.get("content", ""))})
                continue
            entry = {"name": node["name"], "kind": short(node["type"]), "x": x, "y": y}
            info = detail(node)
            if info and info["text"]:
                entry["detail"] = info
            nodes.append(entry)
        links = []
        for source, outputs in data.get("connections", {}).items():
            for branch in outputs.get("main", []) or []:
                for target in branch or []:
                    links.append([source, target["node"]])
        workflows.append({"id": stem, "name": display_name or data["name"], "nodes": nodes, "notes": notes, "links": links})
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"workflows": workflows}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    total = sum(len(w["nodes"]) for w in workflows)
    print(f"ok {out.name}: {len(workflows)} workflows, {total} nodos, {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    # export_workflows.py <carpeta o archivo de workflow> [nombre del JSON de salida] [nombre visible del workflow]
    export(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None, sys.argv[3] if len(sys.argv) > 3 else None)
