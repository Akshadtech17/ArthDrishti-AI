import { SectionCard } from "./SectionCard";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";

type Props = { data: { factors: string[]; successPatterns: string[]; failurePatterns: string[] } };

export function SideBySide({ data }: Props) {
  const factors = data?.factors ?? [];

  return (
    <SectionCard title="Success vs Failure Patterns" icon={<Scale className="h-4 w-4 text-primary" />}>

      {/* ── Desktop: 3-column grid ─────────────────────────────── */}
      <div className="hidden md:block space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-3 mb-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1">Factor</div>
          <div className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Success Pattern</span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-red-50 border border-red-100">
            <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Failure Pattern</span>
          </div>
        </div>

        {/* Data rows */}
        {factors.map((factor, i) => {
          const success = data.successPatterns?.[i];
          const failure = data.failurePatterns?.[i];
          if (!success && !failure) return null;
          return (
            <div key={i} className="grid grid-cols-[1.1fr_1fr_1fr] gap-3 items-start">
              <div className="py-3 px-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-sm font-semibold text-foreground leading-snug">{factor}</p>
              </div>
              <div className="py-3 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm text-emerald-800 leading-relaxed">{success || "—"}</p>
              </div>
              <div className="py-3 px-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-800 leading-relaxed">{failure || "—"}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: stacked card per factor ───────────────────── */}
      <div className="md:hidden space-y-4">
        {factors.map((factor, i) => {
          const success = data.successPatterns?.[i];
          const failure = data.failurePatterns?.[i];
          if (!success && !failure) return null;
          return (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              {/* Factor label */}
              <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
                <p className="text-sm font-bold text-foreground">{factor}</p>
              </div>
              {/* Success */}
              {success && (
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Success</span>
                  </div>
                  <p className="text-sm text-emerald-800 leading-relaxed">{success}</p>
                </div>
              )}
              {/* Failure */}
              {failure && (
                <div className="px-4 py-3 bg-red-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Failure</span>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed">{failure}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </SectionCard>
  );
}
