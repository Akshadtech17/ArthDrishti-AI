import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Bookmark, BookmarkCheck, TrendingUp, Eye, ArrowRight,
  Crown, Sparkles, CheckCircle2, ArrowUpRight, Zap, BarChart3, Brain,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BusinessInput } from "@/components/BusinessInput";
import { BusinessExplorer } from "@/components/BusinessExplorer";
import { AnalysisResults } from "@/components/AnalysisResults";
import { FreemiumGate } from "@/components/FreemiumGate";
import { Button } from "@/components/ui/button";
import {
  analyzeBusiness, fetchTrendingAnalyses,
  type BusinessAnalysis, type AnalysisSummary,
} from "@/lib/api";
import { useStreak, useWatchlist, useDailyLimit } from "@/lib/streak";
import { useProStatus } from "@/lib/pro";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  "Wikipedia-grounded real data",
  "Full SWOT + Strategy breakdown",
  "Real business comparisons",
  "Decision intelligence reports",
];

const LOADING_STEPS = [
  "Fetching real-world data…",
  "Running SWOT analysis…",
  "Comparing similar businesses…",
  "Generating strategic insights…",
];

function LoadingScreen({ query }: { query: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4"
    >
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDelay: "0.3s" }} />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="font-heading text-3xl font-semibold text-foreground">
          Analyzing <span className="text-gradient">"{query}"</span>
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-base text-muted-foreground"
          >
            {LOADING_STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full w-2/3 shimmer" />
      </div>
    </motion.div>
  );
}

function TrendingCard({ t, rank, onClick }: { t: AnalysisSummary; rank: number; onClick: () => void }) {
  const initials = t.businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const gradients = [
    "from-indigo-500 to-violet-600", "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-500",    "from-pink-500 to-rose-600",
  ];
  const gradient = gradients[t.businessName.charCodeAt(0) % gradients.length];
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl border border-border bg-card card-hover text-left w-full overflow-hidden"
    >
      {isTop3 && <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div className={`h-13 w-13 h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-base font-bold shadow-sm`}>
            {initials}
          </div>
          <div className="flex items-center gap-1.5">
            {isTop3 && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                #{rank}
              </span>
            )}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </div>
        </div>
        <div>
          <p className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
            {t.businessName}
          </p>
          <span className="inline-block mt-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {t.industry}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
          <Eye className="h-3.5 w-3.5" />
          <span className="font-medium">
            {t.viewCount >= 1000 ? `${(t.viewCount / 1000).toFixed(1)}k` : t.viewCount}
          </span>
          <span>views</span>
        </div>
      </div>
    </button>
  );
}

