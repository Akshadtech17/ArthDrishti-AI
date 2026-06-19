import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Share2, ChevronRight, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { fetchBotd, saveBotd, analyzeBusiness, getTodaysBotdName, type BusinessAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const LAYOUT = "w-full px-4 sm:px-6 lg:px-10 xl:px-16";

function useCountdown(): string {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      setMs(tomorrow.getTime() - now.getTime());
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3600000).toString().padStart(2, "0");
  const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, "0");
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

type Phase = "loading" | "generating" | "ready" | "error";

export default function BusinessOfDay() {
  const { toast } = useToast();
  const countdown = useCountdown();
  const [phase, setPhase] = useState<Phase>("loading");
  const [botdId, setBotdId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BusinessAnalysis | null>(null);
  const [businessName, setBusinessName] = useState("");
  const todayName = getTodaysBotdName();
  const todayDate = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    (async () => {
      try {
        const cached = await fetchBotd();
        if (cached) { setBotdId(cached.id); setBusinessName(cached.businessName); setAnalysis(cached.analysis); setPhase("ready"); return; }
        setBusinessName(todayName);
        setPhase("generating");
        const { analysis: result } = await analyzeBusiness(todayName);
        await saveBotd(todayName, result);
        const fresh = await fetchBotd();
        setBotdId(fresh?.id ?? null);
        setAnalysis(result);
        setPhase("ready");
      } catch (e) {
        console.error(e);
        setPhase("error");
      }
    })();
  }, [todayName]);

  const handleShare = () => {
    const url = botdId ? `${window.location.origin}/analysis/${botdId}` : window.location.href;
    navigator.clipboard.writeText(url).then(() => toast({ title: "Link copied!" }));
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      {/* Full-bleed BOTD header */}
      <div className="w-full hero-bg border-b border-border">
        <div className={`${LAYOUT} py-10`}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between flex-wrap gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-gradient inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full">
                  <Calendar className="h-3.5 w-3.5" />
                  Business of the Day
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-2">
                {phase === "ready" ? businessName : todayName}
              </h1>
              <p className="text-muted-foreground text-base">{todayDate}</p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3">
              <Button onClick={handleShare} disabled={phase !== "ready"} className="gap-2">
                <Share2 className="h-4 w-4" />Share Today's Analysis
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Next business in <span className="font-mono font-semibold text-foreground">{countdown}</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-4 min-w-[200px]">
                <span className="text-sm text-muted-foreground">Analyze tomorrow's early</span>
                <Link to="/" className="flex items-center gap-1 text-sm text-primary hover:underline font-medium shrink-0">
                  Go <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <main className={`${LAYOUT} py-8`}>
        <AnimatePresence mode="wait">
          {(phase === "loading" || phase === "generating") && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-8"
            >
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-heading text-2xl font-semibold">
                  {phase === "generating" ? `Analyzing ${businessName}…` : "Loading…"}
                </p>
                {phase === "generating" && (
                  <p className="text-muted-foreground mt-2">Running deep intelligence analysis — takes ~15 seconds</p>
                )}
              </div>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <p className="text-xl font-semibold">Could not load today's business</p>
              <p className="text-muted-foreground mt-2">Check your connection and try again.</p>
            </motion.div>
          )}

          {phase === "ready" && analysis && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnalysisResults data={analysis} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
