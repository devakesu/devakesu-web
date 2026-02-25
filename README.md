# 🚀 DEVAKESU - Portfolio

**Where code meets conscience.** A brutalist × cyberpunk portfolio built with Next.js 16.

[![Version](https://img.shields.io/badge/version-1.1.1-cyan?logo=github)](package.json)
[![Security: SLSA Level 3](https://img.shields.io/badge/SLSA-Level%203-brightgreen)](https://github.com/devakesu/devakesu-web/attestations)
[![Security Scan: Trivy](https://img.shields.io/badge/Security-Trivy%20Scanned-blue)](.github/workflows/deploy.yml)
[![Attestations](https://img.shields.io/badge/Attestations-Enabled-success)](https://github.com/devakesu/devakesu-web/attestations)
[![Build Status](https://img.shields.io/badge/Build-Passing-success)](.github/workflows/deploy.yml)

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React Icons](https://img.shields.io/badge/React%20Icons-5.5-e91e63?logo=react&logoColor=white)](https://react-icons.github.io/react-icons/)

## ✨ Features

### 🎨 Design & UX

- **Cyberpunk Aesthetic** - Glitch effects, VHS flicker, scanlines, neon glow
- **Floating Background Icons** - Hardware, trading & physics icons layered at low opacity across the full page
- **Interactive Elements** - Laser cursor, parallax scrolling, click burst animations
- **Smooth Section Scrolling** - Ultra-smooth one-section-per-scroll navigation on desktop
- **Haptic Feedback** - Mobile vibration on interactions
- **Scroll Reveals** - Progressive content disclosure
- **Responsive Design** - Mobile-first, optimized for all devices
- **Adaptive Input** - Section scroll on desktop, native scroll on touch devices
- **Terminal UI** - Real-time build metadata display

### 🔒 Security

- ✅ **SLSA Level 3 Provenance** - Supply chain security
- ✅ **GitHub Attestations** - Verifiable build provenance in GitHub UI
- ✅ **Sigstore Signatures** - Cryptographic signing with cosign
- ✅ **Trivy Vulnerability Scanning** - Automated CVE detection
- ✅ **SBOM Generation** - CycloneDX format for transparency
- ✅ **Security Headers** - CSP, X-Frame-Options
- ✅ **No Third-Party Tracking** - Privacy-first approach
- ✅ **XSS/CSRF Protection** - React & Next.js built-in
- ✅ **Secure Dependencies** - Regular audits & updates

### ⚡ Performance

- **Next.js 16** with Turbopack - Lightning-fast builds
- **RequestAnimationFrame** - Smooth 60fps animations
- **Optimized Scroll Handlers** - Efficient section-wise navigation with coarse pointer detection
- **Memoized Components** - useCallback/useMemo to prevent unnecessary re-renders
- **Lazy Loading** - Scripts load on demand
- **Image Optimization** - AVIF/WebP support with Next.js Image component
- **Bundle Size** - ~145KB first load (gzipped)
- **Core Web Vitals** - LCP < 1.5s, FID < 50ms, CLS < 0.05
- **CSS-based Tailwind** - Zero-runtime styling
- **Reduced Motion Support** - Respects user accessibility preferences

### ♿ Accessibility

- **WCAG 2.1 Level AA compliant**
- **Semantic HTML** structure
- **ARIA labels** for screen readers
- **Keyboard navigation** support (Arrow keys, PageUp/PageDown, Space)
- **High contrast design** (#00ffff on black)
- **Reduced motion support** - Disables animations when `prefers-reduced-motion: reduce` is set
- **Focus indicators** - Clear visual feedback for keyboard navigation
- **Alt text** for all images
- **Screen reader friendly** - Hidden decorative content, accessible descriptions

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.9 (strict mode, full coverage)
- **Styling**: Tailwind CSS 4.1.18 (CSS-based configuration)
- **Fonts**: Space Grotesk, JetBrains Mono
- **Icons**: React Icons 5.5.0 (hardware, trading, physics, social)
- **Analytics**: Server-side Google Analytics (optional)
- **Deployment**: Coolify (Self-hosted)
- **CI/CD**: GitHub Actions with SLSA provenance & Lighthouse CI

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/devakesu/devakesu-web.git
cd devakesu-web

# Install dependencies
npm ci

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```text
devakesu-web/
├── app/
│   ├── api/
│   │   └── analytics/
│   │       └── route.ts          # Server-side analytics API
│   ├── legal/
│   │   └── page.tsx              # Privacy & legal policies
│   ├── page.tsx                  # Main portfolio page (Client Component)
│   ├── layout.tsx                # Root layout with fonts & scripts
│   ├── globals.css               # Global styles, animations & scroll config
│   ├── not-found.tsx             # Custom 404 page
│   └── sitemap.ts                # Dynamic XML sitemap
├── components/
│   ├── Analytics.tsx             # Client analytics component
│   └── ErrorHandler.tsx          # Global error boundary
├── lib/
│   ├── analytics.ts              # Analytics helper functions
│   ├── analytics-config.ts       # Analytics configuration
│   └── legal.ts                  # Legal content (privacy, terms, cookies)
├── public/
│   ├── js/
│   │   ├── cursor.js             # Laser cursor effect
│   │   ├── parallax.js           # Background parallax motion
│   │   └── reactive-glow.js      # Interactive glow system
│   ├── profile.jpg               # Profile image
│   └── meta.json                 # Build metadata (generated by CI/CD)
├── scripts/
│   └── generate-meta.js          # Build metadata generator
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline with SLSA provenance
├── .vscode/                      # VSCode workspace settings
├── next.config.mjs               # Next.js configuration
├── proxy.ts                      # CSP middleware with per-request nonces
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── lighthouserc.json             # Lighthouse CI thresholds (desktop)
├── lighthouserc.mobile.json      # Lighthouse CI thresholds (mobile)
├── package.json                  # Dependencies & scripts
├── SECURITY.md                   # Security policy & reporting
├── .env.example                  # Environment variable template
└── README.md                     # This file
```

---

## 🔒 Security Measures

### Application Security

- **SLSA Level 3 Provenance** - Verifiable build integrity
- **GitHub Attestations** - Build provenance visible in repository UI
- **Sigstore Signing** - Keyless image signing with cosign
- **SBOM** - Software Bill of Materials (CycloneDX format)
- **Trivy Scanning** - Automated vulnerability detection in CI/CD
- **Security Headers**:
  - `X-Frame-Options: SAMEORIGIN` - Same-origin-only framing to mitigate clickjacking
  - `X-Content-Type-Options: nosniff` - MIME sniffing prevention
  - `Referrer-Policy: strict-origin-when-cross-origin` - Enhanced privacy
  - `Strict-Transport-Security` - HSTS with preload (production only)
  - `Permissions-Policy` - Feature restrictions
  - Content Security Policy with nonces (via middleware.js)
- **React Strict Mode** - Development safety checks
- **No Powered-By Header** - Reduced information disclosure

### Code Security

- All external links use `rel="noopener noreferrer"`
- Scripts loaded via Next.js Script component (CSP-friendly)
- No inline scripts or eval()
- Try-catch error boundaries in all JS modules
- Null/undefined checks with optional chaining

### Privacy

- ✅ **Server-side Google Analytics** (optional, CSP-compliant)
- ✅ **No client-side tracking scripts**
- ✅ **No new cookies or persistent storage is created by this app** – the app itself never sets client-side cookies or other persistent client identifiers. For optional server-side GA, a per-request client ID is generated. If Google Analytics cookies (such as `_ga` or `_ga_*`) already exist in your browser because of other sites you've visited, they may be read and reused server-side but are never created, modified, or refreshed by this app. SessionStorage is used temporarily for analytics de-duplication during the session only.
- ✅ **Zero third-party requests from the browser** – all frontend assets are self-hosted and, even when optional analytics is enabled, the browser only talks to same-origin endpoints (e.g. `/api/analytics`); any contact with Google for analytics happens server-side only and no external tracking scripts are loaded in the browser
- ✅ **GDPR compliant** by design
- ✅ **Privacy-first architecture**
- ✅ **Transparent data handling** - See `/legal` page for full privacy policy
- ✅ **Cache-busting for dev** - Fresh content on every reload during development

### Reporting Vulnerabilities

If you discover a security vulnerability in this project, please report it privately:

- **Email**: [fusion@devakesu.com](mailto:fusion@devakesu.com)
- **Subject**: Security Vulnerability Report
- **See**: [SECURITY.md](SECURITY.md) for detailed reporting guidelines

---

## 🎨 Customization

### Colors

The cyan accent color is defined in `app/globals.css`:

```css
--color-accent: #00ffff;
```

### Fonts

Fonts are loaded in `app/layout.js`:

- **Space Grotesk** - Body text
- **JetBrains Mono** - Terminal/code elements

### Content

Edit `app/page.js` to update:

- Personal information
- Projects showcase
- Skills and tech stack
- Contact information

### Build Metadata

The terminal displays real build data from `/public/meta.json`, which is automatically generated during the build process via the `prebuild` script. In production (Coolify), it uses environment variables from the git repository. In CI, it includes audit and provenance status. The file is cached with a 5-minute TTL in production for performance, and uses `no-store` in development to ensure fresh updates on every reload.

### Favicon

The primary favicon for the App Router is located at `app/favicon.svg` and is served by Next.js as `/favicon.svg`. Browsers may also request `/favicon.ico`; to support that explicitly, add a `favicon.ico` file under `public/` or configure a redirect/route to the SVG favicon as needed.

---

## 🚢 Deployment

### Automated CI/CD Pipeline

The project uses GitHub Actions with a secure, multi-stage pipeline:

1. **Guard** - Lint and build validation
2. **Security Audit** - Trivy vulnerability scanning
3. **Build & Sign** - Docker image build with SBOM, Sigstore signing, and GitHub attestations
4. **Deploy** - Coolify deployment via webhook

#### Attestation & Verification

Every production build generates:

- **GitHub Attestations** - Visible at [github.com/devakesu/devakesu-web/attestations](https://github.com/devakesu/devakesu-web/attestations)
- **Cosign Signatures** - Stored in OCI registry
- **SBOM** - CycloneDX format bill of materials

Verify the image:

```bash
# Using GitHub CLI
gh attestation verify oci://ghcr.io/devakesu/devakesu-web:latest --owner devakesu

# Using cosign
cosign verify ghcr.io/devakesu/devakesu-web:latest
cosign verify-attestation ghcr.io/devakesu/devakesu-web:latest --type slsaprovenance
```

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml) for details.

### Required Secrets

Add these to your GitHub repository secrets:

- `COOLIFY_BASE_URL` - Your Coolify instance URL
- `COOLIFY_APP_ID` - Application UUID
- `COOLIFY_API_TOKEN` - API authentication token

### Optional: Google Analytics (Server-Side)

To enable privacy-friendly, server-side Google Analytics:

1. Create a Google Analytics 4 property
2. Go to Admin → Data Streams → Select your stream → Measurement Protocol API secrets
3. Create an API secret
4. Add environment variables to your deployment:

   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
   NEXT_PUBLIC_ANALYTICS_ENABLED=true
   GA_MEASUREMENT_ID=G-XXXXXXXXXX
   GA_API_SECRET=your_api_secret_here
   ```

   **Note**:
   - `NEXT_PUBLIC_ANALYTICS_ENABLED=true` must be set to enable the client-side Analytics component and automatic page view tracking. Without this flag, the Analytics component is not rendered, avoiding unnecessary API requests.
   - When enabling server-side analytics in production (i.e., when GA env vars are set), `NEXT_PUBLIC_SITE_URL` is required for origin validation to ensure requests only come from your domain.

The implementation uses Google Analytics Measurement Protocol, which:

- ✅ No client-side scripts (CSP-compliant)
- ✅ No cookies or persistent storage (sessionStorage used only for de-duplication)
- ✅ Server-side tracking only
- ✅ Privacy-first design

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the .next/standalone or dist folder to your hosting provider
```

---

## 📊 Performance Metrics

### Lighthouse Scores (Estimated)

- **Performance**: 96/100
- **Accessibility**: 94/100
- **Best Practices**: 100/100
- **SEO**: 95/100

### Bundle Analysis

- **JavaScript**: ~50KB (gzipped)
- **CSS**: ~15KB (gzipped)
- **Fonts**: ~80KB (cached)
- **Total First Load**: ~145KB ✅

---

## 🧪 Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code (requires prettier)
npx prettier --write .
```

### Recommended VSCode Extensions

The project includes `.vscode/extensions.json` with:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitHub Copilot

---

## 🤝 Contributing

This is a personal portfolio, but suggestions and bug reports are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📡 Contact

### Devanarayanan (Kesu)

- 🌐 Website: [devakesu.com](https://devakesu.com)
- 📧 Email: [fusion@devakesu.com](mailto:fusion@devakesu.com)
- 💼 LinkedIn: [@devakesu](https://linkedin.com/in/devakesu)
- 🐙 GitHub: [@devakesu](https://github.com/devakesu)
- 📸 Instagram: [@deva.kesu](https://instagram.com/deva.kesu)
- 🐦 X (Twitter): [@devakesu](https://x.com/devakesu)
- 👨‍💻 Google Dev: [g.dev/devakesu](https://g.dev/devakesu)
- 🔵 Facebook: [@deva4kesu](https://facebook.com/deva4kesu)
- 🤖 Reddit: [u/devakesu](https://reddit.com/user/devakesu)
- 📌 Pinterest: [devakesu](https://pin.it/A7QjJQvTE)
- ✈️ Telegram: [@devakesu](https://t.me/devakesu)

---

**Built with ❤️, ☮️, and ⚖️**  
_Love is the only way to rescue humanity from all evils._

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [SLSA Framework](https://slsa.dev)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated**: February 25, 2026  
**Version**: 1.1.1
