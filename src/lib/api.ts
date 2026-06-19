import { supabase } from "@/integrations/supabase/client";

export type BusinessAnalysis = {
  businessName: string;
  industry: string;
  businessModel: string;
  revenueModel: string;
  targetMarket: string;
  geography: string;
  stage: string;
  deepAnalysis: {
    usp: string;
    valueProposition: string;
    growthStrategy: string;
    costStructure: string;
    scalingApproach: string;
  };
  flowAnalysis: {
    problem: string;
    strategy: string;
    execution: string;
    outcome: string;
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  decisionIntelligence: Array<{
    decision: string;
    why: string;
    impact: string;
    result: string;
  }>;
  successfulComparisons: Array<{
    name: string;
    country: string;
    model: string;
    usp: string;
    keyDecisions: string[];
    growthStrategy: string;
  }>;
  failedComparisons: Array<{
    name: string;
    country: string;
    model: string;
    failureReason: string;
    mistakes: string[];
    wrongDecisions: string[];
  }>;
  sideBySide: {
    factors: string[];
    successPatterns: string[];
    failurePatterns: string[];
  };
  whereTheyWentWrong: Array<{
    business: string;
    wrongDecision: string;
    stageOfFailure: string;
    rootCause: string;
    correctAlternative: string;
  }>;
  finalLearnings: {
    whatToDo: string[];
    whatToAvoid: string[];
    strategyRules: string[];
    decisionFrameworks: string[];
  };
};

export type AnalysisSummary = {
  id: string;
  businessName: string;
  industry: string;
  viewCount: number;
  createdAt: string;
};

export type AnalysisResult = {
  id: string;
  analysis: BusinessAnalysis;
  fromCache: boolean;
};


// ── AI call: always via edge function — Groq key never leaves the server ───────

import { getProToken } from "@/lib/pro";

async function callAnalysisFunction(query: string): Promise<BusinessAnalysis> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey     = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Send the user's session JWT so the edge function can identify them for
  // server-side rate limiting. Falls back to anon key for unauthenticated users.
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token ?? anonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-business`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, proToken: getProToken() }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "AI analysis failed. Please try again.");
  }

  return response.json() as Promise<BusinessAnalysis>;
}

// ── Deduplication: check DB before hitting the AI ─────────────────────────────

async function findCachedAnalysis(query: string): Promise<{ id: string; analysis: BusinessAnalysis } | null> {
  const q = query.trim();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Check by exact query text first
  const { data: byQuery } = await supabase
    .from("analyses")
    .select("id, analysis_data")
    .ilike("query", q)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1);

  if (byQuery?.length) {
    return { id: byQuery[0].id, analysis: byQuery[0].analysis_data as BusinessAnalysis };
  }

  // Fall back: check by normalized business name
  const { data: byName } = await supabase
    .from("analyses")
    .select("id, analysis_data")
    .ilike("business_name", q)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1);

  if (byName?.length) {
    return { id: byName[0].id, analysis: byName[0].analysis_data as BusinessAnalysis };
  }

  return null;
}

// ── Main entry point ───────────────────────────────────────────────────────────

export async function analyzeBusiness(query: string): Promise<AnalysisResult> {
  // 1. Return cached result if recent one exists (skip AI call entirely)
  const cached = await findCachedAnalysis(query);
  if (cached) {
    incrementViewCount(cached.id).catch(() => {});
    return { id: cached.id, analysis: cached.analysis, fromCache: true };
  }

  // 2. Call edge function (Groq + Wikipedia enrichment, key never in browser)
  const analysis = await callAnalysisFunction(query);

  // 3. Persist to DB
  const id = await saveAnalysis(query, analysis);

  return { id, analysis, fromCache: false };
}

// ── Database helpers ───────────────────────────────────────────────────────────

export async function saveAnalysis(query: string, analysis: BusinessAnalysis): Promise<string> {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      query,
      business_name: analysis.businessName,
      industry: analysis.industry,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analysis_data: analysis as any,
      view_count: 1,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchAnalysis(id: string): Promise<{
  id: string;
  query: string;
  analysis: BusinessAnalysis;
  viewCount: number;
  createdAt: string;
} | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return {
    id: data.id,
    query: data.query,
    analysis: data.analysis_data as BusinessAnalysis,
    viewCount: data.view_count,
    createdAt: data.created_at,
  };
}

export async function incrementViewCount(id: string): Promise<void> {
  await supabase.rpc("increment_view_count", { analysis_id: id });
}

export async function fetchRecentAnalyses(limit = 30): Promise<AnalysisSummary[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, business_name, industry, view_count, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((d) => ({
    id: d.id,
    businessName: d.business_name,
    industry: d.industry ?? "",
    viewCount: d.view_count,
    createdAt: d.created_at,
  }));
}

export async function fetchTrendingAnalyses(limit = 6): Promise<AnalysisSummary[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, business_name, industry, view_count, created_at")
    .order("view_count", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((d) => ({
    id: d.id,
    businessName: d.business_name,
    industry: d.industry ?? "",
    viewCount: d.view_count,
    createdAt: d.created_at,
  }));
}

export async function fetchRandomAnalysis(): Promise<{ id: string; analysis: BusinessAnalysis } | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, analysis_data")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data?.length) return null;
  const pick = data[Math.floor(Math.random() * data.length)];
  return { id: pick.id, analysis: pick.analysis_data as BusinessAnalysis };
}

// ── Business of the Day ────────────────────────────────────────────────────────

export async function fetchBotd(): Promise<{
  id: string;
  businessName: string;
  analysis: BusinessAnalysis;
} | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("business_of_the_day")
    .select("*")
    .eq("featured_date", today)
    .single();
  if (error || !data) return null;
  return { id: data.id, businessName: data.business_name, analysis: data.analysis_data as BusinessAnalysis };
}

export async function saveBotd(businessName: string, analysis: BusinessAnalysis): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("business_of_the_day").upsert({
    business_name: businessName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analysis_data: analysis as any,
    featured_date: today,
  });
}

export const BOTD_BUSINESSES = [
  "Zerodha", "Swiggy", "PhonePe", "CRED", "Meesho", "boAt", "Nykaa",
  "Razorpay", "BYJU's", "OYO", "Groww", "ShareChat", "Dunzo", "Rapido",
  "Zomato", "Flipkart", "Paytm", "Ola", "Freshworks", "Zoho",
  "Lenskart", "Mamaearth", "Delhivery", "Urban Company", "Vedantu",
  "Ather Energy", "Wakefit", "Country Delight", "Sugar Cosmetics", "Spinny",
];

export function getTodaysBotdName(): string {
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
  return BOTD_BUSINESSES[daysSinceEpoch % BOTD_BUSINESSES.length];
}
