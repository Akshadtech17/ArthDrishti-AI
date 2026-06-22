# ArthDrishti: An AI-Powered Business Intelligence Platform for Structured Enterprise Analysis

---

## Abstract

ArthDrishti is a full-stack, AI-powered business intelligence platform that generates structured, multi-dimensional analyses of real-world businesses on demand. The system combines a React-based single-page application with a Supabase PostgreSQL backend and Groq-hosted large language model inference to produce analyses covering SWOT matrices, strategic decision histories, comparative case studies, and actionable learnings. A freemium access model with integrated Razorpay payment processing enables sustainable operation. Wikipedia's REST API grounds AI-generated content in factual context, mitigating hallucination risk. The platform targets students, entrepreneurs, and business analysts seeking rapid, accessible business intelligence without the cost or complexity of traditional consulting tools. Deployed on Vercel with server-side rendering for social-sharing meta tags, ArthDrishti is publicly accessible at https://arthdrishti-ai.vercel.app.

---

## I. Introduction

Business intelligence and competitive analysis have traditionally been the domain of expensive consulting firms, proprietary data vendors, and domain experts with years of industry experience. Students entering business education, early-stage entrepreneurs evaluating market opportunities, and independent analysts lack affordable, immediate access to the structured analytical frameworks—SWOT analysis, Porter's Five Forces analogues, decision post-mortems—that inform high-quality strategic thinking.

Large language models (LLMs) have matured to the point where they can produce coherent, structured, domain-specific text at near-expert level when provided with appropriate context and constrained output schemas. However, raw LLM interfaces offer no persistence, no UX layer, no structured data contracts, and no access control—leaving significant engineering work between a capable model and a usable product.

ArthDrishti addresses this gap by wrapping Groq's LLaMA 3.3 70B model in a purpose-built product layer: a structured JSON output schema covering ten distinct analytical dimensions, a 7-day analysis cache to prevent redundant inference costs, a Wikipedia enrichment pipeline to ground outputs in factual data, a freemium quota system with payment-based upgrade path, and a suite of secondary features (daily curated case study, decision quiz, watchlist, streak tracking) that encourage regular engagement. The result is a self-contained business intelligence tool accessible to any user with a browser, requiring no prior expertise and no cost for casual use.

---

## II. Methodology

### A. System Architecture

The platform follows a client-server architecture with three tiers:

1. **Presentation Tier:** A React 18 single-page application (SPA) built with Vite and TypeScript, styled with Tailwind CSS and shadcn/ui component primitives. Client-side routing is handled by React Router v6. Asynchronous server state is managed via TanStack Query v5.

2. **Application Tier:** Five Supabase Edge Functions running the Deno runtime act as the serverless backend. These functions handle AI inference orchestration, payment order creation and verification, and scheduled content generation. Secret management is delegated entirely to the Supabase secrets store, ensuring no API keys are exposed in the browser bundle.

3. **Data Tier:** A PostgreSQL database hosted on Supabase stores analyses, daily curated content, pro subscription records, and event telemetry. Row-Level Security (RLS) policies enforce access control at the database layer.

### B. AI Analysis Pipeline

When a user submits a business name, the frontend calls the `analyze-business` edge function. The function first queries the Wikipedia REST API (`/api/rest_v1/page/summary/{title}`) to retrieve a factual summary of the target entity, which is injected into the LLM prompt as grounding context. The enriched prompt is then dispatched to the Groq inference API using the `llama-3.3-70b-versatile` model with a structured JSON output schema. The schema enforces ten top-level fields covering business profile metadata, SWOT quadrants, deep analysis (USP, value proposition, cost structure, growth strategy), flow analysis (problem–strategy–execution–outcome), decision intelligence, peer comparisons, failure analysis, and final learnings. The edge function returns this structured JSON to the frontend, which persists it in the `analyses` table and routes the user to the results view.

### C. Caching Strategy

To minimize redundant inference cost and reduce user-perceived latency, the frontend checks the `analyses` table for a row matching the query string (case-insensitive, ILIKE) with a `created_at` timestamp within the preceding seven days before invoking the edge function. Cache hits are served directly from PostgreSQL with sub-100 ms response times. Cache misses trigger the full AI pipeline.

