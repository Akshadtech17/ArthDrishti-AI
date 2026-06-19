import { useState, useCallback, useEffect } from "react";

const STREAK_KEY = "arthdrishti_streak";
const WATCHLIST_KEY = "arthdrishti_watchlist";
const QUIZ_KEY = "arthdrishti_quiz";

// ── Streak ────────────────────────────────────────────────────────────────────

type StreakData = { count: number; lastDate: string };

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { count: 0, lastDate: "" };
  } catch {
    return { count: 0, lastDate: "" };
  }
}

function updateStreak(): number {
  const today = new Date().toISOString().split("T")[0];
  const { count, lastDate } = getStreak();
  if (lastDate === today) return count;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const newCount = lastDate === yesterdayStr ? count + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
  return newCount;
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(getStreak);

  const recordActivity = useCallback(() => {
    const newCount = updateStreak();
    setStreak({ count: newCount, lastDate: new Date().toISOString().split("T")[0] });
    return newCount;
  }, []);

  return { streak, recordActivity };
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

export type WatchlistItem = {
  id: string;
  businessName: string;
  industry: string;
  addedAt: string;
};

function getWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(getWatchlist);

  const add = useCallback((item: WatchlistItem) => {
    const list = getWatchlist();
    if (!list.find((i) => i.id === item.id)) {
      const updated = [item, ...list];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      setWatchlist(updated);
    }
  }, []);

  const remove = useCallback((id: string) => {
    const updated = getWatchlist().filter((i) => i.id !== id);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    setWatchlist(updated);
  }, []);

  const isWatched = useCallback((id: string) => getWatchlist().some((i) => i.id === id), []);

  return { watchlist, add, remove, isWatched };
}

// ── Quiz score ────────────────────────────────────────────────────────────────

export type QuizScore = { correct: number; total: number };

function getQuizScore(): QuizScore {
  try {
    const raw = localStorage.getItem(QUIZ_KEY);
    return raw ? JSON.parse(raw) : { correct: 0, total: 0 };
  } catch {
    return { correct: 0, total: 0 };
  }
}

// ── Daily limit (freemium gate) ───────────────────────────────────────────────

const DAILY_LIMIT_KEY = "arthdrishti_daily_limit";
const FREE_DAILY_LIMIT = 3;
const SHARE_BONUS = 2;

type DailyLimitData = { count: number; date: string; unlocked: number };

function getDailyLimitData(): DailyLimitData {
  const today = new Date().toISOString().split("T")[0];
  try {
    const raw = localStorage.getItem(DAILY_LIMIT_KEY);
    const data: DailyLimitData | null = raw ? JSON.parse(raw) : null;
    if (!data || data.date !== today) return { count: 0, date: today, unlocked: 0 };
    return data;
  } catch {
    return { count: 0, date: today, unlocked: 0 };
  }
}

export function useDailyLimit() {
  const [data, setData] = useState<DailyLimitData>(getDailyLimitData);

  // Refresh when day changes
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getDailyLimitData();
      if (fresh.date !== data.date) setData(fresh);
    }, 60_000);
    return () => clearInterval(interval);
  }, [data.date]);

  const maxAllowed = FREE_DAILY_LIMIT + data.unlocked;
  const canAnalyze = data.count < maxAllowed;
  const remaining = Math.max(0, maxAllowed - data.count);
  const hasUnlocked = data.unlocked > 0;

  const recordUsage = useCallback(() => {
    const current = getDailyLimitData();
    const updated = { ...current, count: current.count + 1 };
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(updated));
    setData(updated);
  }, []);

  const unlockWithShare = useCallback(() => {
    const current = getDailyLimitData();
    if (current.unlocked > 0) return; // already unlocked today
    const updated = { ...current, unlocked: SHARE_BONUS };
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(updated));
    setData(updated);
  }, []);

  return { canAnalyze, remaining, used: data.count, maxAllowed, hasUnlocked, recordUsage, unlockWithShare };
}

export function useQuizScore() {
  const [score, setScore] = useState<QuizScore>(getQuizScore);

  const record = useCallback((correct: boolean) => {
    const prev = getQuizScore();
    const next: QuizScore = { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 };
    localStorage.setItem(QUIZ_KEY, JSON.stringify(next));
    setScore(next);
    return next;
  }, []);

  const reset = useCallback(() => {
    const fresh: QuizScore = { correct: 0, total: 0 };
    localStorage.setItem(QUIZ_KEY, JSON.stringify(fresh));
    setScore(fresh);
  }, []);

  return { score, record, reset };
}
