// Laser Cursor + Scroll Reveal

(function () {
  'use strict';

  if (typeof window === 'undefined' || !document.body) return;

  try {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ====== Laser Beam Cursor ======
    if (!prefersReducedMotion) {
      const laser = document.createElement('div');
      laser.setAttribute('aria-hidden', 'true');
      Object.assign(laser.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '2px',
        height: '2px',
        background: '#00ffff',
        boxShadow: '0 0 12px #00ffff',
        pointerEvents: 'none',
        zIndex: '9999',
        transition: 'transform 0.02s linear',
        willChange: 'transform',
      });
      document.body.appendChild(laser);

      // Throttle mousemove for performance
      let ticking = false;
      window.addEventListener(
        'mousemove',
        (e) => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              laser.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );
    }

    // ====== Scroll Reveal ======
    const revealItems = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              io.unobserve(entry.target); // Stop observing once visible
            }
          });
        },
        { threshold: 0.2, rootMargin: '50px' }
      );

      revealItems.forEach((el) => io.observe(el));
    } else {
      // Fallback for older browsers
      revealItems.forEach((el) => el.classList.add('visible'));
    }
  } catch (error) {
    // Silently fail if there are issues
  }
})();
