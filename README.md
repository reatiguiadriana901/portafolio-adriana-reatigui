# Portafolio de Adriana Reatigui

Soy geóloga (Universidad Industrial de Santander) y estoy terminando el Técnico en Desarrollo de Software en Campuslands. Este portafolio reúne mi perfil, mis proyectos de software y de geociencias, mis habilidades y mis datos de contacto.

🔗 **Sitio en vivo:** https://reatiguiadriana901.github.io/portafolio-adriana-reatigui/

## Qué tiene

- **Un corte geológico animado de fondo**: capas plegadas y fallas normales que avanzan despacio. Al bajar por la página bajas también por el subsuelo.
- **Una presentación al abrir la página**: suben los estratos, cada uno con una parte de mi stack, y aparecen mi nombre y mi rol. Sale una vez por sesión y se puede saltar.
- **Proyectos en una caja de núcleos de perforación**: cada núcleo abre la ficha de un proyecto de software o de geociencias.
- **Una página por proyecto** con el trabajo real: los workflows de n8n, el SQL y el código Java en visores interactivos, una demo en vivo de Acme School, los mapas y el código de la tesis, y dos pósters de geología completos.
- **Habilidades como una columna estratigráfica**, de la superficie (frontend) al núcleo (datos y automatización).
- **Español e inglés**, con un botón para cambiar de idioma.
- **Lapilli**, un T-Rex en pixel art con piqueta de geóloga, se presenta al abrir la página y acompaña el recorrido con datos curiosos de geología.
- **Ajustes**: pausar las animaciones, probar paletas de colores y ocultar a Lapilli.
- **Accesible**: se lee completo sin JavaScript, respeta la opción "reducir movimiento" del sistema y funciona con teclado.

## Cómo funciona

Es HTML, CSS y JavaScript sin frameworks ni dependencias, con módulos ES y sin paso de compilación.

```
index.html          todo el contenido (se lee incluso sin JavaScript)
css/                tokens (paleta), base, secciones, franjas, escena, mascota y presentación
js/main.js          arranca cada módulo en orden
js/state.js · bus.js · loop.js · motion.js · i18n.js
                    estado compartido, eventos, un solo requestAnimationFrame, pausa e idiomas
js/intro.js         presentación a pantalla completa
js/case.js          páginas de cada proyecto: idioma, paleta y fondo animado
js/n8n-viewer.js · sql-viewer.js
                    visores de los workflows de n8n y del código (SQL y Java)
proyectos/          páginas de cada proyecto (las genera tools/build_cases.py)
js/fx/              corte geológico de fondo, hallazgos del recorrido, íconos y partículas
js/ui/              navegación, caja de núcleos, apariciones y ajustes
js/scene/           mide la página y convierte el scroll en la ruta de Lapilli
js/mascot/          sprites de Lapilli, su animación y lo que dice
js/data/            textos en inglés, frases de Lapilli y paletas
tools/              servidor local sin caché, generador de las páginas de proyecto y scripts de datos e imágenes
tools/cases/        contenido de cada página de proyecto, en español e inglés (JSON)
```

## Verlo en local

Los módulos ES necesitan un servidor (no basta con abrir el archivo). Desde la carpeta del proyecto:

```bash
py -3.12 tools/serve.py
```

Luego abre http://127.0.0.1:5501. Este servidor no guarda caché, así que siempre ves la última versión de los archivos.

- `?intro` vuelve a mostrar la presentación.
- `?lang=en` abre el sitio en inglés.
- `?motion=off` lo muestra sin animaciones.
- `?debug` deja `window.__pf.state`, `bus` y `loop` en la consola.

Las páginas de proyecto se escriben en `tools/cases/<proyecto>.json` y se generan con:

```bash
py -3.12 tools/build_cases.py
```

## Contacto

- **Correo:** reatiguiadriana901@gmail.com
- **GitHub:** [@reatiguiadriana901](https://github.com/reatiguiadriana901)
- **LinkedIn:** [Adriana Reatigui](https://www.linkedin.com/in/adriana-reatigui-333655322/)
