"""Servidor local para revisar el portafolio sin caché.

Uso: py -3.12 tools/serve.py [puerto]   (por defecto, 5501)

Sirve la carpeta del proyecto en http://127.0.0.1:<puerto> y le pide al
navegador que no guarde nada en caché: así cada recarga trae los últimos
cambios del HTML, el CSS y los módulos de JavaScript.
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5501
    handler = partial(NoCacheHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Portafolio en http://127.0.0.1:{port} (Ctrl+C para detenerlo)")
        server.serve_forever()


if __name__ == "__main__":
    main()
