import { SectionCard } from "./SectionCard";
import { Brain, HelpCircle, Zap, CheckCircle2 } from "lucide-react";

type Item = { decision: string; why: string; impact: string; result: string };

export function DecisionIntelligence({ data }: { data: Item[] }) {
  return (
    <SectionCard title="Decision Intelligence" icon={<Brain className="h-4 w-4 text-primary" />}>
      <div className="space-y-4">
        {data?.map((item, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">

            {/* Decision header */}
            <div className="flex items-start gap-3 p-4 border-b border-border bg-muted/30">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="font-semibold text-foreground text-sm leading-snug">{item.decision}</p>
            </div>

            {/* Why / Impact / Result — 3-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <Cell icon={HelpCircle} label="Why" value={item.why}   color="text-amber-500"  />
              <Cell icon={Zap}        label="Impact" value={item.impact} color="text-blue-500"   />
              <Cell icon={CheckCircle2} label="Result" value={item.result} color="text-emerald-500" />
            </div>

          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function Cell({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}
