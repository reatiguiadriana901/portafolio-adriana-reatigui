"""Convierte el retrato y las figuras de la tesis a WebP livianos para la web.

Uso (necesita Pillow, que está en el Python 3.12):
    py -3.12 tools/optimize_images.py --tesis-docs "C:/ruta/a/tesis/docs"
"""

import argparse
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "img"


def convertir(origen, destino, ancho_maximo, calidad):
    with Image.open(origen) as imagen:
        # El retrato es un recorte con fondo transparente: se conserva el canal alfa
        # y se recorta el espacio vacío que sobra alrededor
        tiene_alfa = imagen.mode in ("RGBA", "LA") or "transparency" in imagen.info
        imagen = imagen.convert("RGBA" if tiene_alfa else "RGB")
        if tiene_alfa:
            imagen = imagen.crop(imagen.getchannel("A").getbbox())
        if imagen.width > ancho_maximo:
            alto = round(imagen.height * ancho_maximo / imagen.width)
            imagen = imagen.resize((ancho_maximo, alto), Image.LANCZOS)
        imagen.save(destino, "WEBP", quality=calidad, method=6)
        print(f"{destino.name}: {imagen.width}x{imagen.height}, "
              f"{origen.stat().st_size // 1024} KB -> {destino.stat().st_size // 1024} KB")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--tesis-docs", required=True, help="carpeta docs/ del repo de la tesis")
    args = parser.parse_args()
    docs = Path(args.tesis_docs)
    DESTINO.mkdir(parents=True, exist_ok=True)

    # (origen, nombre de salida, ancho máximo en px, calidad WebP)
    imagenes = [
        (RAIZ / "assets" / "foto_acuarela.png", "retrato-acuarela.webp", 480, 82),
        (docs / "mapa_preservacion.jpg", "tesis-preservacion.webp", 900, 85),
        (docs / "desfase_angular.jpg", "tesis-desfase.webp", 1100, 85),
        (docs / "lineamientos_familias.jpg", "tesis-lineamientos.webp", 1400, 85),
    ]
    for origen, nombre, ancho, calidad in imagenes:
        convertir(origen, DESTINO / nombre, ancho, calidad)


if __name__ == "__main__":
    main()
