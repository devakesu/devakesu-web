// === REACTIVE GLOW SYSTEM (Cursor + Scroll + Click Burst) ===
// Cyan glow follows cursor, pulses on scroll, and bursts on click.

(function() {
  'use strict';
  
  if (typeof window === "undefined" || !document.body) return;

  try {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Skip reactive glow effects for users who prefer reduced motion
    if (prefersReducedMotion) return;

    const glow = document.createElement("div");
    glow.className = "reactive-glow";
    glow.setAttribute('aria-hidden', 'true');
    glow.style.willChange = 'transform, opacity';
    document.body.appendChild(glow);

    let lastScrollY = window.scrollY;
    let scrollSpeed = 0;
    let ticking = false;
    let cooldownId = null;
    let lastCursorX = 0;
    let lastCursorY = 0;

    // Track cursor for glow movement (throttled)
    document.addEventListener("mousemove", (e) => {
      lastCursorX = e.clientX;
      lastCursorY = e.clientY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Compose transform with the CSS centering offset (-50%, -50%)
          glow.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0) translate(-50%, -50%)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Scroll velocity → pulse strength
    window.addEventListener("scroll", () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      scrollSpeed = Math.min(delta / 100, 2.5);
      lastScrollY = window.scrollY;

      // Compose scroll scaling with current cursor position to avoid jumps
      glow.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0) translate(-50%, -50%) scale(${1 + scrollSpeed * 0.3})`;
      glow.style.opacity = Math.min(0.4 + scrollSpeed * 0.25, 1);

      clearTimeout(cooldownId);
      cooldownId = setTimeout(() => {
        glow.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0) translate(-50%, -50%) scale(1)`;
        glow.style.opacity = 0.4;
      }, 200);
    }, { passive: true });

    // Click Burst + Haptic Feedback
    document.addEventListener("click", (e) => {
      const burst = document.createElement("div");
      burst.className = "click-burst";
      burst.setAttribute('aria-hidden', 'true');
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      document.body.appendChild(burst);

      // Mobile vibration feedback (if supported)
      if (navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch (e) {
          // Vibration not supported
        }
      }
      
      // Animate then remove
      setTimeout(() => {
        if (burst.parentNode) {
          burst.remove();
        }
      }, 700);
    }, { passive: true });
  } catch (error) {
    // Silently fail if there are issues
  }
})();
