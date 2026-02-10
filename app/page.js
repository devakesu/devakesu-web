'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
const TOUCH_THRESHOLD_PX = 60;
const MIN_WHEEL_DELTA = 5;

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
  const sectionRefs = useRef([]);
  const activeSectionIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const unlockTimeoutRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchIsVerticalRef = useRef(null);
  const touchStartedWithinScrollableRef = useRef(false);

  // Approximate uptime in years based on birth year
  const birthYear = 2006;
  const uptime = new Date().getFullYear() - birthYear;

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

  // Update time every second for UTC+5:30 (IST)
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });

    const updateTime = () => {
      const formattedTime = formatter.format(new Date());
      setCurrentTime(formattedTime);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
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
    sectionRefs.current = sections;

    if (sections.length <= 1) {
      return undefined;
    }

    const resolveElement = (target) => {
      if (target instanceof Element) return target;
      return target?.parentElement ?? null;
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
        const computed = window.getComputedStyle(current);
        const overflowY = computed.overflowY;
        const canScroll = current.scrollHeight - current.clientHeight > 1;
        if ((overflowY === 'auto' || overflowY === 'scroll') && canScroll) {
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
      const nextIndex = Math.min(
        sections.length - 1,
        Math.max(0, activeSectionIndexRef.current + direction)
      );

      if (nextIndex === activeSectionIndexRef.current) {
        return;
      }

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
      if (event.ctrlKey || allowNativeScroll(event.target, event.deltaY > 0 ? 1 : -1)) {
        return;
      }

      event.preventDefault();

      if (isAnimatingRef.current || Math.abs(event.deltaY) < MIN_WHEEL_DELTA) {
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
      const interactiveAncestor = target.closest('input, textarea, select, button, a, [contenteditable="true"]');
      
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

      if (!isAnimatingRef.current) {
        scrollToSection(direction);
      }

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

    const handleScroll = () => {
      if (!isAnimatingRef.current) {
        syncSectionIndex();
      }
    };

    const handleResize = () => {
      syncSectionIndex();
    };

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
      setActiveNode((prevActiveNode) => (prevActiveNode === nodeId ? null : nodeId));
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
        {/* Parallax layers */}
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl parallax-layer"
          data-depth="0.15"
        ></div>

        <div
          className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl parallax-layer"
          data-depth="0.25"
        ></div>

        {/* Background grid (also parallaxed) */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#00ffff20,transparent_60%)] pointer-events-none parallax-layer"
          data-depth="0.05"
        ></div>

        {/* Cyan glow blobs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl"></div>

        {/* Content */}
        <div className="relative scanlines">
          <div className="mx-auto max-w-6xl px-6 pt-8 sm:pt-12 lg:pt-16 pb-2 sm:pb-4 lg:pb-6">
            {/* Profile Image - Mobile First */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="profile-image-container">
                <Image
                  src="/profile.jpg"
                  alt="devakesu Profile"
                  width={200}
                  height={200}
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
                <h3
                  className="glitch text-xl sm:text-4xl lg:text-5xl text-cyan-400 uppercase mt-2 sm:mt-4 lg:mt-8"
                  data-text="Where code meets conscience"
                >
                  Where code meets conscience
                </h3>

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
      <section id="manifesto" className="mx-auto max-w-6xl px-6 py-24 mt-24 scroll-snap-section">
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
      <section id="worldview" className="mx-auto max-w-6xl px-6 py-24 mt-12 scroll-snap-section">
        <div className="border-l-2 border-cyan-400/50 pl-6">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-8">
            {'//'} WORLDVIEW.sys
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-300">
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
      <section id="explore" className="mx-auto max-w-6xl px-6 py-24 mt-12 scroll-snap-section">
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
            onClick={() => setActiveNode(activeNode === 'ideas' ? null : 'ideas')}
            onKeyDown={(e) => handlePanelKeyDown(e, 'ideas')}
            aria-expanded={activeNode === 'ideas'}
            aria-controls="ideas-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-cyan-400"></span>
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
            onClick={() => setActiveNode(activeNode === 'tech' ? null : 'tech')}
            onKeyDown={(e) => handlePanelKeyDown(e, 'tech')}
            aria-expanded={activeNode === 'tech'}
            aria-controls="tech-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-neutral-600"></span>
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
            onClick={() => setActiveNode(activeNode === 'projects' ? null : 'projects')}
            onKeyDown={(e) => handlePanelKeyDown(e, 'projects')}
            aria-expanded={activeNode === 'projects'}
            aria-controls="projects-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-neutral-600"></span>
                <span className="terminal-dot bg-neutral-600"></span>
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
            onClick={() => setActiveNode(activeNode === 'dreams' ? null : 'dreams')}
            onKeyDown={(e) => handlePanelKeyDown(e, 'dreams')}
            aria-expanded={activeNode === 'dreams'}
            aria-controls="dreams-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-neutral-600"></span>
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
            onClick={() => setActiveNode(activeNode === 'contact' ? null : 'contact')}
            onKeyDown={(e) => handlePanelKeyDown(e, 'contact')}
            aria-expanded={activeNode === 'contact'}
            aria-controls="contact-content"
          >
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-cyan-400"></span>
                <span className="terminal-dot bg-neutral-600"></span>
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
                  <a
                    href="https://www.linkedin.com/in/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="LinkedIn"
                    aria-label="LinkedIn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('linkedin');
                    }}
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://github.com/devakesu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="GitHub"
                    aria-label="GitHub"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('github');
                    }}
                  >
                    <FaGithub />
                  </a>
                  <a
                    href="https://www.instagram.com/deva.kesu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Instagram"
                    aria-label="Instagram"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('instagram');
                    }}
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://g.dev/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Google Developer"
                    aria-label="Google Developer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('google-dev');
                    }}
                  >
                    <FaGoogle />
                  </a>
                  <a
                    href="https://x.com/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="X (Twitter)"
                    aria-label="X (Twitter)"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('x');
                    }}
                  >
                    <FaXTwitter />
                  </a>
                  <a
                    href="https://www.facebook.com/deva4kesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Facebook"
                    aria-label="Facebook"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('facebook');
                    }}
                  >
                    <FaFacebook />
                  </a>
                  <a
                    href="https://www.reddit.com/user/devakesu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Reddit"
                    aria-label="Reddit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('reddit');
                    }}
                  >
                    <FaReddit />
                  </a>
                  <a
                    href="https://pin.it/A7QjJQvTE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Pinterest"
                    aria-label="Pinterest"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('pinterest');
                    }}
                  >
                    <FaPinterest />
                  </a>
                  <a
                    href="https://t.me/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Telegram"
                    aria-label="Telegram"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('telegram');
                    }}
                  >
                    <FaTelegram />
                  </a>
                </div>
                <p className="text-sm text-neutral-400 mt-3">@devakesu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS & FOOTER SECTIONS */}
      <section id="projects" className="mx-auto max-w-6xl px-6 py-24 mt-12 scroll-snap-section">
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
        className="mx-auto max-w-6xl px-6 py-12 pb-0 sm:pb-12 border-t border-neutral-800 mt-12 scroll-snap-section"
      >
        <div className="text-center">
          <p className="text-xl sm:text-2xl text-cyan-400 italic mb-4 font-light">
            &ldquo;Love is the only way to rescue humanity from all evils.&rdquo;
          </p>

          {/* Terminal Output Section */}
          <div className="max-w-3xl mx-auto mt-8 mb-6 bg-black/40 border border-neutral-700 rounded p-4 text-left font-mono text-sm">
            {booting ? (
              <div className="text-green-400 space-y-1">
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
                <div className="text-green-400 mb-3">
                  <span className="text-cyan-400">root@devakesu</span>:
                  <span className="text-blue-400">~</span>$ list_skills --verbose
                </div>
                <div className="space-y-1.5 text-neutral-300">
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

                  <div className="border-t border-neutral-800 my-1.5 opacity-50"></div>

                  <div>
                    <span className="text-cyan-400">&gt; BUILD_ID:</span>{' '}
                    <span className="text-green-400">#{meta?.build_id || 'N/A'}</span>{' '}
                    <span className="text-neutral-600">
                      ({meta?.commit_sha?.substring(0, 7) || 'unknown'})
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
                    {meta?.audit_status?.includes('PASSED') && (
                      <span className="text-neutral-500">(Trivy: 0 Vulns)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-cyan-400">&gt; PROVENANCE:</span>{' '}
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
                    </span>{' '}
                    {meta?.signature_status === 'SLSA_PROVENANCE_GENERATED' && (
                      <span className="text-green-400"> ✔ Verified</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 text-sm mb-6">
            <a href="mailto:fusion@devakesu.com" className="text-cyan-400 hover:underline">
              fusion@devakesu.com
            </a>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">@devakesu</span>
          </div>
          <p className="text-sm sm:text-base text-neutral-300 uppercase tracking-wider leading-relaxed mt-8 font-mono">
            #LovePeaceJustice #ScienceForGood #HumanCenteredTech
            <br />
            #UnitedNations #SustainableFutures
          </p>

          <p className="mt-8 mb-2 text-xs text-neutral-500">
            © {new Date().getFullYear()} Devanarayanan. All rights reserved.
            <br />
            <a href="/legal" className="text-cyan-400 hover:underline">
              Privacy & Legal
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
