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
    let scrollTicking = false;
    let cooldownId = null;
    let lastCursorX = 0;
    let lastCursorY = 0;
    let currentScale = 1;

    // Track cursor for glow movement (throttled)
    document.addEventListener("mousemove", (e) => {
      lastCursorX = e.clientX;
      lastCursorY = e.clientY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Compose transform with the CSS centering offset and current scale
          glow.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Scroll velocity → pulse strength (throttled with rAF)
    window.addEventListener("scroll", () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          const delta = Math.abs(window.scrollY - lastScrollY);
          scrollSpeed = Math.min(delta / 100, 2.5);
          lastScrollY = window.scrollY;

          // Update current scale and apply with cursor position to avoid jumps
          currentScale = 1 + scrollSpeed * 0.3;
          glow.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
          glow.style.opacity = Math.min(0.4 + scrollSpeed * 0.25, 1);

          clearTimeout(cooldownId);
          cooldownId = setTimeout(() => {
            currentScale = 1;
            glow.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
            glow.style.opacity = 0.4;
          }, 200);

          scrollTicking = false;
        });
        scrollTicking = true;
      }
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
