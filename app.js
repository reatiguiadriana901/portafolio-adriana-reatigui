
const heroImages = document.getElementById('heroImages');
if (heroImages) {
  heroImages.addEventListener('click', () => {
    heroImages.classList.toggle('is-active');
  });
}

// Animación de aparición al hacer scroll (fade + slide-up)
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

revealElements.forEach((el) => revealObserver.observe(el));

// Animación de las barras de habilidades: se llenan al entrar en pantalla
const skillBars = document.querySelectorAll('.skill__progress');

const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const width = target.getAttribute('data-width') || '0%';
        target.style.width = width;
        skillObserver.unobserve(target);
      }
    });
  },
  { threshold: 0.4 }
);

skillBars.forEach((bar) => skillObserver.observe(bar));

// Resaltar el enlace de navegación según la sección visible
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav__link');

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle(
            'nav__link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
);

sections.forEach((section) => navObserver.observe(section));