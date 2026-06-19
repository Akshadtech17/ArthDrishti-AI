import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_DAILY_LIMIT = 3;

const SYSTEM_PROMPT = `You are ArthDrishti — a world-class Global Business Intelligence & Comparative Decision Engine.

You analyze ANY business: global corporations, Indian startups, small/bootstrap businesses, and early-stage ideas.

When the user provides a business name or idea, you MUST return a comprehensive JSON analysis. Your response must be ONLY valid JSON, no markdown, no explanation outside JSON.

Return this exact JSON structure:
{
  "businessName": "string",
  "industry": "string",
  "businessModel": "string",
  "revenueModel": "string",
  "targetMarket": "string",
  "geography": "string",
  "stage": "string",
  "deepAnalysis": {
    "usp": "string",
    "valueProposition": "string",
    "growthStrategy": "string",
    "costStructure": "string",
    "scalingApproach": "string"
  },
  "flowAnalysis": {
    "problem": "string",
    "strategy": "string",
    "execution": "string",
    "outcome": "string"
  },
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "decisionIntelligence": [
    { "decision": "string", "why": "string", "impact": "string", "result": "string" }
  ],
  "successfulComparisons": [
    { "name": "string", "country": "string", "model": "string", "usp": "string", "keyDecisions": ["string"], "growthStrategy": "string" }
  ],
  "failedComparisons": [
    { "name": "string", "country": "string", "model": "string", "failureReason": "string", "mistakes": ["string"], "wrongDecisions": ["string"] }
  ],
  "sideBySide": {
    "factors": ["Strategy", "Execution", "Market Fit", "Scaling", "Decision Making", "Funding", "Team"],
    "successPatterns": ["string for each factor"],
    "failurePatterns": ["string for each factor"]
  },
  "whereTheyWentWrong": [
    { "business": "string", "wrongDecision": "string", "stageOfFailure": "string", "rootCause": "string", "correctAlternative": "string" }
  ],
  "finalLearnings": {
    "whatToDo": ["string"],
    "whatToAvoid": ["string"],
    "strategyRules": ["string"],
    "decisionFrameworks": ["string"]
  }
}

CRITICAL RULES:
1. Include BOTH global AND Indian businesses in comparisons
2. Use the FACTUAL CONTEXT provided — it contains real data from Wikipedia. Anchor your analysis on those facts.
3. Include at least 3 successful and 3 failed comparisons with real companies
4. Indian startup failures: Stayzilla, PepperTap, Dazo, AskMe, TinyOwl, Foodpanda India
5. Indian successes: Ola, Flipkart, Zomato, Razorpay, Zerodha, CRED, PhonePe
6. Global: Uber, Amazon, Airbnb, WeWork (failure), Theranos (failure)
7. Every insight must be decision-level, not surface-level`;

async function fetchWikipediaContext(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { headers: { "User-Agent": "ArthDrishti/1.0 (business-intelligence; contact: akaloni17@gmail.com)" } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const lines: string[] = [];
    if (data.description) lines.push(`Type: ${data.description}`);
    if (data.extract)     lines.push(`Overview: ${data.extract.substring(0, 800)}`);
    return lines.join("\n");
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY            = Deno.env.get("GROQ_API_KEY");
    const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "Service not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { query, proToken } = body;

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Pro check (token submitted by client, verified server-side) ────────────
    let isPro = false;
    if (proToken) {
      const { data: proSub } = await supabaseAdmin
        .from("pro_subscriptions")
        .select("id")
        .eq("access_token", proToken)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      isPro = !!proSub;
    }

    // ── Server-side rate limiting (skipped for pro) ────────────────────────────
    if (!isPro) {
      // Prefer authenticated user ID; fall back to client IP
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwt = authHeader.replace("Bearer ", "");

      let userId: string;
      const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);

      if (user?.id) {
        userId = user.id;
      } else {
        const ip =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          req.headers.get("x-real-ip") ??
          "unknown";
        userId = `ip:${ip}`;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: usageResult, error: usageError } = await supabaseAdmin.rpc(
        "increment_daily_usage",
        { p_user_id: userId, p_date: today, p_limit: FREE_DAILY_LIMIT }
      );

      if (!usageError && usageResult && !usageResult.allowed) {
        return new Response(
          JSON.stringify({ error: "Daily limit reached. Share ArthDrishti or upgrade to Pro for unlimited access." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Wikipedia enrichment + Groq analysis ──────────────────────────────────
    const wikiContext = await fetchWikipediaContext(query);

    const userMessage = [
      wikiContext
        ? `FACTUAL CONTEXT (from Wikipedia — treat these as ground truth):\n${wikiContext}`
        : null,
      `Analyze this business comprehensively: "${query}". Return ONLY valid JSON matching the required schema.`,
    ].filter(Boolean).join("\n\n");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 8192,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", groqRes.status, errText);
      if (groqRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service temporarily unavailable. Please retry.");
    }

    const groqData = await groqRes.json();
    const content  = groqData.choices?.[0]?.message?.content ?? "";

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Failed to parse Groq JSON:", content.substring(0, 300));
      throw new Error("AI returned malformed response. Please retry.");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-business error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
