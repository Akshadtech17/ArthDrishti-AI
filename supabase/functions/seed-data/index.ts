// One-time seed function: populates the DB with initial business analyses so
// trending, history, and the simulator all have content from day one.
// Call once: curl -X POST https://nttrsltuequkgotwonpt.supabase.co/functions/v1/seed-data \
//   -H "Authorization: Bearer <anon_key>" -H "Content-Type: application/json"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEED_BUSINESSES = [
  "Zerodha", "Swiggy", "CRED", "Zomato",
  "PhonePe", "Razorpay", "boAt", "Meesho",
];

const SYSTEM_PROMPT = `You are ArthDrishti — a world-class Global Business Intelligence engine.
Return ONLY valid JSON with this exact structure (no markdown):
{
  "businessName":"string","industry":"string","businessModel":"string","revenueModel":"string",
  "targetMarket":"string","geography":"string","stage":"string",
  "deepAnalysis":{"usp":"string","valueProposition":"string","growthStrategy":"string","costStructure":"string","scalingApproach":"string"},
  "flowAnalysis":{"problem":"string","strategy":"string","execution":"string","outcome":"string"},
  "swot":{"strengths":["string"],"weaknesses":["string"],"opportunities":["string"],"threats":["string"]},
  "decisionIntelligence":[{"decision":"string","why":"string","impact":"string","result":"string"}],
  "successfulComparisons":[{"name":"string","country":"string","model":"string","usp":"string","keyDecisions":["string"],"growthStrategy":"string"}],
  "failedComparisons":[{"name":"string","country":"string","model":"string","failureReason":"string","mistakes":["string"],"wrongDecisions":["string"]}],
  "sideBySide":{"factors":["Strategy","Execution","Market Fit","Scaling","Decision Making","Funding","Team"],"successPatterns":["string"],"failurePatterns":["string"]},
  "whereTheyWentWrong":[{"business":"string","wrongDecision":"string","stageOfFailure":"string","rootCause":"string","correctAlternative":"string"}],
  "finalLearnings":{"whatToDo":["string"],"whatToAvoid":["string"],"strategyRules":["string"],"decisionFrameworks":["string"]}
}`;

async function analyzeOne(business: string, groqKey: string): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Analyze: "${business}". Return ONLY valid JSON.` },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 6000,
    }),
  });
  if (!res.ok) throw new Error(`Groq error for ${business}: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Skip if DB already has enough analyses
    const { count } = await supabase.from("analyses").select("*", { count: "exact", head: true });
    if ((count ?? 0) >= SEED_BUSINESSES.length) {
      return new Response(
        JSON.stringify({ message: "DB already seeded", count }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find which businesses are already in the DB
    const { data: existing } = await supabase
      .from("analyses")
      .select("business_name")
      .in("business_name", SEED_BUSINESSES);

    const existingNames = new Set((existing ?? []).map((r: { business_name: string }) => r.business_name));
    const toSeed = SEED_BUSINESSES.filter((b) => !existingNames.has(b));

    if (toSeed.length === 0) {
      return new Response(
        JSON.stringify({ message: "All seed businesses already exist" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze all missing businesses in parallel (Groq handles concurrent requests)
    const results = await Promise.allSettled(
      toSeed.map(async (business) => {
        const analysis = await analyzeOne(business, GROQ_API_KEY);
        await supabase.from("analyses").insert({
          query: business,
          business_name: analysis.businessName ?? business,
          industry: (analysis.industry as string) ?? "Technology",
          analysis_data: analysis,
          view_count: Math.floor(Math.random() * 200) + 50, // realistic starting views
        });
        return business;
      })
    );

    const seeded   = results.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<string>).value);
    const failed   = results.filter((r) => r.status === "rejected").map((_, i) => toSeed[i]);

    return new Response(
      JSON.stringify({ seeded, failed, total: seeded.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("seed-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