### D. Rate Limiting and Access Control

Unauthenticated and free-tier users are allotted three analyses per calendar day, tracked in browser localStorage and enforced server-side in the edge function via per-user-ID or per-IP-hash daily usage counters. Users who authenticate via Supabase Auth (Google OAuth or magic-link OTP) may unlock additional quota. Pro subscribers, identified by a cryptographically random UUID access token stored in localStorage and validated server-side against the `pro_subscriptions` table, receive unlimited daily analyses.

### E. Payment Flow and Cryptographic Verification

Pro subscriptions are priced at ₹199 per month and processed through Razorpay. Payment orders are created server-side in the `create-razorpay-order` edge function using HTTP Basic Auth with the Razorpay KEY_SECRET. Upon payment completion, Razorpay passes `payment_id`, `order_id`, and a `signature` to the frontend callback. The `verify-razorpay-payment` edge function recomputes the expected signature as `HMAC-SHA256(KEY_SECRET, order_id|payment_id)` and compares it against the received value using constant-time comparison to prevent timing attacks. On successful verification, a `pro_subscriptions` row is inserted with a UUID access token and a 30-day expiry timestamp. The KEY_SECRET is never transmitted to or stored by the frontend.

### F. SEO and Social Sharing

Because the application is a client-side SPA, social crawlers (Twitter Card, Open Graph, WhatsApp) receive a bare HTML shell without dynamic metadata. A Vercel serverless function (`api/analysis.ts`) intercepts all `/analysis/:id` requests, fetches the corresponding row from Supabase, injects dynamic `<title>`, `<meta name="description">`, `og:title`, `og:description`, and `twitter:*` tags into the pre-built `dist/index.html`, and returns the modified HTML. Regular browser visits receive the SPA and React hydrates normally.

### G. Scheduled Content Generation

A daily Business of the Day (BOTD) feature pre-generates an analysis for one business each day at 00:01 UTC using a pg_cron job. The cron schedule invokes the `generate-botd` edge function via pg_net HTTP trigger. The function deterministically selects a business from a rotating list of 30 Indian startups using `Math.floor(Date.now() / 86400000) % 30` as an index, invokes the same AI pipeline used for on-demand analyses, and upserts the result into the `business_of_the_day` table keyed on `featured_date`. Users visiting the `/botd` route receive the pre-cached result instantly.

---

## III. Literature Survey

### A. Large Language Models for Business Analysis

Prior work has demonstrated that LLMs such as GPT-4 [1] and LLaMA [2] can generate coherent business plans, strategic recommendations, and competitive analyses when given structured prompting. ArthDrishti builds on this capability by enforcing a fixed JSON output schema that constrains the model to produce consistently structured, machine-readable results rather than free-form prose.

### B. Retrieval-Augmented Generation (RAG)

Retrieval-augmented generation [3] augments LLM outputs with retrieved factual documents to reduce hallucination. ArthDrishti implements a lightweight form of RAG by injecting Wikipedia page summaries into the LLM prompt before inference, grounding business-specific facts (founding dates, revenue, products) in a publicly maintained, factually reliable corpus.

### C. Business Intelligence Tools

Traditional BI platforms such as Tableau, Power BI, and Looker [4] provide dashboards over structured numerical datasets but require pre-existing data pipelines and domain expertise to configure. Natural-language business analysis tools such as Perplexity AI [5] and ChatGPT plugins offer conversational interfaces but do not enforce structured output schemas or persist results for downstream consumption. ArthDrishti occupies a different point in this design space: structured schema enforcement, persistent storage, and a purpose-built UX tuned specifically for business analysis.

### D. Freemium SaaS Architecture

The freemium model—offering a limited free tier with paid upgrade—is well-established in SaaS products [6]. ArthDrishti implements a dual enforcement strategy: client-side quota tracking in localStorage for low-latency feedback, with server-side enforcement in the edge function as the authoritative control. This mirrors the "optimistic UI with server-authoritative state" pattern common in modern SaaS applications.

### E. Supabase as Backend-as-a-Service

