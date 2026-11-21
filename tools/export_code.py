"""Exporta el código Java real de un proyecto para el visor del portafolio (js/sql-viewer.js).

Agrupa los archivos .java por la primera carpeta que hay debajo de `base` (un
módulo o un ejercicio) y guarda el código de cada clase, recortado si es muy largo.
No incluye las pruebas (src/test).

Uso:
    py -3.12 tools/export_code.py "ruta/al/repositorio" salida.json "src/main/java/com/empresa/app"
"""

import json
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "proyectos" / "datos"
MAX_LINES = 160

# Nombre de cada pestaña (es, en). El orden de este diccionario es el de las pestañas;
# una carpeta que no esté aquí va al final con su propio nombre.
LABELS = {
    # Frescura Total
    "inventory": ("Inventario", "Inventory"),
    "sales": ("Ventas", "Sales"),
    "suppliers": ("Proveedores", "Suppliers"),
    "logistics": ("Logística", "Logistics"),
    "common": ("Común", "Shared"),
    "general": ("Arranque", "Entry point"),
    # Práctica Java POO, en el orden del menú principal
    "Principal": ("Menú", "Menu"),
    "CajeroAutomatico": ("Cajero automático", "ATM"),
    "RegistroAcademico": ("Registro académico", "Academic records"),
    "TiendaOnline": ("Tienda online", "Online store"),
    "AgendaContactos": ("Agenda de contactos", "Contact book"),
    "SistemaNotas": ("Sistema de notas", "Grades"),
}


def first_doc_line(code):
    """La primera línea útil del Javadoc de la clase, si la tiene."""
    for line in code.splitlines():
        text = line.strip().lstrip("/*").strip()
        if line.strip().startswith(("/**", "*")) and text and not text.startswith("@"):
            return text
        if line.strip().startswith(("public ", "class ", "interface ", "enum ", "record ")):
            break
    return ""


def export(repo, out_name, base):
    root = Path(repo) / base
    groups = {}
    for path in sorted(root.rglob("*.java")):
        relative = path.relative_to(root)
        group = relative.parts[0] if len(relative.parts) > 1 else "general"
        name = "/".join(relative.parts[1:]) if len(relative.parts) > 1 else relative.name
        code = path.read_text(encoding="utf-8", errors="replace").rstrip()
        lines = code.splitlines()
        if len(lines) > MAX_LINES:
            code = "\n".join(lines[:MAX_LINES] + [f"// … ({len(lines) - MAX_LINES} líneas más)"])
        groups.setdefault(group, []).append({"name": name, "note": first_doc_line(code), "sql": code, "file": path.name})
    order = list(LABELS)
    keys = sorted(groups, key=lambda key: order.index(key) if key in order else len(order))
    data = {"lang": "java", "groups": [
        {"id": key, "label_es": LABELS.get(key, (key,))[0], "label_en": LABELS.get(key, (key, key))[1], "items": groups[key]}
        for key in keys
    ]}
    out = OUT_DIR / out_name
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    summary = ", ".join(f"{key} {len(groups[key])}" for key in keys)
    print(f"ok {out.name}: {summary} · {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    export(sys.argv[1], sys.argv[2], sys.argv[3])
