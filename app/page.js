'use client';

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { useAnalytics } from '@/components/Analytics';
import {
  FaLinkedin,
  FaGithub,
  FaInstagram,
  FaFacebook,
  FaGoogle,
  FaReddit,
  FaPinterest,
  FaTelegram,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const SCROLL_LOCK_DURATION = 1100;
const TOUCH_THRESHOLD_PX = 40;
const MIN_WHEEL_DELTA = 2;

// Throttle utility for performance optimization
const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};
// NOTE: Inline style attribute selectors (e.g., [style*="overflow-y: auto"]) are
// whitespace- and order-sensitive and may miss valid inline style syntax variations
// (e.g., "overflow-y:auto" without space, or multiple spaces). Scrollable elements
// should preferably use data attributes or classes for reliable detection. The
// fallback logic in scrollToSection only runs when no elements match SCROLLABLE_SELECTORS.
const SCROLLABLE_SELECTORS = [
  '[data-scrollable]',
  '.overflow-y-auto',
  '.overflow-y-scroll',
  '[style*="overflow-y: auto"]',
  '[style*="overflow-y: scroll"]',
  '[style*="overflow: auto"]',
  '[style*="overflow: scroll"]',
].join(', ');

// Helper function to scroll element into view on mobile after a delay
const scrollIntoViewOnMobile = (elementId, delay = 300) => {
  if (window.matchMedia('(max-width: 768px)').matches) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }, delay);
  }
};

// Memoized social icon component to prevent unnecessary re-renders
const SocialIcon = memo(({ href, Icon, title, platform, onClick }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
    title={title}
    aria-label={title}
    onClick={(e) => {
      e.stopPropagation();
      onClick(platform);
    }}
  >
    <Icon />
  </a>
));

SocialIcon.displayName = 'SocialIcon';

