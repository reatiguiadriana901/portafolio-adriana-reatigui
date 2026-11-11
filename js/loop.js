// Un solo requestAnimationFrame para todo el sitio.
// Cada tarea devuelve cuántos milisegundos faltan para volver a llamarla:
// 0 = en el próximo frame, Infinity = dormir hasta que alguien llame a wake().

const tasks = new Map(); // id -> { fn, order, due }
let frameId = 0;
let timerId = 0;
let lastTime = 0;

/** Registra una tarea. `order` define quién corre primero en cada frame (menor = antes). */
export function addTask(id, fn, order = 50) {
  tasks.set(id, { fn, order, due: 0 });
  wake();
}

export function removeTask(id) {
  tasks.delete(id);
}

/** Despierta todas las tareas (por ejemplo, al hacer scroll) o solo una. */
export function wake(id) {
  if (id) {
    const task = tasks.get(id);
    if (task) task.due = 0;
  } else {
    tasks.forEach((task) => { task.due = 0; });
  }
  schedule(0);
}

export function isRunning() {
  return frameId !== 0 || timerId !== 0;
}

function schedule(delay) {
  if (document.hidden) return;
  if (delay <= 16) {
    clearTimeout(timerId);
    timerId = 0;
    if (!frameId) frameId = requestAnimationFrame(tick);
  } else if (!frameId && !timerId) {
    timerId = setTimeout(() => {
      timerId = 0;
      schedule(0);
    }, delay);
  }
}

function tick(now) {
  frameId = 0;
  // dt limitado a 50 ms para que nada "salte" después de una pausa larga
  const dt = lastTime ? Math.min(50, now - lastTime) : 16;
  lastTime = now;

  let next = Infinity;
  const ordered = [...tasks.values()].sort((a, b) => a.order - b.order);
  for (const task of ordered) {
    if (now >= task.due) {
      const wait = task.fn(dt, now);
      task.due = now + (wait ?? Infinity);
    }
    next = Math.min(next, task.due - now);
  }
  if (next < Infinity) schedule(next);
  else lastTime = 0;
}

// Con la pestaña oculta el navegador detiene los frames; al volver, se retoma todo
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = 0;
    wake();
  }
});
