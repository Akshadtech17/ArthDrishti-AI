import { SectionCard } from "./SectionCard";
import { CheckCircle2, XCircle, TrendingUp, AlertOctagon, Globe } from "lucide-react";

type SuccessItem = { name: string; country: string; model: string; usp: string; keyDecisions: string[]; growthStrategy: string };
type FailureItem = { name: string; country: string; model: string; failureReason: string; mistakes: string[]; wrongDecisions: string[] };
type Props = { title: string; items: SuccessItem[] | FailureItem[]; type: "success" | "failure" };

function isSuccess(item: SuccessItem | FailureItem): item is SuccessItem {
  return "usp" in item;
}

const GRADIENTS = [
  "from-indigo-500 to-violet-600", "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",    "from-pink-500 to-rose-600",
];

export function ComparisonSection({ title, items, type }: Props) {
  const isSuccessType = type === "success";

  return (
    <SectionCard
      title={isSuccessType ? "Successful Comparisons" : "Failed Comparisons"}
      icon={isSuccessType
        ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        : <XCircle      className="h-4 w-4 text-red-500" />}
      accent={isSuccessType ? "green" : "red"}
    >
      <div className="grid grid-cols-1 gap-4">
        {items?.map((item, i) => {
          const initials = item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const gradient = GRADIENTS[item.name.charCodeAt(0) % GRADIENTS.length];
          return (
            <div key={i} className={`rounded-xl border overflow-hidden ${isSuccessType ? "border-emerald-100" : "border-red-100"}`}>

              {/* Card header */}
              <div className={`flex items-center gap-3 px-4 py-3 ${isSuccessType ? "bg-emerald-50" : "bg-red-50"}`}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-foreground">{item.name}</span>
                    {isSuccessType
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"><TrendingUp className="h-2.5 w-2.5" />Success</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><AlertOctagon className="h-2.5 w-2.5" />Failed</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.country}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{item.model}</span>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 space-y-3 bg-white">
                {isSuccess(item) ? (
                  <>
                    <InfoRow label="Unique Selling Proposition" value={item.usp} />
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Decisions</p>
                      <ul className="space-y-1.5">
                        {item.keyDecisions?.map((d, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <InfoRow label="Growth Strategy" value={item.growthStrategy} />
                  </>
                ) : (
                  <>
                    <InfoRow label="Why It Failed" value={item.failureReason} highlight="red" />
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Mistakes</p>
                      <ul className="space-y-1.5">
                        {item.mistakes?.map((m, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: "red" }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm leading-relaxed ${highlight === "red" ? "text-red-700 font-medium" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
