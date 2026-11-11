# Viaje por el tiempo geológico — Portafolio de Adriana Reatigui

Soy geóloga (Universidad Industrial de Santander) y desarrolladora de software junior (Campuslands). Este portafolio es un viaje por el tiempo geológico: al bajar por la página avanzas desde el Precámbrico hasta hoy, y en cada periodo te cuento algo de mí. Te acompaña **Lapilli**, un T-Rex pixelado con piqueta de geóloga que recorre una ruta, reacciona a lo que haces y hace erupcionar volcanes a su paso.

🔗 **Sitio en vivo:** https://reatiguiadriana901.github.io/portafolio-adriana-reatigui/

## Qué tiene

- **Recorrido cronológico** con los colores oficiales de la carta cronoestratigráfica internacional (ICS v2026/06) y la columna geológica real de la zona de mi tesis.
- **Lapilli**, dibujado en pixel art como texto dentro del código: camina, golpea rocas con la piqueta, se duerme si dejas de bajar, ruge si le haces clic y comenta mis proyectos.
- **Volcanes** que erupcionan al paso de Lapilli. Los conos monogenéticos de mi tesis erupcionan una sola vez, como en la realidad.
- **Mi tesis** con un gráfico interactivo hecho a mano en SVG a partir de datos agregados.
- **Accesible**: se lee completo sin JavaScript, respeta "reducir movimiento" del sistema y tiene un botón para pausar las animaciones.

## Cómo funciona

Es HTML, CSS y JavaScript sin frameworks ni dependencias, con módulos ES.

```
index.html            todo el contenido (se lee incluso sin JavaScript)
css/                  tokens (paleta y colores ICS), base, secciones, bandas, tesis, escena y mascota
js/main.js            arranca cada módulo en orden
js/state.js · bus.js · loop.js · motion.js   estado compartido, eventos, un solo requestAnimationFrame y pausa
js/scene/             mide la página, construye la ruta y convierte el scroll en la posición de Lapilli
js/mascot/            sprites de Lapilli, su animación y lo que dice
js/fx/                volcanes, asteroide, partículas e íconos pixelados
js/ui/                cabecera, apariciones y gráfico de la tesis
js/data/              periodos geológicos, frases y datos agregados de la tesis
tools/                scripts de Python para generar los datos de la tesis y las imágenes WebP
```

- En computador (1200 px o más), Lapilli camina en zigzag por los márgenes y cruza de lado en las bandas entre secciones, así nunca tapa el texto.
- En celular y tableta camina por una franja fija en la parte de abajo.

## Verlo en local

Los módulos ES necesitan un servidor (no basta con abrir el archivo). Desde la carpeta del proyecto:

```bash
py -3.12 -m http.server 5500
```

Luego abre http://localhost:5500. También sirve la extensión Live Server de VS Code.

Para revisar el viaje, agrega `?debug` a la URL y en la consola quedan `window.__pf.state`, `bus` y `loop`. Con `?motion=off` ves el modo sin animaciones.

## Datos de la tesis

Los datos de mi tesis no se publican: el sitio solo usa valores agregados (conteos por clase angular, medias y totales). Para regenerarlos desde el repositorio privado de la tesis:

```bash
py -3.12 tools/export_thesis.py --resultados "ruta/a/tesis/resultados"
py -3.12 tools/optimize_images.py --tesis-docs "ruta/a/tesis/docs"
```

El primer script comprueba que las cifras coincidan con las de la tesis antes de escribir `js/data/thesis.json`.

## Contacto

- **Correo:** reatiguiadriana901@gmail.com
- **GitHub:** [@reatiguiadriana901](https://github.com/reatiguiadriana901)
- **LinkedIn:** [Adriana Reatigui](https://www.linkedin.com/in/adriana-reatigui-333655322/)
