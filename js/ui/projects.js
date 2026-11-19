// Proyectos como una caja de núcleos de perforación: a la izquierda los núcleos
// (botones) y a la derecha la ficha del que esté abierto. Así no hay que bajar
// por nueve tarjetas. Sin JavaScript se ven todas las fichas, una debajo de otra.

import { emit } from '../bus.js';

export function initProjects() {
  const box = document.querySelector('.core-box');
  if (!box) return;
  const cores = [...box.querySelectorAll('.core')];
  const panels = cores.map((core) => document.getElementById(core.getAttribute('aria-controls')));

  const open = (index) => {
    cores.forEach((core, i) => {
      core.setAttribute('aria-expanded', String(i === index));
      panels[i].hidden = i !== index;
    });
  };

  cores.forEach((core, index) => {
    core.addEventListener('click', () => {
      open(index);
      emit('project:show', { card: panels[index] });
      // En pantallas angostas la ficha queda debajo de la lista: se trae a la vista
      if (matchMedia('(max-width: 899px)').matches) {
        const smooth = document.documentElement.dataset.motion === 'on';
        panels[index].scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
      }
    });
  });

  box.classList.add('is-enhanced');
  open(0);
}