Supabase [7] provides a PostgreSQL database, authentication, storage, and Deno-based edge functions under a unified SDK. Its Row-Level Security feature, built on PostgreSQL's native RLS mechanism, enables declarative, per-table access control without an additional API gateway. ArthDrishti uses Supabase as its sole backend infrastructure provider, benefiting from automatic type generation from database schema via the Supabase CLI.

### F. Vite and the Modern Frontend Build Ecosystem

Vite [8], using the SWC Rust-based transpiler, provides significantly faster development server startup and hot-module replacement (HMR) compared to webpack-based toolchains. Manual chunk splitting in `vite.config.ts` separates vendor bundles (React, Radix UI, Supabase, Recharts, TanStack Query) to maximize long-term browser cache stability across deployments.

---

## IV. Implementation

### A. Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript 5.8.3
- Vite 5.4.19 with `@vitejs/plugin-react-swc` (SWC transpilation)
- Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- shadcn/ui built on Radix UI primitives (50+ components)
- React Router DOM v6.30.1 (client-side routing)
- TanStack Query v5.83.0 (async server state)
- Framer Motion 11.0.0 (UI animations)
- React Hook Form v7.61.1 with Zod v3.25.76 (form validation)
- Recharts v2.15.4 (data visualization)
- react-markdown v9.0.0 with remark-gfm v4.0.0 (markdown rendering)
- Sonner v1.7.4 (toast notifications)

**Backend:**
- Supabase PostgreSQL (data persistence, RLS, pg_cron, pg_net)
- Supabase Auth (Google OAuth, magic-link OTP)
- Supabase Edge Functions (Deno runtime, TypeScript)
- Groq API — `llama-3.3-70b-versatile` model
- Wikipedia REST API (factual context enrichment)
- Razorpay (payment processing, HMAC-SHA256 signature verification)

**Infrastructure:**
- Vercel (SPA hosting, serverless function for SSR meta tags)
- GitHub (version control, CI/CD trigger for Vercel auto-deploy)

### B. Key Modules

**`src/lib/api.ts`** (299 lines) — Central API orchestration layer. Exports `analyzeBusiness()`, which implements cache lookup, rate-limit enforcement, edge function invocation, and result persistence. Also exports `saveAnalysis()`, `fetchRecentAnalyses()`, `fetchAnalysisById()`, and `incrementViewCount()`.

**`src/lib/auth.ts`** (35 lines) — `useAuth()` custom hook. Manages Supabase session state, exposes `signIn()` (Google OAuth and magic-link), `signOut()`, and the current `user` object with real-time session refresh.

**`src/lib/pro.ts`** (76 lines) — `useProStatus()` custom hook. Reads and writes the pro access token from localStorage, validates expiry client-side, and calls the Supabase `pro_subscriptions` table for server-side verification to support cross-device sync.

**`src/lib/streak.ts`** (172 lines) — `useStreak()`, `useWatchlist()`, `useDailyLimit()`, and `useQuizScore()` hooks. Manages localStorage-persisted user engagement data: consecutive-day streaks, saved business watchlists, daily analysis quota tracking, and simulator quiz scores.

**`src/lib/analytics.ts`** — Fire-and-forget event telemetry. The `track()` function inserts rows into the `events` table for named events (e.g., `analysis_viewed`, `share_clicked`, `gate_signin_clicked`) with a JSONB properties payload. No personally identifiable information is stored.

**`src/components/AnalysisResults.tsx`** — Orchestrates the ten result section components. Receives the structured JSON analysis object and distributes sub-objects to the appropriate display components via props.

**`src/components/results/`** — Ten specialized display components: `BusinessProfile`, `SwotGrid`, `DeepAnalysis`, `FlowAnalysis`, `DecisionIntelligence`, `ComparisonSection`, `SideBySide`, `WhereTheyWentWrong`, `FinalLearnings`, and `SectionCard` (shared wrapper with accent bar).

**`src/components/BusinessExplorer.tsx`** — Displays a categorized, clickable grid of 500+ companies across 18 industry categories. Clicking any company triggers an analysis. Categories include Global Giants, US Tech, China & Asia, Indian Startups, Healthcare, FinTech, SaaS, Retail, E-commerce, Edutech, and others.

