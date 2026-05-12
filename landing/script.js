// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Animated counters
const counters = document.querySelectorAll('.stat__num');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    const duration = 1600;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(c => counterIO.observe(c));

// Nav scroll effect
const nav = document.querySelector('.nav__inner');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    nav.style.background = 'rgba(15,21,32,.85)';
    nav.style.boxShadow = '0 8px 24px rgba(0,0,0,.3)';
  } else {
    nav.style.background = 'rgba(20,26,38,.7)';
    nav.style.boxShadow = 'none';
  }
});

// Mobile menu (basic toggle)
const burger = document.querySelector('.nav__burger');
const menu = document.querySelector('.nav__menu');
burger?.addEventListener('click', () => {
  const open = menu.style.display === 'flex';
  if (open) {
    menu.style.display = '';
  } else {
    menu.style.display = 'flex';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '0';
    menu.style.right = '0';
    menu.style.flexDirection = 'column';
    menu.style.background = 'rgba(15,21,32,.95)';
    menu.style.padding = '1.5rem';
    menu.style.borderRadius = '20px';
    menu.style.marginTop = '.5rem';
    menu.style.gap = '1rem';
    menu.style.backdropFilter = 'blur(20px)';
  }
});
