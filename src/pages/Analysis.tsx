import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Share2, Bookmark, BookmarkCheck, ArrowLeft, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { fetchAnalysis, incrementViewCount, type BusinessAnalysis } from "@/lib/api";
import { useWatchlist } from "@/lib/streak";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";

const LAYOUT = "w-full px-4 sm:px-6 lg:px-10 xl:px-16";

function setMetaTag(attr: "name" | "property", key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isWatched, add, remove } = useWatchlist();

  const [data, setData] = useState<{
    id: string; query: string; analysis: BusinessAnalysis; viewCount: number; createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const result = await fetchAnalysis(id);
      if (!result) { setLoading(false); return; }
      setData(result); setWatched(isWatched(id)); setLoading(false);
      incrementViewCount(id).catch(() => {});
      track("analysis_viewed", { analysis_id: id, business_name: result.analysis.businessName });
    })();
  }, [id, isWatched]);

  useEffect(() => {
    if (!data) return;
    const { businessName, industry } = data.analysis;
    const title = `${businessName} — Business Analysis | ArthDrishti`;
    const desc  = `AI deep-dive into ${businessName} (${industry}): SWOT, strategy, real-world comparisons, and decision intelligence.`;
    document.title = title;
    setMetaTag("name",     "description",        desc);
    setMetaTag("property", "og:title",           title);
    setMetaTag("property", "og:description",     desc);
    setMetaTag("property", "og:url",             window.location.href);
    setMetaTag("name",     "twitter:title",      title);
    setMetaTag("name",     "twitter:description", desc);
    return () => { document.title = "ArthDrishti — AI Business Intelligence"; };
  }, [data]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/analysis/${id}`).then(() => {
      toast({ title: "Link copied!" });
      track("share_clicked", { analysis_id: id });
    });
  };

  const handleWatchlist = () => {
    if (!data || !id) return;
    if (watched) {
      remove(id); setWatched(false); toast({ title: "Removed from watchlist" });
    } else {
      add({ id, businessName: data.analysis.businessName, industry: data.analysis.industry, addedAt: new Date().toISOString() });
      setWatched(true); toast({ title: "Saved to watchlist" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        <div className={`${LAYOUT} py-8 space-y-4`}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <p className="text-2xl font-heading font-bold">Analysis not found</p>
          <p className="text-muted-foreground">This analysis may have been removed or the link is invalid.</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      {/* Sticky toolbar */}
      <div className="sticky top-16 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className={`${LAYOUT} py-3 flex items-center justify-between gap-3 flex-wrap`}>
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />New Analysis
            </Link>
            <span className="text-border">|</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />{data.viewCount.toLocaleString()} views
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleWatchlist} className="gap-1.5 h-8 text-sm">
              {watched ? <><BookmarkCheck className="h-3.5 w-3.5 text-primary" />Saved</> : <><Bookmark className="h-3.5 w-3.5" />Save</>}
            </Button>
            <Button size="sm" onClick={handleShare} className="gap-1.5 h-8 text-sm">
              <Share2 className="h-3.5 w-3.5" />Share
            </Button>
          </div>
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`${LAYOUT} py-8`}
      >
        <AnalysisResults data={data.analysis} />
      </motion.main>
    </div>
  );
}
