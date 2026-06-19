import { SectionCard } from "./SectionCard";
import { XCircle, CheckCircle2, AlertTriangle, Globe } from "lucide-react";

type Item = { business: string; wrongDecision: string; stageOfFailure: string; rootCause: string; correctAlternative: string };

const GRADIENTS = [
  "from-indigo-500 to-violet-600", "from-blue-500 to-indigo-600",
  "from-orange-500 to-red-500",    "from-pink-500 to-rose-600",
];

export function WhereTheyWentWrong({ data }: { data: Item[] }) {
  return (
    <SectionCard title="Where They Went Wrong" icon={<XCircle className="h-4 w-4 text-red-500" />} accent="red">
      <div className="space-y-4">
        {data?.map((item, i) => {
          const initials = item.business.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const gradient = GRADIENTS[item.business.charCodeAt(0) % GRADIENTS.length];
          return (
            <div key={i} className="rounded-xl border border-border overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {initials}
                  </div>
                  <span className="font-heading font-bold text-foreground">{item.business}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  {item.stageOfFailure}
                </div>
              </div>

              {/* 3-column body */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-white">

                {/* Wrong decision */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Wrong Decision</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{item.wrongDecision}</p>
                </div>

                {/* Root cause */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Root Cause</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.rootCause}</p>
                </div>

                {/* Correct alternative */}
                <div className="p-4 bg-emerald-50/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Better Approach</span>
                  </div>
                  <p className="text-sm text-emerald-800 font-medium leading-relaxed">{item.correctAlternative}</p>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
