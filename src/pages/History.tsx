import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Bookmark, BookmarkX, Eye, Clock, TrendingUp, Search, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/Header";
import { fetchRecentAnalyses, type AnalysisSummary } from "@/lib/api";
import { useStreak, useWatchlist } from "@/lib/streak";

const LAYOUT = "w-full px-4 sm:px-6 lg:px-10 xl:px-16";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const COLORS = [
  "from-indigo-500 to-violet-600", "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",     "from-violet-500 to-purple-600",
];

export default function History() {
  const { streak } = useStreak();
  const { watchlist, remove } = useWatchlist();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchRecentAnalyses(50).then(setAnalyses).finally(() => setLoading(false));
  }, []);

  const filtered = analyses.filter(
    (a) => a.businessName.toLowerCase().includes(filter.toLowerCase()) ||
           a.industry.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <main className={`${LAYOUT} py-8 space-y-8`}>

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-1">Your analyses, watchlist, and activity at a glance.</p>
        </motion.div>

        {/* Stats — full width 3-col */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6"
        >
          {[
            { icon: Flame,     color: "text-orange-500", bg: "bg-orange-500/10 border-orange-200", value: streak.count,      label: "Day Streak"      },
            { icon: Bookmark,  color: "text-primary",    bg: "bg-primary/10 border-primary/20",    value: watchlist.length,  label: "Watchlisted"     },
            { icon: TrendingUp,color: "text-emerald-600",bg: "bg-emerald-500/10 border-emerald-200",value: analyses.length,  label: "Total Analyses"  },
          ].map(({ icon: Icon, color, bg, value, label }) => (
            <div key={label} className={`rounded-2xl border p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left ${bg}`}>
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xl sm:text-3xl font-bold font-heading leading-tight ${color}`}>{value}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Two-column layout: Watchlist left, Analyses right */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8 items-start">

          {/* Watchlist */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              Watchlist
              {watchlist.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{watchlist.length}</span>
              )}
            </h2>

            {watchlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                <Bookmark className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No saved businesses yet.
                <br />Save analyses from the home page.
              </div>
            ) : (
              <div className="space-y-2">
                {watchlist.map((item) => {
                  const initials = item.businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const gradient = COLORS[item.businessName.charCodeAt(0) % COLORS.length];
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 card-hover group">
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials}
                      </div>
                      <Link to={`/analysis/${item.id}`} className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{item.businessName}</p>
                        <p className="text-xs text-muted-foreground">{item.industry} · {timeAgo(item.addedAt)}</p>
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* Recent analyses */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Analyses
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter businesses…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-card focus:outline-none focus:border-primary w-48 sm:w-56 transition-colors"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {analyses.length === 0 ? (
                  <>
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No analyses yet</p>
                    <p className="text-sm mt-1">
                      <Link to="/" className="text-primary hover:underline">Analyze your first business →</Link>
                    </p>
                  </>
                ) : (
                  <p>No results for "{filter}"</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((a) => {
                  const initials = a.businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const gradient = COLORS[a.businessName.charCodeAt(0) % COLORS.length];
                  return (
                    <Link
                      key={a.id}
                      to={`/analysis/${a.id}`}
                      className="group flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card card-hover"
                    >
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{a.businessName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.industry}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Eye className="h-2.5 w-2.5" />{a.viewCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.section>

        </div>
      </main>
    </div>
  );
}
