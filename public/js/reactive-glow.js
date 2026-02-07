// === REACTIVE GLOW SYSTEM (Cursor + Scroll + Click Burst) ===
// Cyan glow follows cursor, pulses on scroll, and bursts on click.

(function() {
  'use strict';
  
  if (typeof window === "undefined" || !document.body) return;

  try {
    const glow = document.createElement("div");
    glow.className = "reactive-glow";
    glow.setAttribute('aria-hidden', 'true');
    glow.style.willChange = 'transform, opacity';
    document.body.appendChild(glow);

    let lastScrollY = window.scrollY;
    let scrollSpeed = 0;
    let ticking = false;

    // Track cursor for glow movement (throttled)
    document.addEventListener("mousemove", (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          glow.style.left = `${e.clientX}px`;
          glow.style.top = `${e.clientY}px`;
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

      glow.style.transform = `translate(-50%, -50%) scale(${1 + scrollSpeed * 0.3})`;
      glow.style.opacity = 0.4 + scrollSpeed * 0.25;

      clearTimeout(glow._cooldown);
      glow._cooldown = setTimeout(() => {
        glow.style.transform = `translate(-50%, -50%) scale(1)`;
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