**`src/components/FreemiumGate.tsx`** — Renders the paywall UI when a user exceeds their daily quota. Offers three unlock paths: sign in with Google/email (bonus quota), share referral link (bonus quota), or upgrade to Pro via Razorpay checkout (unlimited access for 30 days).

**`supabase/functions/analyze-business/index.ts`** — Primary inference edge function. Accepts `{ query, proToken }`, enforces rate limits, fetches Wikipedia context, dispatches to Groq LLaMA 70B with the structured JSON schema prompt, and returns the parsed analysis object.

**`supabase/functions/generate-botd/index.ts`** — Cron-triggered daily BOTD generator. Selects a business deterministically from a 30-item list, runs the same AI pipeline, and upserts into the `business_of_the_day` table.

**`supabase/functions/create-razorpay-order/index.ts`** (61 lines) — Creates a Razorpay order for ₹199 (19,900 paise) server-side using the KEY_SECRET via HTTP Basic Auth.

**`supabase/functions/verify-razorpay-payment/index.ts`** (90 lines) — Verifies the Razorpay HMAC-SHA256 payment signature, creates a `pro_subscriptions` row with a UUID access token and 30-day expiry, and returns the token to the frontend.

**`api/analysis.ts`** (Vercel serverless) — SSR meta tag injector for social sharing. Intercepts `/analysis/:id` requests from crawlers, fetches analysis metadata from Supabase, injects Open Graph and Twitter Card tags into the pre-built `index.html`, and returns the modified HTML.

### C. Database Schema

The PostgreSQL schema consists of four tables:

- **`analyses`** — Stores AI-generated analysis results. Columns: `id` (UUID PK), `query` (TEXT), `business_name` (TEXT), `industry` (TEXT), `analysis_data` (JSONB), `view_count` (INTEGER), `created_at` (TIMESTAMPTZ). An atomic `increment_view_count(UUID)` RPC function prevents race conditions on concurrent view increments.

- **`business_of_the_day`** — Stores the daily curated analysis. Columns: `id` (UUID PK), `business_name` (TEXT), `analysis_data` (JSONB), `featured_date` (DATE, UNIQUE), `created_at` (TIMESTAMPTZ). The UNIQUE constraint on `featured_date` ensures only one BOTD per calendar day.

- **`pro_subscriptions`** — Tracks paid subscriptions. Columns: `id` (UUID PK), `access_token` (UUID, UNIQUE), `payment_id` (TEXT), `order_id` (TEXT), `user_id` (UUID, FK to `auth.users`), `expires_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ).

- **`events`** — Anonymized telemetry log. Columns: `id` (UUID PK), `event_name` (TEXT), `properties` (JSONB), `created_at` (TIMESTAMPTZ).

### D. Build and Deployment Configuration

Vite's `manualChunks` configuration splits the production bundle into six vendor chunks (`vendor-react`, `vendor-ui`, `vendor-supabase`, `vendor-charts`, `vendor-query`, plus the application code) to maximize long-term HTTP caching. `vercel.json` configures a serverless function inclusion for the SSR analysis route, an SPA fallback rewrite (`/(.*) → /`), and security headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and `Referrer-Policy`. Static assets under `/assets/` receive `Cache-Control: public, max-age=31536000, immutable`.

### E. Testing

Unit tests are configured with Vitest v3.2.4 in a jsdom environment (`vitest.config.ts`). End-to-end tests are configured with Playwright v1.57.0 (`playwright.config.ts`), with shared test fixtures defined in `playwright-fixture.ts`. ESLint 9 with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` enforces code quality at development time.

### F. PWA and Mobile Experience

A `public/manifest.json` defines PWA metadata (app name, icons, display mode, theme color). The Header component renders a top navigation bar on desktop and tablet breakpoints, and a bottom tab navigation bar on mobile (via the `use-mobile` hook). Safe area insets (`env(safe-area-inset-bottom)`) are applied to the mobile bottom bar to support notched devices. Typography is set with Space Grotesk for headings and Inter for body text via Tailwind's `fontFamily` extension.

---

## V. Conclusion

