import { SectionCard } from "./SectionCard";
import { Target, Map, Zap, Trophy, ChevronRight } from "lucide-react";

type Props = { data: { problem: string; strategy: string; execution: string; outcome: string } };

const STEPS = [
  { key: "problem",   label: "Problem",   icon: Target, bg: "bg-red-500",     light: "bg-red-50 border-red-100",   text: "text-red-700"   },
  { key: "strategy",  label: "Strategy",  icon: Map,    bg: "bg-amber-500",   light: "bg-amber-50 border-amber-100",text:"text-amber-700"  },
  { key: "execution", label: "Execution", icon: Zap,    bg: "bg-blue-500",    light: "bg-blue-50 border-blue-100",  text: "text-blue-700"  },
  { key: "outcome",   label: "Outcome",   icon: Trophy, bg: "bg-emerald-500", light: "bg-emerald-50 border-emerald-100",text:"text-emerald-700"},
] as const;

export function FlowAnalysis({ data }: Props) {
  return (
    <SectionCard title="Business Flow" icon={<Zap className="h-4 w-4 text-primary" />}>

      {/* Desktop: horizontal pipeline */}
      <div className="hidden md:flex items-stretch gap-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-stretch flex-1">
              <div className={`flex-1 rounded-xl border ${step.light} p-4 flex flex-col gap-3`}>
                {/* Icon + label */}
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step.text}`}>{step.label}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">{data[step.key]}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center px-1 shrink-0">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical steps */}
      <div className="md:hidden space-y-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex gap-4">
              {/* Left: icon + connector */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`h-9 w-9 rounded-xl ${step.bg} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border my-1" />
                )}
              </div>
              {/* Right: content */}
              <div className={`flex-1 pb-4 ${i === STEPS.length - 1 ? "" : ""}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${step.text}`}>{step.label}</span>
                <p className="text-sm text-foreground leading-relaxed mt-1">{data[step.key]}</p>
              </div>
            </div>
          );
        })}
      </div>

    </SectionCard>
  );
}
