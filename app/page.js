'use client';

// Note: This is a large client component. Consider refactoring to split static content
// into server components in the future to reduce client-side JS bundle size.

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

export default function Home() {
  const [activeNode, setActiveNode] = useState(null);
  const [meta, setMeta] = useState(null);
  const [booting, setBooting] = useState(true);

  // Calculate Real Age (Uptime)
  const birthYear = 2006;
  const uptime = new Date().getFullYear() - birthYear;

  const taglines = [
    'Human. Machine. Something in between.',
    'Signal found. Noise reduced.',
    'Unlearning defaults, engineering futures.',
    'System awake // latency minimal.',
    'Building kinder tech in a chaotic world.',
  ];

  const [currentTagline, setCurrentTagline] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Cycle through taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [taglines.length]);

  // Fetch Build Metadata
  useEffect(() => {
    let timeoutId;
    
    fetch('/meta.json')
      .then((res) => res.json())
      .then((data) => {
        setMeta(data);
        timeoutId = setTimeout(() => setBooting(false), 800);
      })
      .catch(() => {
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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Update time every second for UTC+5:30
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcOffset = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds
      const istTime = new Date(now.getTime() + utcOffset);

      const hours = String(istTime.getUTCHours()).padStart(2, '0');
      const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');

      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
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

  const handlePanelKeyDown = (event, nodeId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveNode(activeNode === nodeId ? null : nodeId);
    }
  };

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
          <div className="mx-auto max-w-6xl px-6 py-8 sm:py-12 lg:py-16">
            {/* Profile Image - Mobile First */}
            <div className="flex justify-center mb-4 lg:hidden">
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
                  <h1
                    className="glitch text-3xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] uppercase flex flex-wrap items-baseline gap-x-2 sm:gap-x-3 lg:gap-x-4 gap-y-1"
                    data-text="DEVANARAYANAN"
                  >
                    DEVANARAYANAN
                    <span className="text-xs sm:text-2xl lg:text-3xl text-neutral-400 font-normal ml-2 sm:ml-3 lg:ml-4 whitespace-nowrap">
                      (KESU)
                    </span>
                  </h1>
                  <p className="text-base sm:text-xl text-cyan-400 uppercase tracking-wide">
                    @devakesu
                  </p>
                </div>
                <h3
                  className="glitch text-xl sm:text-4xl lg:text-5xl text-cyan-400 uppercase mt-2 sm:mt-4 lg:!mt-20"
                  data-text="Where code meets conscience"
                >
                  Where code meets conscience
                </h3>

                <p className="max-w-2xl text-neutral-300/90 text-sm sm:text-lg leading-relaxed lg:mt-8 min-h-[3rem]">
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
                <div className="hidden lg:flex justify-center mb-6">
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

                <div className="relative p-6 sm:p-8 border border-neutral-700 shadow-[0_8px_0_0_rgba(255,255,255,0.1)] hover-glow transition-all duration-300">
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
              <div className="text-4xl mb-2" aria-hidden="true">🗃️</div>
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
              <div className="text-4xl mb-2" aria-hidden="true">🧠</div>
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
              <div className="text-4xl mb-2" aria-hidden="true">⚡</div>
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
              <div className="text-4xl mb-2" aria-hidden="true">⚙️</div>
              <p className="text-sm text-neutral-400">Tools & Environment</p>
            </div>
            <div
              className={`panel-content ${activeNode === 'projects' ? '' : 'hidden'}`}
              id="projects-content"
            >
              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <p>
                  <strong className="text-cyan-400">Legion 7i:</strong> Intel Core i9-14900HX @
                  2.20 GHz, 32GB RAM, RTX 4070, 3200x2000 165Hz.
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
              <div className="text-4xl mb-2" aria-hidden="true">🚀</div>
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
              <div className="text-4xl mb-2" aria-hidden="true">📡</div>
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://github.com/devakesu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="GitHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaGithub />
                  </a>
                  <a
                    href="https://www.instagram.com/deva.kesu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Instagram"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://g.dev/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Google Developer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaGoogle />
                  </a>
                  <a
                    href="https://x.com/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="X (Twitter)"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaXTwitter />
                  </a>
                  <a
                    href="https://www.facebook.com/deva4kesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Facebook"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaFacebook />
                  </a>
                  <a
                    href="https://www.reddit.com/user/devakesu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Reddit"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaReddit />
                  </a>
                  <a
                    href="https://pin.it/A7QjJQvTE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Pinterest"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaPinterest />
                  </a>
                  <a
                    href="https://t.me/devakesu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl"
                    title="Telegram"
                    onClick={(e) => e.stopPropagation()}
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
        className="mx-auto max-w-6xl px-6 py-12 border-t border-neutral-800 mt-12 scroll-snap-section"
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
                    👨‍💻🌳⚛️🔬🎨🧪✨️👷🏽‍♀️🔭🎵🏏🍽🌷💅❤️☮️⚖️♻️🏳️‍🌈
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

          <div className="flex items-center justify-center gap-3 text-sm mb-4">
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

          <p className="mt-6 text-xs text-neutral-500">
            © {new Date().getFullYear()} Devanarayanan. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
