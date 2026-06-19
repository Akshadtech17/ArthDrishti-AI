# ArthDrishti — AI Business Intelligence

> **"Arth"** (अर्थ) means *meaning / wealth* in Sanskrit. **"Drishti"** (दृष्टि) means *vision*. Together: **a vision for business meaning**.

ArthDrishti is a full-stack AI platform that gives you deep, structured intelligence on any business — Indian or global. Enter a company name, get a full SWOT analysis, competitive breakdown, decision intelligence, and strategic learnings in seconds, powered by Groq's LLaMA 70B model.

**Live:** [https://arthdrishti-ai.vercel.app](https://arthdrishti-ai.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| AI Business Analysis | Full SWOT, strategy, financial model, and competitive analysis for any business |
| Business of the Day | AI-curated daily business case study, auto-generated via cron |
| Decision Simulator | Quiz game built from real analysis data — test your strategic thinking |
| Business Explorer | 500+ companies across 18 categories (Indian & global) — click any to analyze |
| History & Watchlist | Browse past analyses, save businesses, track your learning streak |
| Freemium + Pro | 3 free analyses/day; Pro (₹199/month) for unlimited access |
| Payments | Razorpay checkout — order creation + signature verification via edge functions |
| SSR SEO | Vercel serverless function injects per-analysis `<meta>` tags for crawlers |
| PWA-ready | Web manifest, mobile bottom nav, iOS safe-area support |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│              React 18 + Vite + TypeScript + Tailwind            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
          ┌──────────────────┴──────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐             ┌───────────────────────┐
│   VERCEL (Frontend) │             │  SUPABASE (Backend)   │
│                     │             │                       │
│  Static SPA (Vite)  │◄────REST───►│  PostgreSQL Database  │
│                     │             │  Row-Level Security   │
│  /api/analysis.ts   │             │                       │
│  (SSR meta tags for │             │  Supabase Auth        │
│   search crawlers)  │             │  (Google OAuth + OTP) │
└─────────────────────┘             │                       │
                                    │  Edge Functions (Deno)│
                                    │  ┌─────────────────┐  │
                                    │  │analyze-business │  │
                                    │  │generate-botd    │  │──► Groq API
                                    │  │create-razorpay  │  │    (LLaMA 70B)
                                    │  │verify-razorpay  │  │──► Razorpay API
                                    │  │seed-data        │  │
                                    │  └─────────────────┘  │
                                    │                       │
                                    │  pg_cron (Supabase)   │
                                    │  Runs generate-botd   │
                                    │  daily at midnight    │
                                    └───────────────────────┘
```

### Data Flow — Business Analysis

```
User types company name
        │
        ▼
Frontend checks Supabase DB
   ├── Cached? → Return instantly (free, no quota used)
   └── New?    → Check daily quota
                    ├── Limit reached? → Show FreemiumGate
                    └── OK? → Call analyze-business edge function
                                    │
                                    ▼
                            Groq LLaMA-3.3-70B
                            (structured JSON prompt)
                                    │
                                    ▼
                        Parse + store in Supabase
                                    │
                                    ▼
                        Stream results to frontend
                        AnalysisResults component renders
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 (SWC) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion 11 |
| Routing | React Router DOM v6 |
| State / Cache | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

### Backend
| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth (Google OAuth + Magic Link) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| AI Model | Groq API — `llama-3.3-70b-versatile` |
| Payments | Razorpay (test mode) |
| Cron | Supabase pg_cron — daily Business of the Day |
| SSR/SEO | Vercel Serverless Function (`api/analysis.ts`) |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting + SSR meta endpoint |
| Supabase | Database + Auth + Edge Functions |
| GitHub | Source control + CI trigger for Vercel |
| Groq | AI inference (API key stored in Supabase secrets only) |
| Razorpay | Payment processing |

---

## File Structure

```
ArthDrishti/
├── api/
│   └── analysis.ts              # Vercel serverless — SSR meta tags for SEO
│
├── public/
│   ├── favicon.ico
│   ├── manifest.json            # PWA manifest
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (Button, Card, Dialog…)
│   │   ├── results/             # Analysis result components
│   │   │   ├── BusinessProfile.tsx      # Header — name, stage, tagline, badges
│   │   │   ├── SwotGrid.tsx             # 2×2 SWOT grid
│   │   │   ├── DeepAnalysis.tsx         # Business model & financials
│   │   │   ├── FlowAnalysis.tsx         # Timeline / growth stages
│   │   │   ├── DecisionIntelligence.tsx # Key strategic decisions
│   │   │   ├── ComparisonSection.tsx    # Success vs failure company cards
│   │   │   ├── SideBySide.tsx           # Factor-by-factor comparison table
│   │   │   ├── WhereTheyWentWrong.tsx   # Wrong decision → root cause → fix
│   │   │   ├── FinalLearnings.tsx       # 4-quadrant strategic takeaways
│   │   │   └── SectionCard.tsx          # Shared section wrapper with accent bar
│   │   ├── AnalysisResults.tsx  # Orchestrates all result sections
│   │   ├── BusinessExplorer.tsx # 500+ companies across 18 categories
│   │   ├── BusinessInput.tsx    # Search bar + analyze button
│   │   ├── AuthModal.tsx        # Google / OTP login modal
│   │   ├── FreemiumGate.tsx     # Daily limit paywall + share-to-unlock
│   │   ├── Header.tsx           # Top nav + mobile bottom nav
│   │   ├── NavLink.tsx          # Animated nav item
│   │   └── ErrorBoundary.tsx    # React error boundary
│   │
│   ├── pages/
│   │   ├── Index.tsx            # Homepage — hero, explorer, trending
│   │   ├── Analysis.tsx         # /analysis/:id — full analysis page
│   │   ├── BusinessOfDay.tsx    # /botd — daily AI case study
│   │   ├── Simulator.tsx        # /simulator — decision quiz game
│   │   ├── History.tsx          # /history — past analyses + watchlist
│   │   └── NotFound.tsx         # 404 page
│   │
│   ├── lib/
│   │   ├── api.ts               # All Supabase data fetching functions
│   │   ├── auth.ts              # Auth helpers (signIn, signOut, useUser)
│   │   ├── pro.ts               # Pro status checks + upgrade flow
│   │   ├── streak.ts            # Daily streak, watchlist, quiz score (localStorage)
│   │   ├── analytics.ts         # View count tracking
│   │   └── utils.ts             # cn(), Tailwind merge helpers
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts            # Supabase client (anon key, public)
│   │   └── types.ts             # Generated database types
│   │
│   ├── App.tsx                  # Router setup + theme provider
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles + custom CSS utilities
│
├── supabase/
│   ├── config.toml              # Supabase local dev config
│   ├── migrations/              # Postgres schema migrations (5 files)
│   │   ├── 20240619000000_initial_schema.sql
│   │   ├── 20240619000001_cron_botd.sql
│   │   ├── 20240619000002_pro_and_analytics.sql
│   │   ├── 20240619000003_usage_and_cron_fix.sql
│   │   └── 20240619000004_pro_user_link.sql
│   └── functions/
│       ├── analyze-business/        # Main AI analysis — calls Groq LLaMA
│       ├── generate-botd/           # Business of the Day generator (cron)
│       ├── create-razorpay-order/   # Create Razorpay payment order
│       ├── verify-razorpay-payment/ # Verify Razorpay HMAC signature
│       └── seed-data/               # Dev seed utility
│
├── .env.example                 # Template for required environment variables
├── .gitignore                   # .env excluded — secrets never committed
├── vercel.json                  # Vercel routing + security headers
├── vite.config.ts               # Vite build config
├── tailwind.config.ts           # Tailwind theme (custom fonts, colors)
├── tsconfig.json                # TypeScript config
└── package.json
```

---

## Database Schema

```sql
-- Core analysis storage
analyses (id, business_name, industry, stage, tagline,
          analysis JSONB, view_count, created_at)

-- Business of the Day
botd (id, business_name, content JSONB, date DATE, created_at)

-- Usage tracking (freemium quota)
usage_logs (id, user_id, ip_hash, created_at)

-- Pro subscriptions
pro_users (id, user_id, razorpay_order_id, razorpay_payment_id,
           plan, status, expires_at, created_at)
```

---

## Edge Functions

| Function | Trigger | What it does |
|---|---|---|
| `analyze-business` | POST (frontend) | Calls Groq LLaMA 70B, stores result in DB |
| `generate-botd` | pg_cron daily | Picks a business, generates case study, stores in `botd` |
| `create-razorpay-order` | POST (checkout) | Creates Razorpay order with amount + metadata |
| `verify-razorpay-payment` | POST (post-payment) | Verifies HMAC signature, upgrades user to Pro |
| `seed-data` | Manual (dev) | Seeds sample analyses for local development |

---

## Security

- **Groq API key** — stored only in Supabase edge function secrets, never in the browser bundle
- **Razorpay KEY_SECRET** — stored only in Supabase edge function secrets
- **Razorpay KEY_ID** — `VITE_RAZORPAY_KEY_ID` (public identifier, safe for frontend)
- **`.env` excluded from git** — `.gitignore` blocks all `.env*` files
- **Row-Level Security** — Supabase RLS policies on all tables
- **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection` via `vercel.json`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Supabase — Dashboard → Project → Settings → API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Razorpay KEY_ID only — KEY_SECRET goes in Supabase secrets
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

**Supabase edge function secrets** (set via `supabase secrets set`):
```
GROQ_API_KEY=your_groq_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/Akshadtech17/ArthDrishti-AI.git
cd ArthDrishti-AI

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in Supabase and Razorpay values

# 4. Run
npm run dev
# → http://localhost:8080
```

To run edge functions locally (requires Supabase CLI):
```bash
supabase start
supabase functions serve
```

---

## Deployment

### Frontend → Vercel

```bash
npm install -g vercel
vercel link --project arthdrishti-ai
vercel --prod
```

Vercel auto-deploys on every push to `main`.

### Backend → Supabase Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref nttrsltuequkgotwonpt
supabase functions deploy analyze-business
supabase functions deploy generate-botd
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

Set secrets:
```bash
supabase secrets set GROQ_API_KEY=your_key
supabase secrets set RAZORPAY_KEY_ID=your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret
```

### Database Migrations

```bash
supabase db push
```

---

## Scripts

```bash
npm run dev        # Dev server at localhost:8080
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
npm run test       # Vitest unit tests
```

---

## Production Links

| Resource | URL |
|---|---|
| Live App | https://arthdrishti-ai.vercel.app |
| GitHub | https://github.com/Akshadtech17/ArthDrishti-AI |
| Supabase Dashboard | https://supabase.com/dashboard/project/nttrsltuequkgotwonpt |
| Vercel Dashboard | https://vercel.com/akshads-projects-fb841962/arthdrishti-ai |

---

Built by [Akshad Kaloni](https://github.com/Akshadtech17)