const LAYOUT = "w-full px-4 sm:px-6 lg:px-10 xl:px-16";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { recordActivity } = useStreak();
  const { isWatched, add, remove } = useWatchlist();
  const { isPro, daysLeft, activatePro, syncWithUser } = useProStatus();
  const { user } = useAuth();
  const { canAnalyze: withinLimit, remaining, used, maxAllowed, hasUnlocked, recordUsage, unlockWithShare } = useDailyLimit();
  const canAnalyze = isPro || withinLimit;

  const [result, setResult] = useState<BusinessAnalysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [watched, setWatched] = useState(false);
  const [trending, setTrending] = useState<AnalysisSummary[]>([]);
  const [showGate, setShowGate] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState("");

  useEffect(() => { if (user?.id) syncWithUser(user.id); }, [user?.id, syncWithUser]);
  useEffect(() => { fetchTrendingAnalyses(8).then(setTrending); track("page_view", { page: "home" }); }, []);

  const runAnalysis = async (q: string) => {
    setQuery(q); setIsLoading(true); setResult(null); setAnalysisId(null); setWatched(false);
    const startedAt = Date.now();
    track("analysis_started", { query: q });
    try {
      const { id, analysis, fromCache } = await analyzeBusiness(q);
      setResult(analysis); setAnalysisId(id); setWatched(isWatched(id));
      track("analysis_completed", { business_name: analysis.businessName, from_cache: fromCache, duration_ms: Date.now() - startedAt });
      if (fromCache) {
        toast({ title: "Loaded from cache", description: "Instant & free.", duration: 2000 });
      } else {
        if (!isPro) recordUsage();
        recordActivity();
      }
    } catch (e: unknown) {
      toast({ title: "Analysis Failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleAnalyze = (q: string) => {
    if (!canAnalyze) { setPendingQuery(q); setShowGate(true); return; }
    runAnalysis(q);
  };

  const handleGateClose = () => {
    setShowGate(false);
    if ((isPro || withinLimit) && pendingQuery) { runAnalysis(pendingQuery); setPendingQuery(null); }
  };

  const handleShare = () => {
    if (!analysisId) return;
    navigator.clipboard.writeText(`${window.location.origin}/analysis/${analysisId}`).then(() => {
      toast({ title: "Link copied!" });
      track("share_clicked", { analysis_id: analysisId });
    });
  };

  const handleWatchlist = () => {
    if (!analysisId || !result) return;
    if (watched) {
      remove(analysisId); setWatched(false); toast({ title: "Removed from watchlist" });
    } else {
      add({ id: analysisId, businessName: result.businessName, industry: result.industry, addedAt: new Date().toISOString() });
      setWatched(true); toast({ title: "Saved to watchlist" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <FreemiumGate
        open={showGate}
        onClose={handleGateClose}
        onUnlocked={unlockWithShare}
        onProActivated={(token) => { activatePro(token); setShowGate(false); if (pendingQuery) { runAnalysis(pendingQuery); setPendingQuery(null); } }}
        hasUnlocked={hasUnlocked}
      />

      <AnimatePresence mode="wait">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        {!result && !isLoading && (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* ── Full-bleed hero section ─────────────────────────────── */}
            <section className="hero-bg relative overflow-hidden w-full">
              {/* Ambient orbs */}
              <div className="orb h-[600px] w-[600px] bg-indigo-200/40 top-[-180px] left-[-100px]" />
              <div className="orb orb-2 h-[420px] w-[420px] bg-violet-200/35 top-[5%] right-[-80px]" />
              <div className="orb h-[320px] w-[320px] bg-blue-200/25 bottom-[-80px] left-[38%]" />

              <div className={`relative z-10 ${LAYOUT} pt-20 pb-10 sm:pt-32 sm:pb-14 flex flex-col items-center text-center`}>

                {/* Badge */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                  <span className="badge-gradient inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full mb-8">
                    <Sparkles className="h-4 w-4" />
                    AI-Powered Business Intelligence
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="w-full">
                  <h1 className="font-heading font-black tracking-tight text-foreground leading-[1.04] mb-6
                                 text-[2.4rem] xs:text-[2.8rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] xl:text-[7rem]">
                    Decode Any Business.
                    <br />
                    <span className="text-gradient">In Seconds.</span>
                  </h1>

                  <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-5 font-medium">
                    From Zerodha to your next startup idea — deep SWOT, strategy breakdowns,
                    and competitor comparisons powered by AI and real-world Wikipedia data.
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mb-12">
                    {FEATURES.map((f) => (
                      <span key={f} className="inline-flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* ── Search bar ─ constrained width, centered ────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.18 }}
                  className="w-full max-w-3xl"
                >
                  <BusinessInput onSubmit={handleAnalyze} isLoading={false} />

                  {/* Usage hint */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {isPro ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium badge-gradient px-3 py-1.5 rounded-full">
                        <Crown className="h-3.5 w-3.5" /> Pro active · {daysLeft} days left
                      </span>
                    ) : canAnalyze ? (
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{remaining}</span> of {maxAllowed} free analyses left today
                        {used > 0 && <span className="text-muted-foreground/60"> · cached = free</span>}
                      </span>
                    ) : (
                      <button onClick={() => setShowGate(true)} className="text-sm text-primary hover:underline font-medium">
                        Daily limit reached — upgrade or share to unlock →
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ── Company Explorer — full width ───────────────────────── */}
            <section className="w-full border-b border-border bg-white">
              <div className={`${LAYOUT} py-10`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.28 }}
                >
                  {/* Section heading */}
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Browse & Click to Analyze</p>
                      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                        Explore 500+ Businesses
                      </h2>
                    </div>
                    <span className="hidden sm:block text-sm text-muted-foreground">18 categories · global + India</span>
                  </div>
                  <BusinessExplorer onSelect={handleAnalyze} />
                </motion.div>
              </div>
            </section>

            {/* ── Stats strip ─────────────────────────────────────────── */}
            <div className="w-full border-b border-border bg-muted/20">
              <div className={`${LAYOUT} py-6 flex flex-wrap items-center justify-center gap-4 sm:gap-0`}>
                {[
                  { icon: BarChart3, label: "Deep SWOT + Strategy",  sub: "10 sections of intelligence" },
                  { icon: Brain,     label: "Groq LLaMA 70B AI",     sub: "State-of-the-art model"      },
                  { icon: Zap,       label: "Real Wikipedia data",    sub: "Grounded in real facts"      },
                ].map(({ icon: Icon, label, sub }, i, arr) => (
                  <div key={label} className="flex items-center">
                    <div className="flex items-center gap-4 px-8 sm:px-12">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                           style={{ background: "hsl(245 80% 55% / 0.08)", border: "1px solid hsl(245 80% 55% / 0.15)" }}>
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-bold text-foreground leading-tight">{label}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{sub}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="hidden sm:block h-12 w-px bg-border shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Trending ─────────────────────────────────────────────── */}
            {trending.length > 0 && (
              <section className={`${LAYOUT} py-16`}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div className="flex items-end justify-between mb-10">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Popular right now</p>
                      <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                        Trending Analyses
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate("/history")}
                      className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/25 hover:bg-primary/5 px-5 py-2.5 rounded-xl transition-colors"
                    >
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {trending.map((t, idx) => (
                      <TrendingCard key={t.id} t={t} rank={idx + 1} onClick={() => navigate(`/analysis/${t.id}`)} />
                    ))}
                  </div>

                  <div className="mt-8 sm:hidden text-center">
                    <button
                      onClick={() => navigate("/history")}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/25 hover:bg-primary/5 px-5 py-2.5 rounded-xl transition-colors"
                    >
                      View all analyses <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              </section>
            )}

            {/* ── How it works ─────────────────────────────────────────── */}
            <section className={`${LAYOUT} py-16 border-t border-border`}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="text-center mb-14">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Simple &amp; powerful</p>
                  <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">How it works</h2>
                </div>

                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
                  <div className="hidden sm:block absolute top-11 left-[calc(16.6%+24px)] right-[calc(16.6%+24px)] h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30 z-0" />
                  {[
                    { n: "01", icon: Zap,      title: "Enter any business",     desc: "Type a company name or describe a startup idea in plain English." },
                    { n: "02", icon: Brain,     title: "AI runs deep analysis",  desc: "Wikipedia data + Groq LLaMA 70B produce SWOT, strategy, and comparisons." },
                    { n: "03", icon: BarChart3, title: "Make smarter decisions", desc: "Shareable intelligence reports for investors, founders, and students." },
                  ].map(({ n, icon: Icon, title, desc }) => (
                    <div key={n} className="relative z-10 flex flex-col items-center text-center group">
                      <div className="relative mb-6">
                        <div className="h-24 w-24 rounded-3xl bg-white border-2 border-primary/20 shadow-lg flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-xl transition-all duration-300">
                          <Icon className="h-10 w-10 text-primary" />
                        </div>
                        <span className="absolute -top-2.5 -right-2.5 h-7 w-7 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-md">
                          {n.replace("0", "")}
                        </span>
                      </div>
                      <p className="font-heading text-xl font-bold text-foreground mb-3">{title}</p>
                      <p className="text-base text-muted-foreground leading-relaxed max-w-xs">{desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

          </motion.div>
        )}

        {/* ── LOADING ───────────────────────────────────────────────────── */}
        {isLoading && <LoadingScreen query={query} />}

        {/* ── RESULTS ───────────────────────────────────────────────────── */}
        {result && !isLoading && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-16 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
              <div className={`${LAYOUT} py-3 flex items-center justify-between gap-3`}>
                <button
                  onClick={() => { setResult(null); setQuery(""); setAnalysisId(null); }}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  ← New Analysis
                </button>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {analysisId && (
                    <>
                      <Button size="sm" variant="outline" onClick={handleWatchlist} className="gap-1.5 h-8 text-sm">
                        {watched ? <><BookmarkCheck className="h-3.5 w-3.5 text-primary" />Saved</> : <><Bookmark className="h-3.5 w-3.5" />Save</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5 h-8 text-sm">
                        <Share2 className="h-3.5 w-3.5" />Share
                      </Button>
                      <Button size="sm" onClick={() => navigate(`/analysis/${analysisId}`)} className="gap-1.5 h-8 text-sm">
                        Full Page<ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className={`${LAYOUT} py-8`}>
              <AnalysisResults data={result} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