ArthDrishti demonstrates that a self-contained AI business intelligence platform can be built by composing mature open-source tooling (React, Vite, Tailwind CSS, shadcn/ui), managed backend services (Supabase), and hosted LLM inference (Groq). The structured JSON schema enforced at the LLM prompt level transforms unstructured model output into a consistent, typed data contract that drives a rich, multi-section UI. Wikipedia-based context injection provides a lightweight but effective guard against factual hallucination. The freemium model with Razorpay integration establishes a sustainable revenue path without requiring custom payment infrastructure. The combination of a 7-day analysis cache, pre-scheduled daily content, and client-side engagement features (streaks, watchlist, quiz) delivers a product experience that exceeds raw LLM interfaces while remaining accessible to users with no business analysis background.

---

## VI. Future Scope

1. **Expanded Data Sources:** Integration with financial data APIs (e.g., NSE/BSE data feeds, Alpha Vantage) to ground analyses in live revenue, market cap, and stock performance data rather than relying solely on Wikipedia summaries.

2. **Multi-Model Support:** Adding support for additional LLM providers (e.g., Anthropic Claude, Google Gemini) via a provider-agnostic inference layer, enabling model quality comparisons and cost optimization through fallback routing.

3. **User-Generated Annotations:** Allowing authenticated users to annotate analyses with personal notes, corrections, or alternative perspectives, creating a collaborative intelligence layer on top of the AI-generated baseline.

4. **Portfolio Tracking:** Enabling users to define a custom portfolio of businesses and receive periodic AI-generated update summaries when significant market events affect tracked companies.

5. **PDF and Report Export:** Generating downloadable, print-formatted PDF reports from the structured analysis data for use in academic submissions, pitch decks, and boardroom presentations.

6. **Sector and Trend Dashboards:** Aggregating analysis data across multiple businesses in a sector to generate industry-wide trend visualizations, surfacing macro-level patterns in SWOT findings and strategic decisions.

7. **Natural Language Q&A:** Implementing a conversational follow-up interface over completed analyses, allowing users to ask specific questions ("Why did this company fail in Southeast Asia?") grounded in the structured analysis context.

8. **Enhanced Cross-Device Pro Sync:** Moving pro subscription state from localStorage tokens to server-linked user accounts, improving the experience for users who access the platform from multiple devices.

9. **Global Business Coverage:** Extending the Business of the Day roster and Business Explorer categories beyond the current Indian startup focus to include businesses from other emerging markets (Southeast Asia, Africa, Latin America).

10. **Offline Support:** Implementing a service worker to cache previously viewed analyses for offline reading, making the platform useful in low-connectivity environments.

---

## References

[1] OpenAI, "GPT-4 Technical Report," arXiv preprint arXiv:2303.08774, 2023.

[2] H. Touvron et al., "Llama 2: Open Foundation and Fine-Tuned Chat Models," arXiv preprint arXiv:2307.09288, 2023.

[3] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," in *Advances in Neural Information Processing Systems*, vol. 33, 2020, pp. 9459–9474.

[4] Microsoft, "Power BI Documentation," Microsoft Docs, 2024. [Online]. Available: https://learn.microsoft.com/en-us/power-bi/

[5] Perplexity AI, "Perplexity AI Product Overview," 2024. [Online]. Available: https://www.perplexity.ai/

[6] A. Osterwalder and Y. Pigneur, *Business Model Generation*. Hoboken, NJ: Wiley, 2010.

[7] Supabase, "Supabase Documentation," 2024. [Online]. Available: https://supabase.com/docs

[8] E. You, "Vite: Next Generation Frontend Tooling," 2024. [Online]. Available: https://vitejs.dev/

[9] Groq, "Groq API Documentation," 2024. [Online]. Available: https://console.groq.com/docs

[10] Razorpay, "Razorpay Payment Gateway Documentation," 2024. [Online]. Available: https://razorpay.com/docs/

[11] Wikimedia Foundation, "Wikipedia REST API," 2024. [Online]. Available: https://en.wikipedia.org/api/rest_v1/

[12] TanStack, "TanStack Query v5 Documentation," 2024. [Online]. Available: https://tanstack.com/query/v5

[13] Radix UI, "Radix Primitives Documentation," 2024. [Online]. Available: https://www.radix-ui.com/

[14] Vercel, "Vercel Platform Documentation," 2024. [Online]. Available: https://vercel.com/docs
