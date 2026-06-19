import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, XCircle, RotateCcw, Trophy, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { fetchRandomAnalysis, type BusinessAnalysis } from "@/lib/api";
import { useQuizScore } from "@/lib/streak";

// Fallback wrong options in case an analysis lacks enough failure data
const FALLBACK_WRONG = [
  "Expanded to 50+ cities before achieving profitability in even one",
  "Ignored customer feedback and doubled down on a flawed product",
  "Spent 70% of Series A on marketing before product-market fit",
  "Priced 80% below cost to capture market share without a clear path to margin",
  "Over-hired 300 people in 6 months before revenue could support the team",
  "Focused on fundraising for 8 months instead of shipping product",
  "Neglected unit economics entirely in pursuit of GMV growth",
  "Failed to localize product for Indian market and kept US pricing model",
  "Signed a 5-year exclusive deal with a single supplier at IPO-stage valuation",
  "Built a heavy operations team before automating core workflows",
];

type Option = { text: string; isCorrect: boolean };

type Question = {
  analysisId: string;
  businessName: string;
  industry: string;
  stage: string;
  question: string;
  options: Option[];
  explanation: { decision: string; why: string; impact: string; result: string };
};

function buildQuestion(id: string, analysis: BusinessAnalysis): Question | null {
  const items = analysis.decisionIntelligence;
  if (!items?.length) return null;

  const correctItem = items[Math.floor(Math.random() * items.length)];

  // Collect wrong options
  const wrongPool: string[] = [];
  for (const w of analysis.whereTheyWentWrong ?? []) {
    if (w.wrongDecision && w.wrongDecision !== correctItem.decision) {
      wrongPool.push(w.wrongDecision);
    }
  }
  for (const comp of analysis.failedComparisons ?? []) {
    for (const d of comp.wrongDecisions ?? []) {
      if (!wrongPool.includes(d)) wrongPool.push(d);
    }
    for (const m of comp.mistakes ?? []) {
      if (!wrongPool.includes(m)) wrongPool.push(m);
    }
  }
  // Pad with fallbacks if needed
  const shuffledFallback = [...FALLBACK_WRONG].sort(() => Math.random() - 0.5);
  while (wrongPool.length < 2) wrongPool.push(shuffledFallback.pop() ?? "");

  const wrong = wrongPool.sort(() => Math.random() - 0.5).slice(0, 2);

  // Place correct answer at random position among 3 options
  const correctPos = Math.floor(Math.random() * 3);
  const options: Option[] = [];
  let wi = 0;
  for (let i = 0; i < 3; i++) {
    options.push(i === correctPos ? { text: correctItem.decision, isCorrect: true } : { text: wrong[wi++], isCorrect: false });
  }

  return {
    analysisId: id,
    businessName: analysis.businessName,
    industry: analysis.industry,
    stage: analysis.stage,
    question: `In ${analysis.businessName}'s journey, which was the RIGHT strategic decision?`,
    options,
    explanation: {
      decision: correctItem.decision,
      why: correctItem.why,
      impact: correctItem.impact,
      result: correctItem.result,
    },
  };
}

type Phase = "loading" | "question" | "answered" | "empty" | "error";

export default function Simulator() {
  const { score, record, reset } = useQuizScore();
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const loadNextQuestion = useCallback(async () => {
    setPhase("loading");
    setSelectedIdx(null);
    setQuestion(null);

    const result = await fetchRandomAnalysis();
    if (!result) {
      setPhase("empty");
      return;
    }

    // Try up to 5 picks if an analysis has no usable decision data
    let q: Question | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      q = buildQuestion(result.id, result.analysis);
      if (q) break;
      const retry = await fetchRandomAnalysis();
      if (!retry) break;
      q = buildQuestion(retry.id, retry.analysis);
      if (q) break;
    }

    if (!q) {
      setPhase("error");
      return;
    }

    setQuestion(q);
    setPhase("question");
  }, []);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  const handleAnswer = (idx: number) => {
    if (phase !== "question" || !question) return;
    const correct = question.options[idx].isCorrect;
    setSelectedIdx(idx);
    setWasCorrect(correct);
    record(correct);
    setCurrentStreak((s) => (correct ? s + 1 : 0));
    setRoundsPlayed((r) => r + 1);
    setPhase("answered");
  };

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <main className="w-full max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Score bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl font-bold">Decision Simulator</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentStreak >= 2 && (
              <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                🔥 {currentStreak} in a row!
              </span>
            )}
            <div className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{score.correct}</span>/{score.total} correct
              {score.total > 0 && <span className="ml-1 text-xs">({pct}%)</span>}
            </div>
            {score.total > 0 && (
              <button
                onClick={reset}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Reset score"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Progress bar */}
        {score.total > 0 && (
          <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading next challenge...</p>
            </motion.div>
          )}

          {phase === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 space-y-4"
            >
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="font-heading text-xl font-bold">No challenges yet!</p>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Analyze at least one business to unlock the simulator. Each analysis you do adds new challenges.
              </p>
              <Link to="/">
                <Button className="mt-2">Analyze a Business</Button>
              </Link>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 space-y-3"
            >
              <p className="font-heading text-lg font-bold">Couldn't build a question</p>
              <p className="text-sm text-muted-foreground">Try analyzing more businesses to unlock richer challenges.</p>
              <Button onClick={loadNextQuestion} variant="outline">Try Again</Button>
            </motion.div>
          )}

          {(phase === "question" || phase === "answered") && question && (
            <motion.div
              key={`round-${roundsPlayed}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Context card */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">{question.industry}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{question.stage}</span>
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">{question.businessName}</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{question.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const letter = ["A", "B", "C"][i];
                  let style = "border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer";

                  if (phase === "answered" && selectedIdx !== null) {
                    if (opt.isCorrect) style = "border-green-500 bg-green-500/10 cursor-default";
                    else if (i === selectedIdx) style = "border-red-500 bg-red-500/10 cursor-default";
                    else style = "border-border bg-card opacity-40 cursor-default";
                  }

                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={phase === "answered"}
                      whileHover={phase === "question" ? { scale: 1.01 } : {}}
                      whileTap={phase === "question" ? { scale: 0.99 } : {}}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${style}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                          {letter}
                        </span>
                        <p className="text-sm leading-relaxed">{opt.text}</p>
                        {phase === "answered" && opt.isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-auto" />
                        )}
                        {phase === "answered" && !opt.isCorrect && i === selectedIdx && (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 ml-auto" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Result explanation */}
              {phase === "answered" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border-2 p-5 space-y-3 ${
                    wasCorrect ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {wasCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className={`font-semibold ${wasCorrect ? "text-green-600" : "text-red-600"}`}>
                      {wasCorrect ? "Correct!" : "Not quite"}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Decision: </span>
                      <span className="text-muted-foreground">{question.explanation.decision}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Why: </span>
                      <span className="text-muted-foreground">{question.explanation.why}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Impact: </span>
                      <span className="text-muted-foreground">{question.explanation.impact}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Result: </span>
                      <span className="text-muted-foreground">{question.explanation.result}</span>
                    </div>
                  </div>

                  <Link
                    to={`/analysis/${question.analysisId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                  >
                    View full {question.businessName} analysis
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </motion.div>
              )}

              {/* Next button */}
              {phase === "answered" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center"
                >
                  <Button onClick={loadNextQuestion} size="lg">
                    Next Challenge →
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