export default function Home() {
  const { trackEvent } = useAnalytics();
  const [activeNode, setActiveNode] = useState(null);
  const [meta, setMeta] = useState(null);
  const [booting, setBooting] = useState(true);
  const [isSectionScrollEnabled, setIsSectionScrollEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [isCoarsePointer, setIsCoarsePointer] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });
  const activeSectionIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const unlockTimeoutRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchIsVerticalRef = useRef(null);
  const touchStartedWithinScrollableRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const scrollTargetRef = useRef(null);

  // Calculate age based on birth date (April 19)
  const birthYear = 2006;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (April = 3)
  const currentDay = currentDate.getDate();
  const hasHadBirthdayThisYear = currentMonth > 3 || (currentMonth === 3 && currentDay >= 19);
  const uptime = currentYear - birthYear - (hasHadBirthdayThisYear ? 0 : 1);

  const taglines = useMemo(
    () => [
      'Human. Machine. Something in between.',
      'Signal found. Noise reduced.',
      'Unlearning defaults, engineering futures.',
      'System awake // latency minimal.',
      'Building kinder tech in a chaotic world.',
    ],
    []
  );

  const [currentTagline, setCurrentTagline] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Cycle through taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [taglines]);

  // Handle mobile scrolling when panel is toggled via keyboard
  useEffect(() => {
    if (scrollTargetRef.current) {
      const elementId = scrollTargetRef.current;
      scrollTargetRef.current = null;
      scrollIntoViewOnMobile(elementId);
    }
  }, [activeNode]);

  // Fetch Build Metadata
  useEffect(() => {
    let timeoutId;
    let isMounted = true;
    const controller = new AbortController();

    fetch('/meta.json', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load /meta.json: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setMeta(data);
          timeoutId = setTimeout(() => {
            if (isMounted) setBooting(false);
          }, 800);
        }
      })
      .catch((error) => {
        // Ignore abort errors (happens when component unmounts)
        if (error.name === 'AbortError' || !isMounted) return;

        // Fallback if fetch fails (local dev mode)
        setMeta({
          build_id: 'DEV_MODE',
          commit_sha: 'HEAD',
          branch: 'main',
          timestamp: new Date().toISOString(),
          audit_status: 'SKIPPED',
          signature_status: 'UNSIGNED',
        });
        setBooting(false);
      });

    return () => {
      controller.abort();
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Update time every second for UTC+5:30 (IST) - only when page visible
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    const updateTime = () => {
      // Guard against race conditions where interval fires while page is hidden
      if (document.hidden) return;
      const formattedTime = formatter.format(new Date());
      setCurrentTime(formattedTime);
    };

    let intervalId = null;

    const startInterval = () => {
      if (intervalId !== null) clearInterval(intervalId);
      updateTime(); // Update immediately
      intervalId = setInterval(updateTime, 1000);
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    };

    handleVisibilityChange(); // Initialize based on current visibility state
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Respect reduced-motion preference before enabling section scroll snapping
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handlePreferenceChange = (event) => {
      setIsSectionScrollEnabled(!event.matches);
    };

    mediaQuery.addEventListener('change', handlePreferenceChange);

    return () => mediaQuery.removeEventListener('change', handlePreferenceChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const handleChange = (event) => setIsCoarsePointer(event.matches);

    coarsePointerQuery.addEventListener('change', handleChange);

    return () => coarsePointerQuery.removeEventListener('change', handleChange);
  }, []);

  // Force section-by-section scroll with smooth snapping across input methods
  useEffect(() => {
    if (!isSectionScrollEnabled || isCoarsePointer || typeof window === 'undefined') {
      return undefined;
    }

    const sections = Array.from(document.querySelectorAll('.scroll-snap-section'));

    if (sections.length <= 1) {
      return undefined;
    }

    const resolveElement = (target) => {
      if (target instanceof Element) return target;
      return target?.parentElement ?? null;
    };

    // Helper to determine if an element is scrollable, using consistent criteria
    const isScrollableElement = (el) => {
      if (!el) return false;
      // Require a difference greater than 1px to be considered scrollable.
      // This tolerance accounts for sub-pixel rendering and layout quirks.
      if (el.scrollHeight - el.clientHeight <= 1) {
        return false;
      }
      const computed = window.getComputedStyle(el);
      const overflowY = computed.overflowY;
      return overflowY === 'auto' || overflowY === 'scroll';
    };

    const allowNativeScroll = (target, direction = 0) => {
      const element = resolveElement(target);
      if (!element) return false;

      if (
        element.closest(
          'input, textarea, select, [contenteditable="true"], [data-free-scroll="true"]'
        )
      ) {
        return true;
      }

      let current = element;
      while (current && current !== document.body) {
        if (isScrollableElement(current)) {
          const maxScrollTop = current.scrollHeight - current.clientHeight;
          if (direction < 0 && current.scrollTop > 0) {
            return true;
          }
          if (direction > 0 && current.scrollTop < maxScrollTop) {
            return true;
          }
          if (direction === 0) {
            return true;
          }
        }
        current = current.parentElement;
      }

      return false;
    };

    const syncSectionIndex = () => {
      let closestIndex = 0;
      let minOffset = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const offset = Math.abs(section.getBoundingClientRect().top);
        if (offset < minOffset) {
          closestIndex = index;
          minOffset = offset;
        }
      });

      activeSectionIndexRef.current = closestIndex;
    };

    const scrollToSection = (direction) => {
      // Prevent any scroll if we're already animating or scrolled too recently
      const now = Date.now();
      if (isAnimatingRef.current || now - lastScrollTimeRef.current < SCROLL_LOCK_DURATION) {
        return;
      }

      const nextIndex = Math.min(
        sections.length - 1,
        Math.max(0, activeSectionIndexRef.current + direction)
      );

      if (nextIndex === activeSectionIndexRef.current) {
        return;
      }

      lastScrollTimeRef.current = now;

      // Reset scroll position of all scrollable elements in the target section
      const targetSection = sections[nextIndex];
      const scrollableElements = Array.from(targetSection.querySelectorAll(SCROLLABLE_SELECTORS));
      // Fallback: if no matching descendants, include the section itself if it is scrollable
      if (scrollableElements.length === 0 && isScrollableElement(targetSection)) {
        scrollableElements.push(targetSection);
      }
      scrollableElements.forEach((el) => {
        // Only reset if element has scrollable content (using same tolerance as isScrollableElement)
        if (el.scrollHeight - el.clientHeight > 1) {
          el.scrollTop = 0;
        }
      });

      isAnimatingRef.current = true;
      sections[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      activeSectionIndexRef.current = nextIndex;

      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }

      unlockTimeoutRef.current = window.setTimeout(() => {
        isAnimatingRef.current = false;
      }, SCROLL_LOCK_DURATION);
    };

    const handleWheel = (event) => {
      // Check if we're in a scrollable area first
      if (event.ctrlKey || allowNativeScroll(event.target, event.deltaY > 0 ? 1 : -1)) {
        return;
      }

      // Always prevent default for section scrolling, even when animating
      event.preventDefault();

      // Block scroll attempts while an animation is currently running
      if (isAnimatingRef.current) {
        return;
      }

      if (Math.abs(event.deltaY) < MIN_WHEEL_DELTA) {
        return;
      }

      scrollToSection(event.deltaY > 0 ? 1 : -1);
    };

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }

      // Ignore key events when focus is inside interactive/input elements
      const target = event.target;

      // Guard against non-Element targets (e.g., document/window)
      if (!(target instanceof Element)) {
        return;
      }

      // Use closest to check for interactive elements in the ancestor chain
      const interactiveAncestor = target.closest(
        'input, textarea, select, button, a, [contenteditable="true"]'
      );

      if (interactiveAncestor) {
        return;
      }

      if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        if (!isAnimatingRef.current) scrollToSection(1);
      } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        if (!isAnimatingRef.current) scrollToSection(-1);
      }
    };

    const resetTouchTracking = () => {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      touchIsVerticalRef.current = null;
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1 || allowNativeScroll(event.touches[0].target)) {
        touchStartedWithinScrollableRef.current = true;
        resetTouchTracking();
        return;
      }

      touchStartedWithinScrollableRef.current = false;
      touchStartYRef.current = event.touches[0].clientY;
      touchStartXRef.current = event.touches[0].clientX;
      touchIsVerticalRef.current = null;
    };

    const handleTouchMove = (event) => {
      if (touchStartYRef.current === null || event.touches.length !== 1) {
        return;
      }

      if (touchStartedWithinScrollableRef.current) {
        return;
      }

      // Block touch scrolling while animating - ensures only 1 section per gesture
      if (isAnimatingRef.current) {
        event.preventDefault();
        resetTouchTracking();
        return;
      }

      const currentTouch = event.touches[0];
      const deltaY = currentTouch.clientY - touchStartYRef.current;
      const deltaX = currentTouch.clientX - (touchStartXRef.current ?? currentTouch.clientX);

      if (touchIsVerticalRef.current === null) {
        const totalDelta = Math.hypot(deltaX, deltaY);
        if (totalDelta < 6) {
          return;
        }
        touchIsVerticalRef.current = Math.abs(deltaY) >= Math.abs(deltaX);
      }

      if (!touchIsVerticalRef.current) {
        return;
      }

      if (Math.abs(deltaY) < TOUCH_THRESHOLD_PX) {
        return;
      }

      const direction = deltaY > 0 ? -1 : 1;
      if (allowNativeScroll(currentTouch.target, direction)) {
        return;
      }

      event.preventDefault();

      scrollToSection(direction);

      resetTouchTracking();
    };

    const handleTouchEnd = () => {
      touchStartedWithinScrollableRef.current = false;
      resetTouchTracking();
    };

    const handleTouchCancel = () => {
      touchStartedWithinScrollableRef.current = false;
      resetTouchTracking();
    };

    const handleScroll = throttle(() => {
      // Only sync section index when not animating to avoid section skipping
      if (!isAnimatingRef.current) {
        requestAnimationFrame(syncSectionIndex);
      }
    }, 100);

    const handleResize = throttle(() => {
      requestAnimationFrame(syncSectionIndex);
    }, 150);

    syncSectionIndex();

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resetTouchTracking();

      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
        unlockTimeoutRef.current = null;
      }

      isAnimatingRef.current = false;
    };
  }, [isSectionScrollEnabled, isCoarsePointer]);

  // Initialize scroll reveal animations - re-observe on every mount to handle client-side navigation
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const revealItems = document.querySelectorAll('.reveal');

    if (!revealItems.length) return undefined;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If reduced motion is preferred, immediately show all elements
    if (prefersReducedMotion) {
      revealItems.forEach((el) => el.classList.add('visible'));
      return undefined;
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: '50px' }
      );

      revealItems.forEach((el) => io.observe(el));

      return () => {
        io.disconnect();
      };
    } else {
      // Fallback for older browsers
      revealItems.forEach((el) => el.classList.add('visible'));
      return undefined;
    }
  }, []);

  const mindMapContent = {
    tech: {
      title: 'TECH_STACK',
      content:
        'Python, TypeScript, PHP at intermediate level. Learning Java, Kotlin, and C. Comfortable in both Windows and Linux environments. Android development and modification. Cloud infrastructure on GCP, AWS, and others.',
    },
    ideas: {
      title: 'CORE_VALUES',
      content:
        'Science-driven. Justice-oriented. Systems thinker. Ethics-first design. Open source advocate - transparent code builds better communities. Rules should serve humans, not dominate them. Clarity beats control. Products should respect mental health.',
    },
    projects: {
      title: 'THE_ARSENAL',
      content:
        'Legion 7i: Intel Core i9-14900HX @ 2.20 GHz, 32GB RAM, RTX 4070, 3200x2000 165Hz. Samsung Galaxy S24U: Snapdragon 8 Gen 3, 12GB RAM, Adreno 750, 3120x1440 120Hz QHD+. Power where it matters.',
    },
    dreams: {
      title: 'FUTURE_STATE',
      content:
        'Build meaningful tools. Grow in environments that allow curiosity to breathe. Contribute to science for social good. Create a life that remains your own. #LovePeaceJustice',
    },
    contact: {
      title: 'CONNECT',
      content: '',
    },
  };

  const handlePanelKeyDown = useCallback((event, nodeId) => {
    // Only handle keyboard events on the panel container itself, not on interactive children
    if ((event.key === 'Enter' || event.key === ' ') && event.currentTarget === event.target) {
      event.preventDefault();
      setActiveNode((prevActiveNode) => {
        const newState = prevActiveNode === nodeId ? null : nodeId;
        // Set scroll target for useEffect to handle after state update
        if (newState) {
          scrollTargetRef.current = `${nodeId}-content`;
        }
        return newState;
      });
    }
  }, []);

  // Track social media link clicks
  const handleSocialClick = useCallback(
    (platform) => {
      trackEvent('social_link_click', { platform });
    },
    [trackEvent]
  );

  return (
    <main className="relative isolate">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden vhs-flicker scroll-snap-section">
        {/* Parallax layers - hidden on mobile via CSS for performance */}
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl parallax-layer pointer-events-none hidden md:block"
          data-depth="0.15"
        ></div>

        <div
          className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl parallax-layer pointer-events-none hidden md:block"
          data-depth="0.25"
        ></div>

        {/* Background grid (also parallaxed) */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#00ffff20,transparent_60%)] pointer-events-none parallax-layer hidden md:block"
          data-depth="0.05"
        ></div>

        {/* Cyan glow blobs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"></div>

        {/* Content */}
        <div className="relative scanlines">
          <div className="mx-auto max-w-6xl px-6 pt-8 sm:pt-12 lg:pt-16 pb-2 sm:pb-4 lg:pb-6">
            {/* Profile Image - Mobile First */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="profile-image-container w-40 h-40 sm:w-48 sm:h-48">
                <Image
                  src="/profile.jpg"
                  alt="devakesu Profile"
                  width={200}
                  height={200}
                  sizes="(max-width: 640px) 160px, 200px"
                  priority
                  className="profile-image"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
              {/* LEFT: Identity */}
              <div className="lg:col-span-7 space-y-4 lg:space-y-6">
                <div className="system-state inline-flex items-center gap-2 uppercase tracking-widest text-xs text-neutral-300/70">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00ffff]"></span>
                  <span>System: Online</span>
                </div>

                {/* Glitch-enhanced titles */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <h1
                      className="glitch text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight uppercase"
                      data-text="DEVANARAYANAN"
                    >
                      DEVANARAYANAN
                    </h1>
                    <p className="text-xl sm:text-3xl lg:text-4xl text-neutral-400 font-normal">
                      (KESU)
                    </p>
                  </div>
                  <p className="text-base sm:text-xl text-cyan-400 uppercase tracking-wide mt-3 sm:mt-4">
                    @devakesu
                  </p>
                </div>
                <h2
                  className="glitch text-xl sm:text-4xl lg:text-5xl text-cyan-400 uppercase mt-2 sm:mt-4 lg:mt-8"
                  data-text="Where code meets conscience"
                >
                  Where code meets conscience
                </h2>

                <p className="max-w-2xl text-neutral-300/90 text-sm sm:text-lg leading-relaxed lg:mt-4 min-h-12">
                  {taglines[currentTagline]}
                </p>

                <p className="max-w-2xl text-neutral-300 text-sm sm:text-base leading-relaxed mt-6 border-l-2 border-cyan-400/30 pl-4">
                  A curious mind, and a determined learner navigating the space between science,
                  creativity, and social change. I stand for a world where no one is left behind;
                  liberal, inclusive future where creativity meets compassion.
                </p>
              </div>

              {/* RIGHT: Card / Info */}
              <div className="lg:col-span-5 mt-4 lg:mt-0">
                {/* Profile Image - Desktop */}
                <div className="hidden lg:flex justify-center mb-16">
                  <div className="profile-image-container">
                    <Image
                      src="/profile.jpg"
                      alt="Kesu Profile"
                      width={200}
                      height={200}
                      sizes="200px"
                      className="profile-image"
                    />
                  </div>
                </div>

                <div className="relative p-6 sm:p-8 border border-neutral-700 shadow-[0_8px_0_0_rgba(255,255,255,0.1)] hover-glow transition-all duration-300 mt-8">
                  <div className="absolute -top-2 -left-2 h-2 w-2 bg-cyan-400"></div>
                  <div className="absolute -bottom-2 -right-2 h-2 w-2 bg-cyan-400"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-neutral-400">
                      Build Status
                    </span>
                    <span className="text-xs text-cyan-400">OK</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-neutral-400 text-xs">Focus</div>
                      <div className="font-medium">Human-centered systems</div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-xs">Mindset</div>
                      <div className="font-medium">Curious · Ethical</div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-xs">Core Tension</div>
                      <div className="font-medium text-cyan-400">Logic × Empathy</div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-xs">Signal</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="signal-bar signal-bar-1"></span>
                        <span className="signal-bar signal-bar-2"></span>
                        <span className="signal-bar signal-bar-3"></span>
                        <span className="signal-bar signal-bar-4"></span>
                        <span className="signal-bar signal-bar-5"></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 h-px bg-neutral-800"></div>
                  <p className="mt-6 text-neutral-300/90 text-sm">
                    Scrolling unveils missions, artifacts, and contact frequencies. Mind the sharp
                    edges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO SECTION */}
      <section
        id="manifesto"
        className="mx-auto max-w-6xl px-6 py-12 sm:py-24 mt-12 sm:mt-24 scroll-snap-section"
      >
        <div className="border-l-2 border-cyan-400 pl-6">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-8">
            {'//'} MANIFESTO.txt
          </h2>
          <div className="space-y-4 text-neutral-300">
            <p className="text-lg sm:text-xl reveal">
              I don&apos;t build résumés. I build tools that matter.
            </p>
            <p className="text-lg sm:text-xl reveal">
              Technology should free us, not imprison us in notifications and dark patterns.
            </p>
            <p className="text-lg sm:text-xl reveal">
              Rules exist to serve humans - when they don&apos;t, I question them.
            </p>
            <p className="text-lg sm:text-xl reveal">
              Science, justice, creativity, empathy: these are not buzzwords. They&apos;re the
              foundation.
            </p>
            <p className="text-lg sm:text-xl reveal">Code becomes culture faster than we expect.</p>
            <p className="text-lg sm:text-xl reveal">
              Progress means questioning what already works for some.
            </p>
            <p className="text-xl sm:text-2xl text-cyan-400 font-semibold mt-8 reveal italic">
              &ldquo;Love is the only way to rescue humanity from all evils.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* WORLDVIEW SECTION */}
      <section
        id="worldview"
        className="mx-auto max-w-6xl px-6 py-12 sm:py-24 mt-6 sm:mt-12 scroll-snap-section"
      >
        <div className="border-l-2 border-cyan-400/50 pl-6">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-8">
            {'//'} WORLDVIEW.sys
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 text-neutral-300">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Continuous Integration
              </h3>
              <p className="text-sm leading-relaxed">
                Education as a runtime environment, not a static file. Committing to
                curiosity-driven learning loops without a fixed version history.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Logic × Aesthetics
              </h3>
              <p className="text-sm leading-relaxed">
                The balance between logic and aesthetics - being an aesthetic baddie-pookie who
                still cares deeply about meaning.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Connection Protocol: Empathy
              </h3>
              <p className="text-sm leading-relaxed">
                Optimizing for signal over noise. Prioritizing high-bandwidth understanding and
                active listening in a world of distractions.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Beyond Screens
              </h3>
              <p className="text-sm leading-relaxed">
                The world beyond screens - travel, new places, unfamiliar cultures, and perspectives
                that disrupt comfort.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Sustaining Futures
              </h3>
              <p className="text-sm leading-relaxed">
                Protecting what sustains us - the environment, shared spaces, and futures we
                don&apos;t fully control.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Markets & Psychology
              </h3>
              <p className="text-sm leading-relaxed">
                Viewing global markets not as charts, but as high-entropy data streams driven by
                human psychology and probability.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Creative Expression
              </h3>
              <p className="text-sm leading-relaxed">
                Music, art, and creative expression as ways of staying human. They give form to
                thoughts that don’t translate cleanly into words or code.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Limits x Responsibility
              </h3>
              <p className="text-sm leading-relaxed">
                Recognizing that not everything that can be optimized should be. Choosing restraint,
                accountability, and care when actions have consequences beyond the self.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM EXPLORER SECTION */}
      <section
        id="explore"
        className="mx-auto max-w-6xl px-6 py-12 sm:py-24 mt-6 sm:mt-12 scroll-snap-section"
      >
        <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-12">
          {'//'} SYSTEM_EXPLORER.exe
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* INFO PANEL - First on mobile */}
          <div className="terminal-panel panel-static md:col-start-3 lg:col-start-auto">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-neutral-600"></span>
                <span className="terminal-dot bg-neutral-600"></span>
                <span className="terminal-dot bg-neutral-600"></span>
              </div>
              <span className="text-xs uppercase tracking-wider">STATUS</span>
            </div>
            <div className="panel-body">
              <div className="text-4xl mb-2" aria-hidden="true">
                🗃️
              </div>
              <p className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                Select a module
              </p>
            </div>
          </div>

          {/* IDEAS PANEL */}
          <div
            className={`terminal-panel ${activeNode === 'ideas' ? 'panel-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              const newState = activeNode === 'ideas' ? null : 'ideas';
              setActiveNode(newState);
              if (newState) {
                scrollIntoViewOnMobile('ideas-content');
              }
            }}
            onKeyDown={(e) => handlePanelKeyDown(e, 'ideas')}
            aria-expanded={activeNode === 'ideas'}
            aria-controls="ideas-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span
                  className={`terminal-dot ${activeNode === 'ideas' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
                <span
                  className={`terminal-dot ${activeNode === 'ideas' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
              </div>
              <span className="text-xs uppercase tracking-wider">CORE_VALUES</span>
            </div>
            <div className="panel-body">
              <div className="text-4xl mb-2" aria-hidden="true">
                🧠
              </div>
              <p className="text-sm text-neutral-400">Philosophy & Ethics</p>
            </div>
            <div
              className={`panel-content ${activeNode === 'ideas' ? '' : 'hidden'}`}
              id="ideas-content"
            >
              <p className="text-sm text-neutral-300 leading-relaxed">
                {mindMapContent.ideas.content}
              </p>
            </div>
          </div>

          {/* TECH PANEL */}
          <div
            className={`terminal-panel ${activeNode === 'tech' ? 'panel-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              const newState = activeNode === 'tech' ? null : 'tech';
              setActiveNode(newState);
              if (newState) {
                scrollIntoViewOnMobile('tech-content');
              }
            }}
            onKeyDown={(e) => handlePanelKeyDown(e, 'tech')}
            aria-expanded={activeNode === 'tech'}
            aria-controls="tech-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span
                  className={`terminal-dot ${activeNode === 'tech' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
                <span
                  className={`terminal-dot ${activeNode === 'tech' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
              </div>
              <span className="text-xs uppercase tracking-wider">TECH_STACK</span>
            </div>
            <div className="panel-body">
              <div className="text-4xl mb-2" aria-hidden="true">
                ⚡
              </div>
              <p className="text-sm text-neutral-400">Systems & Code</p>
            </div>
            <div
              className={`panel-content ${activeNode === 'tech' ? '' : 'hidden'}`}
              id="tech-content"
            >
              <p className="text-sm text-neutral-300 leading-relaxed">
                {mindMapContent.tech.content}
              </p>
            </div>
          </div>

          {/* ARSENAL PANEL */}
          <div
            className={`terminal-panel ${activeNode === 'projects' ? 'panel-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              const newState = activeNode === 'projects' ? null : 'projects';
              setActiveNode(newState);
              if (newState) {
                scrollIntoViewOnMobile('projects-content');
              }
            }}
            onKeyDown={(e) => handlePanelKeyDown(e, 'projects')}
            aria-expanded={activeNode === 'projects'}
            aria-controls="projects-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span
                  className={`terminal-dot ${activeNode === 'projects' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
                <span
                  className={`terminal-dot ${activeNode === 'projects' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
              </div>
              <span className="text-xs uppercase tracking-wider">THE_ARSENAL</span>
            </div>
            <div className="panel-body">
              <div className="text-4xl mb-2" aria-hidden="true">
                ⚙️
              </div>
              <p className="text-sm text-neutral-400">Tools & Environment</p>
            </div>
            <div
              className={`panel-content ${activeNode === 'projects' ? '' : 'hidden'}`}
              id="projects-content"
            >
              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <p>
                  <strong className="text-cyan-400">Legion 7i:</strong> Intel Core i9-14900HX @ 2.20
                  GHz, 32GB RAM, RTX 4070, 3200x2000 165Hz.
                </p>
                <p>
                  <strong className="text-cyan-400">Samsung Galaxy S24U:</strong> Snapdragon 8 Gen
                  3, 12GB RAM, Adreno 750, 3120x1440 120Hz QHD+.
                </p>
                <p className="text-neutral-400 italic">Power where it matters.</p>
              </div>
            </div>
          </div>

          {/* FUTURE PANEL */}
          <div
            className={`terminal-panel ${activeNode === 'dreams' ? 'panel-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              const newState = activeNode === 'dreams' ? null : 'dreams';
              setActiveNode(newState);
              if (newState) {
                scrollIntoViewOnMobile('dreams-content');
              }
            }}
            onKeyDown={(e) => handlePanelKeyDown(e, 'dreams')}
            aria-expanded={activeNode === 'dreams'}
            aria-controls="dreams-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span
                  className={`terminal-dot ${activeNode === 'dreams' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
                <span
                  className={`terminal-dot ${activeNode === 'dreams' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
              </div>
              <span className="text-xs uppercase tracking-wider">FUTURE_STATE</span>
            </div>
            <div className="panel-body">
              <div className="text-4xl mb-2" aria-hidden="true">
                🚀
              </div>
              <p className="text-sm text-neutral-400">Vision & Dreams</p>
            </div>
            <div
              className={`panel-content ${activeNode === 'dreams' ? '' : 'hidden'}`}
              id="dreams-content"
            >
              <p className="text-sm text-neutral-300 leading-relaxed">
                {mindMapContent.dreams.content}
              </p>
            </div>
          </div>

          {/* CONTACT PANEL */}
          <div
            className={`terminal-panel ${activeNode === 'contact' ? 'panel-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              const newState = activeNode === 'contact' ? null : 'contact';
              setActiveNode(newState);
              if (newState) {
                scrollIntoViewOnMobile('contact-content');
              }
            }}
            onKeyDown={(e) => handlePanelKeyDown(e, 'contact')}
            aria-expanded={activeNode === 'contact'}
            aria-controls="contact-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span
                  className={`terminal-dot ${activeNode === 'contact' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
                <span
                  className={`terminal-dot ${activeNode === 'contact' ? 'bg-cyan-400' : 'bg-neutral-600'}`}
                ></span>
              </div>
              <span className="text-xs uppercase tracking-wider">CONNECT</span>
            </div>
            <div className="panel-body">
              <div className="text-4xl mb-2" aria-hidden="true">
                📡
              </div>
              <p className="text-sm text-neutral-400">Communication Channels</p>
            </div>
            <div
              className={`panel-content ${activeNode === 'contact' ? '' : 'hidden'}`}
              id="contact-content"
            >
              <div className="space-y-2">
                <p className="text-sm">
                  <a
                    href="mailto:fusion@devakesu.com"
                    className="text-cyan-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    fusion@devakesu.com
                  </a>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <SocialIcon
                    href="https://www.linkedin.com/in/devakesu"
                    Icon={FaLinkedin}
                    title="LinkedIn"
                    platform="linkedin"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://github.com/devakesu/"
                    Icon={FaGithub}
                    title="GitHub"
                    platform="github"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://www.instagram.com/deva.kesu/"
                    Icon={FaInstagram}
                    title="Instagram"
                    platform="instagram"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://g.dev/devakesu"
                    Icon={FaGoogle}
                    title="Google Developer"
                    platform="google-dev"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://x.com/devakesu"
                    Icon={FaXTwitter}
                    title="X (Twitter)"
                    platform="x"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://www.facebook.com/deva4kesu"
                    Icon={FaFacebook}
                    title="Facebook"
                    platform="facebook"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://www.reddit.com/user/devakesu/"
                    Icon={FaReddit}
                    title="Reddit"
                    platform="reddit"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://pin.it/A7QjJQvTE"
                    Icon={FaPinterest}
                    title="Pinterest"
                    platform="pinterest"
                    onClick={handleSocialClick}
                  />
                  <SocialIcon
                    href="https://t.me/devakesu"
                    Icon={FaTelegram}
                    title="Telegram"
                    platform="telegram"
                    onClick={handleSocialClick}
                  />
                </div>
                <p className="text-sm text-neutral-400 mt-3">@devakesu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS & FOOTER SECTIONS */}
      <section
        id="projects"
        className="mx-auto max-w-6xl px-6 py-12 sm:py-24 mt-6 sm:mt-12 scroll-snap-section"
      >
        <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-12">
          {'//'} BUILD_LOG.db
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative border border-neutral-700 p-6 hover-glow transition-all duration-300">
            <div className="absolute -top-2 -left-2 h-2 w-2 bg-cyan-400"></div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-cyan-400">GhostClass</h3>
              <span className="text-xs uppercase tracking-wide text-green-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400"></span>
                Completed
              </span>
            </div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3 font-mono">
              Academic Survival Tool
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [Docker]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [AUTO_DEPLOY]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [PWA]
              </span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed mb-3">
              Real-time attendance analytics without the anxiety. Clean UI, clear insights,
              student-first design. Because you shouldn&apos;t need main-character energy to manage
              your degree.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                Next.js
              </span>
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                React
              </span>
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                TypeScript
              </span>
            </div>
            <div className="flex gap-3 mt-4 pt-3 border-t border-neutral-800">
              <a
                href="https://ghostclass.devakesu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                &gt; EXECUTE
              </a>
              <a
                href="https://github.com/devakesu/ghostclass"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                &gt; VIEW_SOURCE
              </a>
            </div>
          </div>

          <div className="relative border border-neutral-700 p-6 hover-glow transition-all duration-300">
            <div className="absolute -top-2 -left-2 h-2 w-2 bg-cyan-400"></div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-cyan-400">KaamBazaar™</h3>
              <span className="text-xs uppercase tracking-wide text-orange-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                In Progress
              </span>
            </div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3 font-mono">
              Hyperlocal Gig Economy
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [ALGORITHM]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [FLUTTER]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [GEOLOCATION]
              </span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed mb-3">
              A hyperlocal marketplace algorithm connecting students with neighborhood micro-gigs.
              Solves the &ldquo;Micro-Earning Void&rdquo; in Kochi, especially for young adults.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                Kotlin
              </span>
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                Python
              </span>
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                React
              </span>
              <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded border border-cyan-400/30">
                TypeScript
              </span>
            </div>
          </div>

          <div className="relative border border-neutral-700 p-6 hover-glow transition-all duration-300">
            <div className="absolute -top-2 -left-2 h-2 w-2 bg-cyan-400"></div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-cyan-400">What&apos;s Next?</h3>
              <span className="text-xs uppercase tracking-wide text-blue-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                Planning
              </span>
            </div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3 font-mono">
              Future State
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [C++]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [AI_ETHICS]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [HFT]
              </span>
              <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/50 font-mono uppercase tracking-wider">
                [SYSTEMS]
              </span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              I’m spending time understanding problems before deciding what deserves to be built.
              Augmenting Intelligence exploring how intelligent systems can handle the mundane,
              repetitive tasks of daily life - freeing us up to focus on the creative and the
              meaningful. No fixed roadmap. Only deliberate direction.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT FOOTER */}
      <footer
        id="contact"
        className="mx-auto max-w-6xl px-6 py-12 pb-24 sm:pb-12 border-t border-neutral-800 mt-12 scroll-snap-section"
      >
        <div className="text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-cyan-400 italic mb-3 sm:mb-4 font-light">
            &ldquo;Love is the only way to rescue humanity from all evils.&rdquo;
          </p>

          {/* Terminal Output Section */}
          <div className="max-w-3xl mx-auto mt-8 sm:mt-10 mb-6 sm:mb-8 bg-black/40 border border-neutral-700 rounded p-3 sm:p-4 text-left font-mono text-sm">
            {booting ? (
              <div className="text-green-400 space-y-0.5 sm:space-y-1">
                <div>&gt; SYSTEM_BOOT_SEQUENCE_INITIATED...</div>
                <div>
                  &gt; MOUNTING_FILESYSTEM... <span className="text-green-400">[OK]</span>
                </div>
                <div>
                  &gt; LOADING_KERNEL_MODULES... <span className="animate-pulse">_</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-green-400 mb-2 sm:mb-3">
                  <span className="text-cyan-400">root@devakesu</span>:
                  <span className="text-blue-400">~</span>$ ls_skills --verbose
                </div>
                <div className="space-y-1 sm:space-y-1.5 text-neutral-300">
                  <div>
                    <span className="text-cyan-400">&gt; LANGUAGES:</span> Python{' '}
                    <span className="text-green-400">[90%]</span>, TypeScript, Java/Kotlin{' '}
                    <span className="text-yellow-400">[Loading...]</span>, C/C++{' '}
                    <span className="text-yellow-400">[Compiling...]</span>, PHP
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; INTERESTS:</span>{' '}
                    <span aria-hidden="true">👨‍💻🌳⚛️🔬🎨🧪✨️👷🏽‍♀️🔭🎵🏏🍽🌷💅❤️☮️⚖️♻️🏳️‍🌈</span>
                    <span className="sr-only">
                      Technology: coding, React, and science. Creative pursuits: art,
                      experimentation, and innovation. Hobbies: astronomy, music, cricket, food,
                      gardening, and self-care. Values: love, peace, justice, sustainability, and
                      LGBTQ+ equality.
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; SERVER:</span> Kochi, IN{' '}
                    <span className="text-neutral-500">(UTC+05:30)</span>{' '}
                    <span className="text-green-400">[{currentTime}]</span>
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; UPTIME:</span>{' '}
                    <span className="text-green-400 font-bold">{uptime} years</span>{' '}
                  </div>

                  <div className="border-t border-neutral-800 my-1 sm:my-1.5 opacity-50"></div>

                  <div>
                    <span className="text-cyan-400">&gt; BUILD_ID:</span>{' '}
                    {meta?.github_run_id && meta?.github_repo ? (
                      <a
                        href={`https://github.com/${meta.github_repo}/actions/runs/${meta.github_run_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 hover:underline"
                      >
                        #{meta.build_id || 'N/A'}
                      </a>
                    ) : (
                      <span className="text-green-400">#{meta?.build_id || 'N/A'}</span>
                    )}{' '}
                    <span className="text-neutral-600">
                      (
                      {meta?.commit_sha && meta?.github_repo ? (
                        <a
                          href={`https://github.com/${meta.github_repo}/commit/${meta.commit_sha}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 hover:underline"
                        >
                          {meta.commit_sha.substring(0, 7)}
                        </a>
                      ) : (
                        meta?.commit_sha?.substring(0, 7) || 'unknown'
                      )}
                      )
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; DEPLOYED:</span>{' '}
                    {meta?.timestamp ? (
                      <>
                        {meta.timestamp.split('T')[0]}{' '}
                        <span className="text-neutral-500">
                          {meta.timestamp.split('T')[1]?.replace('Z', ' UTC')}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-500">Local Mode</span>
                    )}
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; SECURITY:</span>{' '}
                    <span
                      className={
                        meta?.audit_status?.includes('PASSED')
                          ? 'text-green-400'
                          : meta?.audit_status === 'SKIPPED'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {meta?.audit_status || 'UNKNOWN'}
                    </span>{' '}
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; PROVENANCE:</span>{' '}
                    {meta?.signature_status === 'SLSA_PROVENANCE_GENERATED' && meta?.github_repo ? (
                      <a
                        href={`https://github.com/${meta.github_repo}/attestations`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-dashed text-blue-400 border-blue-400 hover:text-blue-300 hover:border-blue-300"
                        title="SLSA Level 3 Verified - Click to view attestations"
                      >
                        {meta.signature_status}
                      </a>
                    ) : (
                      <span
                        className={`border-b border-dashed cursor-help ${
                          meta?.signature_status === 'SLSA_PROVENANCE_GENERATED'
                            ? 'text-blue-400 border-blue-400'
                            : meta?.signature_status === 'UNSIGNED'
                              ? 'text-yellow-400 border-yellow-400'
                              : 'text-neutral-400 border-neutral-400'
                        }`}
                        title={
                          meta?.signature_status === 'SLSA_PROVENANCE_GENERATED'
                            ? 'SLSA Level 3 Verified'
                            : 'Development Mode'
                        }
                      >
                        {meta?.signature_status || 'UNKNOWN'}
                      </span>
                    )}{' '}
                    {meta?.signature_status === 'SLSA_PROVENANCE_GENERATED' && (
                      <span className="text-green-400"> ✔ Verified</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm mb-4 sm:mb-6">
            <a
              href="mailto:fusion@devakesu.com"
              className="text-cyan-400 hover:underline break-all"
            >
              fusion@devakesu.com
            </a>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">@devakesu</span>
          </div>
          <p className="text-sm md:text-base text-neutral-300 uppercase tracking-wider leading-relaxed mt-4 sm:mt-8 font-mono">
            #LovePeaceJustice #ScienceForGood #HumanCenteredTech
            <br />
            #UnitedNations #SustainableFutures
          </p>

          <p className="mt-8 mb-12 sm:mb-2 text-xs text-neutral-500">
            © {new Date().getFullYear()} Devanarayanan. All rights reserved.
            <br />
            <a href="/legal" className="text-cyan-400 hover:underline">
              Legal & Privacy
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
