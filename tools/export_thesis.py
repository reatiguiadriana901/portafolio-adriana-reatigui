"""Exporta los resultados AGREGADOS de mi tesis a js/data/thesis.json.

Lee las tablas que generan los notebooks de la tesis (carpeta resultados/) y
escribe solo conteos, medias y totales. Ningún nombre de cono ni coordenada
sale de aquí: los datos de la tesis no se publican.

Uso:
    py -3.12 tools/export_thesis.py --resultados "C:/ruta/a/tesis/resultados"
"""

import argparse
import csv
import json
import math
from pathlib import Path

# El mismo intervalo de las rosetas del notebook 01
INTERVALO_ROSETA = 30

# Esfuerzo horizontal máximo regional (Bohórquez-Orozco et al., 2026)
SHMAX = 104
INCERTIDUMBRE_SHMAX = 15

# Rangos de rumbo de cada familia (leyenda de la figura de familias, notebook 03)
RANGO_FAMILIAS = {"F1": [10, 60], "F2": [60, 100], "F3": [100, 130], "F4": [130, 10]}

# Embudo de depuración de lineamientos (tesis, sección 3.4.3). No sale de un CSV
# porque el conteo de cada filtro se reporta en el texto de la tesis.
DEPURACION = [
    {"etapa": "Trazos dibujados", "n": 526, "km": 816.7},
    {"etapa": "Lineamientos distintos", "n": 476, "km": None},
    {"etapa": "Coinciden en 2 o más técnicas", "n": 41, "km": 88.7},
    {"etapa": "Continuos (1 km o más)", "n": 37, "km": 85.6},
    {"etapa": "Con expresión en el relieve", "n": 32, "km": 76.6},
]

# Valores publicados en la tesis, para comprobar que el cálculo coincide
ESPERADO = {"media_axial": 72.3, "r": 0.654, "aptos": 19, "asociados": 15,
            "desfase_medio": 6.6, "alineados_shmax": 4, "lineamientos": 58, "km": 203.5}


def leer(ruta):
    with open(ruta, encoding="utf-8-sig", newline="") as archivo:
        return list(csv.DictReader(archivo))


def media_axial(azimuts):
    """Media de datos axiales (0-180°) por el método del ángulo doble, y su R."""
    seno = sum(math.sin(math.radians(2 * a)) for a in azimuts)
    coseno = sum(math.cos(math.radians(2 * a)) for a in azimuts)
    media = (math.degrees(math.atan2(seno, coseno)) / 2) % 180
    r = math.hypot(seno, coseno) / len(azimuts)
    return media, r


def contar_por_clase(azimuts, intervalo):
    """Cuenta cuántos azimuts caen en cada clase angular entre 0 y 180°."""
    conteos = [0] * (180 // intervalo)
    for azimut in azimuts:
        conteos[int((azimut % 180) // intervalo)] += 1
    return conteos


def comprobar(nombre, calculado, esperado, tolerancia=0):
    if abs(calculado - esperado) > tolerancia:
        raise SystemExit(f"{nombre}: calculé {calculado} pero la tesis dice {esperado}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--resultados", required=True, help="carpeta resultados/ del repo de la tesis")
    parser.add_argument("--salida", default=Path(__file__).resolve().parent.parent / "js" / "data" / "thesis.json")
    args = parser.parse_args()
    carpeta = Path(args.resultados)

    conos = leer(carpeta / "tabla1_parametros.csv")
    aptos = leer(carpeta / "tabla4_shmax.csv")
    familias = leer(carpeta / "familias_lineamientos.csv")
    estructuras = leer(carpeta / "tabla3_rumbos.csv")

    azimuts = [float(cono["Az_elongacion"]) for cono in conos]
    media, r = media_axial(azimuts)
    asociados = [cono for cono in aptos if cono["Asociado"] == "True"]
    desfase_medio = sum(float(cono["Desfase"]) for cono in asociados) / len(asociados)

    conos_por_estructura = {}
    for cono in asociados:
        conos_por_estructura[cono["Estructura"]] = conos_por_estructura.get(cono["Estructura"], 0) + 1

    clases_shmax = {"alineados": 0, "oblicuos": 0, "ortogonales": 0}
    for cono in aptos:
        clase = cono["Clase_SHmax"].lower()
        clave = "alineados" if clase.startswith("alineado") else "oblicuos" if clase.startswith("oblicuo") else "ortogonales"
        clases_shmax[clave] += 1

    total_lineamientos = sum(int(f["n"]) for f in familias)
    total_km = sum(float(f["km"]) for f in familias)

    comprobar("Media axial", round(media, 1), ESPERADO["media_axial"])
    comprobar("R", round(r, 3), ESPERADO["r"])
    comprobar("Conos aptos", len(aptos), ESPERADO["aptos"])
    comprobar("Conos asociados", len(asociados), ESPERADO["asociados"])
    comprobar("Desfase medio", round(desfase_medio, 1), ESPERADO["desfase_medio"])
    comprobar("Alineados con el SHmax", clases_shmax["alineados"], ESPERADO["alineados_shmax"])
    comprobar("Lineamientos y fallas", total_lineamientos, ESPERADO["lineamientos"])
    comprobar("Longitud total", round(total_km, 1), ESPERADO["km"])

    datos = {
        "fuente": "Reatigui Mateus, A. M. (2026). Trabajo de grado, Universidad Industrial de Santander. Solo valores agregados.",
        "elongacion": {
            "n": len(azimuts),
            "intervalo": INTERVALO_ROSETA,
            "conteos": contar_por_clase(azimuts, INTERVALO_ROSETA),
            "mediaAxial": round(media, 1),
            "r": round(r, 3),
        },
        "shmax": {"azimut": SHMAX, "incertidumbre": INCERTIDUMBRE_SHMAX, "clases": clases_shmax},
        "asociacion": {
            "aptos": len(aptos),
            "asociados": len(asociados),
            "desfaseMedio": round(desfase_medio, 1),
            "porEstructura": conos_por_estructura,
        },
        "familias": [
            {"id": f["familia"], "direccion": f["direccion"], "rango": RANGO_FAMILIAS[f["familia"]],
             "n": int(f["n"]), "km": round(float(f["km"]), 1)}
            for f in familias
        ],
        "estructuras": [
            {"nombre": e["nombre"], "tipo": e["tipo"], "rumbo": round(float(e["rumbo representativo (°)"]))}
            for e in estructuras
        ],
        "depuracion": DEPURACION,
        "capaFinal": {"n": total_lineamientos, "km": round(total_km, 1)},
    }

    salida = Path(args.salida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Listo: {salida} (media axial {media:.1f}°, R = {r:.3f}, {len(asociados)}/{len(aptos)} conos asociados)")


if __name__ == "__main__":
    main()
