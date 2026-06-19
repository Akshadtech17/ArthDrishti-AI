import { SectionCard } from "./SectionCard";
import { Target, TrendingUp, DollarSign, Scale, Rocket } from "lucide-react";

type Props = {
  data: { usp: string; valueProposition: string; growthStrategy: string; costStructure: string; scalingApproach: string };
};

const ITEMS = [
  { key: "usp",              label: "Unique Selling Proposition", icon: Target,     color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100", dot: "bg-indigo-500" },
  { key: "valueProposition", label: "Value Proposition",          icon: TrendingUp,  color: "text-violet-600", bg: "bg-violet-50 border-violet-100", dot: "bg-violet-500" },
  { key: "growthStrategy",   label: "Growth Strategy",            icon: Rocket,      color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-100",dot: "bg-emerald-500"},
  { key: "costStructure",    label: "Cost Structure",             icon: DollarSign,  color: "text-amber-600",  bg: "bg-amber-50 border-amber-100",   dot: "bg-amber-500"  },
  { key: "scalingApproach",  label: "Scaling Approach",           icon: Scale,       color: "text-blue-600",   bg: "bg-blue-50 border-blue-100",     dot: "bg-blue-500"   },
] as const;

export function DeepAnalysis({ data }: Props) {
  return (
    <SectionCard title="Deep Analysis" icon={<Target className="h-4 w-4 text-primary" />}>
      <div className="space-y-3">
        {ITEMS.map(({ key, label, icon: Icon, color, bg, dot }, i) => (
          <div key={key} className={`flex gap-4 p-4 rounded-xl border ${bg}`}>
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${bg} border`} style={{}}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              {i < ITEMS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[16px] rounded-full ${dot} opacity-20`} />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-widest ${color}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{data[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
