# 🌱 Canopy

**Grow your impact, shrink your footprint.**

Canopy is a gamified carbon footprint awareness platform that helps consumers understand, track, and reduce their personal carbon emissions through behavioural nudging, real-time calculations, and a living digital terrarium that reflects their environmental impact.

> **Live Demo:** [canopy-gamma-five.vercel.app](https://canopy-gamma-five.vercel.app)

---

## 📋 Table of Contents

- [Chosen Vertical](#chosen-vertical)
- [Approach & Logic](#approach--logic)
- [How the Solution Works](#how-the-solution-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Assumptions](#assumptions)
- [Security](#security)
- [Accessibility](#accessibility)
- [Project Structure](#project-structure)

---

## 🎯 Chosen Vertical

**Climate & Sustainability — Consumer Carbon Footprint Reduction**

The climate crisis demands actionable tools that bridge the gap between awareness and behaviour change. Most people know carbon emissions are a problem but lack the feedback mechanisms to understand how their daily choices contribute. Canopy addresses this by making carbon tracking:

- **Personal** — Individual baseline assessment via interactive onboarding (9 questions, under 60 seconds)
- **Gamified** — Streaks, shields, and a living "Digital Terrarium" that visualizes environmental impact
- **Actionable** — Daily micro-actions with measured CO₂ savings (one-tap completion)
- **Insightful** — Personalized recommendations based on the user's highest-impact categories
- **Accessible** — Mobile-first PWA with full keyboard/screen-reader support

---

## 🧠 Approach & Logic

### Design Philosophy

1. **Frictionless Onboarding** — Swipe-based card deck (Tinder-style) reduces cognitive load to a single gesture per question. Users establish their carbon baseline in under 60 seconds without typing.

2. **Behavioural Nudging** — Daily "micro-actions" are small, achievable habits (not overwhelming lifestyle overhauls). Each action shows its exact CO₂ saving, reinforcing the connection between effort and impact.

3. **Visual Feedback Loop** — The Digital Terrarium is an emotional anchor. It thrives when the user reduces emissions and withers when they disengage — leveraging loss aversion psychology.

4. **Data-Driven Calculations** — Emission factors sourced from EPA, DEFRA, and Climatiq reference data. The engine converts any activity (transport, food, energy, shopping) to kg CO₂e using peer-reviewed conversion factors.

5. **Security-First Auth** — Email OTP verification with Google SMTP, Google OAuth as a secondary path, bcrypt password hashing, timing-safe comparison, and token-bucket rate limiting on all auth endpoints.

### Calculation Engine Logic

```
CO₂ (kg) = Activity Quantity × Emission Factor × Frequency Multiplier
```

Example calculations:
| Activity | Calculation | Result |
|----------|------------|--------|
| Driving 15 miles (petrol car) | 15 × 0.404 | 6.06 kg CO₂ |
| Beef meal | 1 × 6.61 | 6.61 kg CO₂ |
| 100 kWh electricity | 100 × 0.417 | 41.7 kg CO₂ |
| Short-haul flight (1 hr) | 1 × 254.93 | 254.93 kg CO₂ |

### Gamification Logic

- **Streak System**: Consecutive daily logging earns streak bonuses (+10% points per 7-day period, capped at 2×)
- **Streak Shield**: Missing exactly 1 day doesn't break the streak if a shield is active (consumed on use)
- **Terrarium Health**: Composite score (0–100) derived from emission reduction %, streak length, and daily action completions
- **Points Economy**: Actions award points based on difficulty (Easy: 10, Medium: 25, Hard: 50) with streak multipliers

---

## ⚙️ How the Solution Works

### User Journey

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   AUTH       │────▶│  ONBOARDING  │────▶│  DASHBOARD   │────▶│   LOG / ACT  │────▶│   TRACK      │
│              │     │              │     │              │     │              │     │              │
│ Google OAuth │     │ 9 swipe cards│     │ Terrarium +  │     │ Record meals,│     │ Progress ring│
│ Email + OTP  │     │ establishes  │     │ stats + daily│     │ commute,     │     │ Category     │
│ Register/    │     │ baseline CO₂ │     │ micro-actions│     │ energy usage │     │ breakdown    │
│ Login        │     │ profile      │     │              │     │              │     │ Insights     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Authentication Flow

1. **Registration** — User provides name, email, password → server hashes password (bcrypt, cost 12) → sends 6-digit OTP to email via Google SMTP
2. **OTP Verification** — Timing-safe comparison with brute-force protection (max 5 attempts), 10-minute expiry
3. **Google OAuth** — Alternative path: redirects to Google consent screen → callback exchanges code for tokens → creates/finds user → sets session cookie
4. **Session** — Auth token stored in localStorage + HTTP cookie for OAuth; user ID passed via `x-user-id` header on subsequent requests

### Core Modules

| Module | Description |
|--------|-------------|
| **Carbon Engine** | Converts activities to CO₂e using EPA/DEFRA emission factors across 4 categories (transport, food, energy, shopping) |
| **Onboarding Deck** | Framer Motion drag/swipe cards with keyboard accessibility and progress tracking |
| **Digital Terrarium** | Dynamic SVG rendering that interpolates colour/growth/particles based on health score |
| **Action Cards** | One-tap daily habits with difficulty tiers (Easy/Medium/Hard) and measured CO₂ savings |
| **Gamification Engine** | Streak calculator with shield mechanic, point multipliers, and composite health scoring |
| **Carbon Tracker** | Progress ring visualization + category breakdown with percentage reduction |
| **Insights Engine** | Personalized recommendations based on highest-impact emission categories |
| **Auth System** | Email OTP + Google OAuth with rate limiting, timing-safe verification, and CSRF protection |
| **API Routes** | RESTful endpoints with Zod validation, rate limiting, and transactional DB writes |

### Responsive Design

| Breakpoint | Navigation | Layout |
|-----------|-----------|--------|
| **Mobile** (<768px) | Bottom nav bar | Single column vertical stack |
| **Tablet** (768-1024px) | Collapsed side menu | Two-column layout |
| **Desktop** (>1024px) | Persistent expanded sidebar | Multi-column grid |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                       │
├──────────────┬──────────────┬───────────────────────────┤
│  Onboarding  │  Dashboard   │  Activity Logger          │
│  SwipeDeck   │  Terrarium   │  LogForm                  │
│              │  ActionCards  │                           │
│              │  StatsSummary │                           │
└──────┬───────┴──────┬───────┴──────────┬────────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│               API ROUTES (Next.js App Router)            │
├──────────────┬──────────────┬───────────────────────────┤
│ /api/onboard │ /api/dashbrd │ /api/activities           │
│ /api/actions │              │                           │
└──────┬───────┴──────┬───────┴──────────┬────────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                         │
├──────────────┬──────────────┬───────────────────────────┤
│ carbon-engine│ gamification │ validations (Zod)         │
└──────┬───────┴──────┬───────┴──────────┬────────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL via Prisma)             │
├──────────┬───────────┬─────────────┬────────────────────┤
│   User   │ActivityLog│ MicroAction │   UserAction       │
│Corporate │           │             │                    │
└──────────┴───────────┴─────────────┴────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | Server components, file-based routing, co-located API routes, Turbopack |
| Styling | Tailwind CSS 4 | Utility-first, `@theme inline` design tokens, responsive breakpoints |
| Animations | Framer Motion | Physics-based drag/swipe, layout transitions, reduced-motion support |
| Database | PostgreSQL (Supabase) + Prisma 7 | Type-safe ORM, `@prisma/adapter-pg` for connection pooling |
| Validation | Zod 4 | Runtime schema validation with full TypeScript inference |
| Auth | bcryptjs + Google OAuth + Nodemailer OTP | Multi-factor with timing-safe verification |
| Security | Rate limiting, CSP headers, CSRF state | Token-bucket algorithm, XSS/injection prevention |
| Testing | Jest 30 + ts-jest | Unit + integration, 90%+ coverage thresholds enforced |
| PWA | Service Worker (v2) | Network-first navigation, cache-first static assets, installable |
| Deployment | Vercel (production) + Docker | Serverless edge, multi-stage Docker build for self-hosting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or use Supabase/Neon for managed)
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd canopy

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with micro-actions
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler recommended) | ✅ |
| `SMTP_HOST` | Email server hostname (default: `smtp.gmail.com`) | ✅ |
| `SMTP_PORT` | Email server port (default: `587`) | ✅ |
| `SMTP_USER` | SMTP username / email address | ✅ |
| `SMTP_PASSWORD` | SMTP app password (Google App Password) | ✅ |
| `SMTP_FROM` | Sender display name + email | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public app URL for OAuth redirects | ✅ |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Areas

- **Carbon Engine** — All emission calculations, edge cases (zero, negative, overflow), category coverage
- **Gamification** — Streak logic, shield mechanic, point multipliers, timezone handling
- **Validations** — Schema validation for all API inputs (happy path + rejection cases)
- **API Integration** — Full request→response cycle for all API routes (auth, activities, actions, onboarding, dashboard)
- **Email Security** — OTP generation (format, uniqueness, range), `escapeHtml` XSS prevention, `timingSafeEqual` behaviour, `sendVerificationEmail` mock tests
- **Rate Limiting** — Token-bucket algorithm, burst capacity, refill mechanics

**80 tests across 6 suites** with enforced thresholds: 90%+ statements, 90%+ lines, 90%+ functions, 80%+ branches.

---

## ☁️ Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Add DATABASE_URL pointing to your cloud PostgreSQL
```

### Docker

```bash
# Build production image
docker build -t canopy .

# Run container
docker run -p 3000:3000 --env-file .env canopy
```

### Railway / Fly.io

Both support the included `Dockerfile` natively. Push to GitHub and connect the repository.

### Database Hosting Options

- **Supabase** — Free tier, built-in auth (recommended for MVP)
- **Neon** — Serverless PostgreSQL with branching
- **Railway** — Managed PostgreSQL with auto-scaling
- **PlanetScale** — MySQL alternative if preferred

---

## 📌 Assumptions

1. **Authentication Model** — The app uses a hybrid auth approach: email + OTP verification for new users, Google OAuth as an alternative. Accounts are automatically linked by email — a user who registers via Google OAuth can later set a password (and vice versa), sharing the same data. Session state is maintained via localStorage tokens and HTTP cookies. The `x-user-id` header authenticates API requests. A production upgrade would add refresh token rotation and HTTP-only secure cookies.

2. **Emission Factors** — Static values from EPA/DEFRA 2023 reference data. These cover "well-to-wheel" CO₂ equivalents for transport, food, energy, and shopping categories. In production, real-time regional factors would be sourced from the Climatiq API without architectural changes.

3. **Single-Page Application** — The entire app runs as a client-side SPA (`"use client"`) with API routes for backend logic. This simplifies state management and enables offline PWA support, but means no server-side rendering of user-specific content.

4. **Database Connectivity** — Assumes a PostgreSQL database accessible via connection string (Supabase pooler). The Prisma schema supports all required relations; migrations are managed via `prisma migrate`.

5. **Email Delivery** — Assumes Google SMTP (App Password) for OTP delivery. The 10-minute OTP expiry and 5-attempt brute-force limit assume reasonable email delivery latency (<30 seconds).

6. **Plaid/Google Maps Integration** — Mocked for MVP. The schema and API structure support plugging in transaction categorization (Plaid) and trip detection (Google Maps) without refactoring the calculation engine.

7. **PWA & Offline** — Service worker (v2) provides cache-first static assets and network-first navigation. Full background sync of activity logs when offline would require additional implementation.

8. **Corporate ESG** — The `Corporate` model and user affiliation exist in the schema but the B2B reporting dashboard is out of scope for this MVP.

9. **Browser Support** — Targets modern evergreen browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+). Service Worker and Framer Motion require ES2020+ support.

10. **Rate Limiting** — In-memory token-bucket rate limiter (5 requests/30 seconds per IP on auth endpoints). Suitable for single-instance deployment; a distributed deployment would require Redis-backed limiting.

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **Input Validation** | Zod 4 schemas validate all API inputs with strict type checking and custom error messages |
| **SQL Injection** | Prisma ORM uses parameterized queries exclusively — no raw SQL |
| **XSS Protection** | React's built-in escaping + `escapeHtml()` for email templates + Content-Security-Policy headers |
| **CSRF Prevention** | OAuth state parameter via `crypto.randomUUID()`, SameSite cookie attributes |
| **Password Storage** | bcryptjs with cost factor 12 (never stored or logged in plaintext) |
| **OTP Security** | `crypto.timingSafeEqual` prevents timing attacks; max 5 attempts prevents brute-force; 10-min expiry |
| **Rate Limiting** | Token-bucket algorithm on auth endpoints (5 req/30s per IP) |
| **HTTP Headers** | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, strict Referrer-Policy |
| **Secrets Management** | Environment variables via `.env.local` (gitignored), never hardcoded |
| **Docker Security** | Non-root user, minimal Alpine base, multi-stage build, no dev dependencies in production |

---

## ♿ Accessibility

| Feature | Implementation |
|---------|---------------|
| **Skip Navigation** | "Skip to main content" link for keyboard users |
| **Semantic HTML** | Proper heading hierarchy (h1→h2→h3), landmark regions |
| **ARIA Labels** | All interactive elements have descriptive labels |
| **Keyboard Navigation** | Swipe cards support arrow keys; all buttons focusable |
| **Focus Indicators** | Visible focus rings (2px solid sage) on all interactive elements |
| **Screen Reader** | Terrarium announces health status; progress bars use aria-valuenow |
| **Color Contrast** | Navy on Oat meets WCAG AA (7.2:1 ratio) |
| **Reduced Motion** | CSS `prefers-reduced-motion: reduce` disables all animations and transitions |
| **Live Announcer** | React context provides screen reader announcements for dynamic state changes |
| **Touch Targets** | Minimum 44×44px for all interactive elements |
| **Form Labels** | All inputs have associated labels and descriptive hints |

---

## 📁 Project Structure

```
canopy/
├── __tests__/                  # Unit & integration tests (80 tests, 6 suites)
│   ├── api-integration.test.ts # API route integration tests
│   ├── carbon-engine.test.ts   # Emission calculation tests
│   ├── email-security.test.ts  # OTP, XSS prevention, timing-safe tests
│   ├── gamification.test.ts    # Streak & points tests
│   ├── rate-limit.test.ts      # Token-bucket algorithm tests
│   └── validations.test.ts     # Schema validation tests
├── prisma/
│   ├── schema.prisma           # Database schema (User, ActivityLog, MicroAction, etc.)
│   └── seed.ts                 # Database seed script (micro-actions data)
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (v2, network-first navigation)
│   └── icons/                  # App icons (192×192, 512×512)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── activities/route.ts   # Activity logging API
│   │   │   ├── actions/route.ts      # Micro-actions API
│   │   │   ├── auth/
│   │   │   │   ├── route.ts          # Register/login/Google OAuth
│   │   │   │   ├── callback/route.ts # OAuth callback handler
│   │   │   │   └── verify/route.ts   # OTP send/verify endpoint
│   │   │   ├── dashboard/route.ts    # Dashboard data API
│   │   │   └── onboarding/route.ts   # Onboarding API
│   │   ├── globals.css               # Tailwind + @theme inline design tokens
│   │   ├── layout.tsx                # Root layout (PWA meta, a11y)
│   │   └── page.tsx                  # Main SPA page (auth → onboard → dashboard)
│   ├── components/
│   │   ├── a11y/
│   │   │   └── LiveAnnouncer.tsx     # Screen reader live region announcements
│   │   ├── auth/
│   │   │   └── AuthScreen.tsx        # Login/register + OTP verification + Google OAuth
│   │   ├── dashboard/
│   │   │   ├── ActionCard.tsx        # Micro-action card with completion
│   │   │   ├── CarbonTracker.tsx     # Progress ring + category breakdown
│   │   │   ├── Insights.tsx          # Personalized emission insights
│   │   │   ├── LogActivityForm.tsx   # Activity logging form (extracted)
│   │   │   ├── StatsSummary.tsx      # Stats grid (streak, CO₂, actions)
│   │   │   └── Terrarium.tsx         # Dynamic SVG terrarium
│   │   ├── layout/
│   │   │   ├── Navigation.tsx        # Responsive nav (mobile bottom / desktop side)
│   │   │   └── TopBar.tsx            # Profile dropdown with logout
│   │   ├── onboarding/
│   │   │   ├── OnboardingDeck.tsx    # Swipe card deck manager
│   │   │   └── SwipeCard.tsx         # Individual swipe card with drag physics
│   │   └── pwa/
│   │       └── ServiceWorkerRegistrar.tsx  # SW registration + update prompt
│   └── lib/
│       ├── carbon-engine.ts          # CO₂ calculation engine (4 categories, 20+ factors)
│       ├── db.ts                     # Prisma client singleton (lazy proxy + pg adapter)
│       ├── email.ts                  # Nodemailer SMTP (OTP emails, escapeHtml)
│       ├── gamification.ts           # Streak, shield, points, health scoring
│       ├── micro-actions-data.ts     # 15 micro-action definitions
│       ├── onboarding-data.ts        # 9 onboarding card definitions
│       ├── rate-limit.ts             # Token-bucket rate limiter
│       └── validations.ts            # Zod schemas for all API inputs
├── Dockerfile                        # Multi-stage production build (Alpine, non-root)
├── jest.config.ts                    # Test config (coverage thresholds enforced)
├── next.config.ts                    # Next.js config (security headers, Turbopack)
├── package.json
├── prisma.config.ts                  # Prisma configuration
├── tsconfig.json                     # TypeScript strict mode
└── README.md
```

---

## 📊 Evaluation Criteria Mapping

| Criteria | Implementation Evidence |
|----------|------------------------|
| **Code Quality** | Modular architecture with single-responsibility modules; TypeScript strict mode; extracted components (LogActivityForm, TopBar, Insights, CarbonTracker); hoisted constants; `useCallback`/`useMemo` for render optimization; consistent naming conventions |
| **Security** | Zod 4 validation on all inputs; Prisma parameterized queries; `crypto.timingSafeEqual` for OTP; brute-force protection (5 attempts); CSRF state on OAuth; `escapeHtml` in email templates; bcrypt cost-12; rate limiting; CSP headers |
| **Efficiency** | Module-level constant hoisting; lazy Prisma proxy; `useCallback` memoization; PWA cache-first for static assets; network-first for navigation; code splitting via dynamic imports; optimized SVG rendering |
| **Testing** | 80 tests across 6 suites; 95%+ statement/line coverage; enforced thresholds in CI; edge case coverage (zero/negative/overflow); mock-based email testing; timing-safe verification tests |
| **Accessibility** | WCAG AA contrast (7.2:1); ARIA roles/labels on all interactive elements; `role="progressbar"` with `aria-valuenow`; `role="list"`/`role="listitem"` on category breakdown; keyboard navigation; `prefers-reduced-motion`; LiveAnnouncer; 44px touch targets |

---

## 📜 License

MIT — Built for the Carbon Footprint Awareness Hackathon.
