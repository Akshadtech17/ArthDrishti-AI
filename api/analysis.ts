// Vercel serverless function: intercepts /analysis/:id requests and injects
// analysis-specific meta tags into the built index.html before serving it.
// Crawlers (Google, Twitter, WhatsApp) see real titles and descriptions.
// Browsers receive the full SPA and React takes over from there.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default async function handler(req: any, res: any) {
  const id = req.query?.id as string | undefined;

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.redirect(302, "/");
    return;
  }

  // Read the built SPA — Vercel bundles it via includeFiles in vercel.json
  let html: string;
  try {
    html = readFileSync(join(process.cwd(), "dist", "index.html"), "utf-8");
  } catch {
    res.redirect(302, `/analysis-client/${id}`);
    return;
  }

  // Fetch analysis metadata from Supabase (public data, anon key is fine)
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data } = await supabase
      .from("analyses")
      .select("business_name, industry, analysis_data, view_count")
      .eq("id", id)
      .single();

    if (data) {
      const businessName = data.business_name;
      const industry     = (data.analysis_data as any)?.industry ?? data.industry ?? "Business";
      const usp          = (data.analysis_data as any)?.deepAnalysis?.usp ?? "";
      const title        = `${businessName} Business Analysis | ArthDrishti`;
      const description  = `AI deep-dive into ${businessName} (${industry})${usp ? ": " + usp.substring(0, 120) : ""}. SWOT, strategy, real-world comparisons & decision intelligence.`;
      const url          = `https://${req.headers.host}/analysis/${id}`;

      // Inject into the built HTML — replace existing generic tags
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${esc(description)}" />`)
        .replace(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${esc(title)}" />`)
        .replace(/<meta property="og:description"[^>]*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
        .replace(/<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${esc(title)}" />`)
        .replace(/<meta name="twitter:description"[^>]*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`)
        .replace(
          "</head>",
          `  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:type" content="article" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${esc(url)}" />
</head>`
        );
    }
  } catch {
    // DB fetch failed — serve unmodified SPA (still works for users, just generic meta for crawlers)
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache at the CDN edge for 1 hour; serve stale while revalidating for 24 hours
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.send(html);
}
