"""Exporta el SQL real de un proyecto de bases de datos para el visor del portafolio.

Lee los .sql de un repositorio y separa cada objeto con su código: tablas,
consultas, funciones, procedimientos, triggers, eventos y seguridad (roles,
usuarios y permisos). Respeta los cambios de DELIMITER. Los INSERT de datos de
prueba se omiten. Las contraseñas de los usuarios de ejemplo se reemplazan por
asteriscos.

Uso:
    py -3.12 tools/export_sql.py "ruta/al/repositorio" salida.json
"""

import json
import re
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "proyectos" / "datos"
MAX_LINES = 120
GROUPS = [
    ("tablas", "Tablas", "Tables"),
    ("consultas", "Consultas", "Queries"),
    ("funciones", "Funciones", "Functions"),
    ("procedimientos", "Procedimientos", "Procedures"),
    ("triggers", "Triggers", "Triggers"),
    ("eventos", "Eventos", "Events"),
    ("vistas", "Vistas", "Views"),
    ("seguridad", "Seguridad", "Security"),
]
CREATE = re.compile(
    r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:DEFINER\s*=\s*\S+\s+)?"
    r"(TABLE|FUNCTION|PROCEDURE|TRIGGER|EVENT|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"]?([\w.]+)",
    re.I,
)
KIND = {"TABLE": "tablas", "FUNCTION": "funciones", "PROCEDURE": "procedimientos",
        "TRIGGER": "triggers", "EVENT": "eventos", "VIEW": "vistas"}
PASSWORD = re.compile(r"(IDENTIFIED\s+BY\s+)'[^']*'", re.I)


def statements(text):
    """Parte un archivo en sentencias, con el comentario que va justo antes de cada una."""
    delimiter, buffer, comments = ";", [], []
    for line in text.splitlines():
        stripped = line.strip()
        match = re.match(r"DELIMITER\s+(\S+)", stripped, re.I)
        if match:
            delimiter = match.group(1)
            continue
        if not buffer and (stripped.startswith("--") or stripped.startswith("#")):
            comments.append(stripped.lstrip("-# ").strip())
            continue
        if not buffer and not stripped:
            continue
        buffer.append(line.rstrip())
        if stripped.endswith(delimiter):
            body = "\n".join(buffer)
            body = body[: body.rstrip().rfind(delimiter)].rstrip() + (";" if delimiter != ";" else ";")
            yield [c for c in comments if c], body.strip()
            buffer, comments = [], []


def clip(code):
    lines = code.splitlines()
    if len(lines) > MAX_LINES:
        lines = lines[:MAX_LINES] + [f"-- … ({len(lines) - MAX_LINES} líneas más)"]
    return "\n".join(lines)


def export(repo, out_name):
    groups = {key: [] for key, *_ in GROUPS}
    security = []
    for path in sorted(Path(repo).rglob("*.sql")):
        if ".git" in path.parts:
            continue
        for comments, sql in statements(path.read_text(encoding="utf-8", errors="replace")):
            note = next((c for c in reversed(comments) if len(c) > 3 and not set(c) <= set("=-*")), "")
            match = CREATE.match(sql)
            if match:
                groups[KIND[match.group(1).upper()]].append({"name": match.group(2), "note": note, "sql": clip(sql), "file": path.name})
            elif re.match(r"^\s*(SELECT|WITH)\b", sql, re.I):
                title = note or f"Consulta {len(groups['consultas']) + 1}"
                groups["consultas"].append({"name": title, "note": "", "sql": clip(sql), "file": path.name})
            elif re.match(r"^\s*(CREATE\s+(ROLE|USER)|GRANT|REVOKE)\b", sql, re.I):
                security.append(PASSWORD.sub(r"\1'********'", sql))
    if security:
        groups["seguridad"].append({"name": "Roles, usuarios y permisos", "note": "", "sql": clip("\n".join(security)), "file": ""})
    data = {"groups": [
        {"id": key, "label_es": es, "label_en": en, "items": groups[key]}
        for key, es, en in GROUPS if groups[key]
    ]}
    out = OUT_DIR / out_name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    summary = ", ".join(f'{g["label_es"]} {len(g["items"])}' for g in data["groups"])
    print(f"ok {out.name}: {summary} · {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    export(sys.argv[1], sys.argv[2])
