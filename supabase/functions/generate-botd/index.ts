// Scheduled edge function — runs daily at 00:01 UTC via pg_cron
// Pre-generates the Business of the Day so the first visitor never waits.
// Deploy: npx supabase functions deploy generate-botd --project-ref helqwsxtwetpazrebhsi
// Secret:  npx supabase secrets set GROQ_API_KEY=<key> --project-ref helqwsxtwetpazrebhsi

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOTD_BUSINESSES = [
  "Zerodha", "Swiggy", "PhonePe", "CRED", "Meesho", "boAt", "Nykaa",
  "Razorpay", "BYJU's", "OYO", "Groww", "ShareChat", "Dunzo", "Rapido",
  "Zomato", "Flipkart", "Paytm", "Ola", "Freshworks", "Zoho",
  "Lenskart", "Mamaearth", "Delhivery", "Urban Company", "Vedantu",
  "Ather Energy", "Wakefit", "Country Delight", "Sugar Cosmetics", "Spinny",
];

function getTodaysBotdName(): string {
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
  return BOTD_BUSINESSES[daysSinceEpoch % BOTD_BUSINESSES.length];
}

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
2. Include small/bootstrap examples when relevant
3. Use FACT-BASED, real-world reasoning
4. Include at least 3 successful and 3 failed comparisons
5. Reference real companies, real failures, real strategies
6. Indian startup failures: Stayzilla, PepperTap, Dazo, AskMe, TinyOwl, Foodpanda India, etc.
7. Indian successes: Ola, Flipkart, Zomato, Razorpay, Zerodha, etc.
8. Global: Uber, Amazon, Airbnb, WeWork (failure), Theranos (failure), etc.
9. Every insight must be decision-level, not surface-level`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Idempotent: skip if already generated for today
    const { data: existing } = await supabase
      .from("business_of_the_day")
      .select("id, business_name")
      .eq("featured_date", today)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Already generated", business: existing.business_name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const businessName = getTodaysBotdName();

    // Call Groq
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
          {
            role: "user",
            content: `Analyze this business comprehensively: "${businessName}". Return ONLY valid JSON matching the required schema.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 8192,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", groqRes.status, errText);
      return new Response(JSON.stringify({ error: "Groq API failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content ?? "";
    const analysis = JSON.parse(content);

    // Save to business_of_the_day
    const { error: insertError } = await supabase.from("business_of_the_day").upsert({
      business_name: businessName,
      analysis_data: analysis,
      featured_date: today,
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, business: businessName, date: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-botd error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
