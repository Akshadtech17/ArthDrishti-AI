// Creates a Razorpay order server-side — secret key never touches the browser.
// Deploy: npx supabase functions deploy create-razorpay-order --project-ref helqwsxtwetpazrebhsi
// Secrets: npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=xxx --project-ref helqwsxtwetpazrebhsi

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRO_PRICE_PAISE = 19900; // ₹199 in paise

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID");
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!KEY_ID || !KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Razorpay keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = btoa(`${KEY_ID}:${KEY_SECRET}`);

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: PRO_PRICE_PAISE,
        currency: "INR",
        notes: { product: "ArthDrishti Pro", duration: "30 days" },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error("Razorpay order error:", err);
      throw new Error("Failed to create Razorpay order");
    }

    const order = await orderRes.json();

    return new Response(
      JSON.stringify({ orderId: order.id, amount: order.amount, currency: order.currency }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
