// === PARALLAX BACKGROUND MOTION ===

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  try {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Skip parallax effect for users who prefer reduced motion
    if (prefersReducedMotion) return;

    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    if (parallaxLayers.length === 0) return;

    // Cache depth values per layer during initialization
    const layerDepths = Array.from(parallaxLayers).map((layer, i) => {
      const depthAttr = layer.getAttribute('data-depth');
      const parsedDepth = depthAttr !== null ? parseFloat(depthAttr) : NaN;
      return Number.isNaN(parsedDepth) ? (i + 1) * 0.02 : parsedDepth;
    });

    // Add will-change for better performance
    parallaxLayers.forEach((layer) => {
      layer.style.willChange = 'transform';
    });

    // Throttle mousemove with requestAnimationFrame
    let ticking = false;
    let lastX = 0;
    let lastY = 0;

    document.addEventListener(
      'mousemove',
      (e) => {
        lastX = (e.clientX / window.innerWidth - 0.5) * 2;
        lastY = (e.clientY / window.innerHeight - 0.5) * 2;

        if (!ticking) {
          window.requestAnimationFrame(() => {
            parallaxLayers.forEach((layer, i) => {
              const depth = layerDepths[i];
              layer.style.transform = `translate3d(${lastX * depth * -30}px, ${lastY * depth * -30}px, 0)`;
            });
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  } catch (error) {
    // Silently fail if there are issues
  }
})();
