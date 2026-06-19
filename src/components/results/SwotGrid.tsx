import { SectionCard } from "./SectionCard";
import { TrendingUp, AlertTriangle, Rocket, ShieldAlert, CheckCircle2, XCircle, Lightbulb, Flame } from "lucide-react";

type Props = { data: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] } };

const QUADRANTS = [
  {
    key: "strengths",
    label: "Strengths",
    icon: TrendingUp,
    bullet: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    header: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    bulletColor: "text-emerald-500",
    dot: "bg-emerald-400",
  },
  {
    key: "weaknesses",
    label: "Weaknesses",
    icon: AlertTriangle,
    bullet: XCircle,
    bg: "bg-amber-50",
    border: "border-amber-100",
    header: "bg-amber-400",
    badge: "bg-amber-100 text-amber-800",
    bulletColor: "text-amber-500",
    dot: "bg-amber-400",
  },
  {
    key: "opportunities",
    label: "Opportunities",
    icon: Lightbulb,
    bullet: Rocket,
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    header: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-800",
    bulletColor: "text-indigo-500",
    dot: "bg-indigo-400",
  },
  {
    key: "threats",
    label: "Threats",
    icon: ShieldAlert,
    bullet: Flame,
    bg: "bg-red-50",
    border: "border-red-100",
    header: "bg-red-500",
    badge: "bg-red-100 text-red-800",
    bulletColor: "text-red-500",
    dot: "bg-red-400",
  },
] as const;

export function SwotGrid({ data }: Props) {
  return (
    <SectionCard title="SWOT Analysis" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUADRANTS.map(({ key, label, icon: Icon, bullet: Bullet, bg, border, header, badge, bulletColor, dot }) => {
          const items = data[key] ?? [];
          return (
            <div key={key} className={`rounded-xl border ${border} ${bg} overflow-hidden`}>
              {/* Colored header strip */}
              <div className={`${header} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">{label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                  {items.length} {items.length === 1 ? "point" : "points"}
                </span>
              </div>
              {/* Items */}
              <ul className="p-4 space-y-2.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Bullet className={`h-4 w-4 shrink-0 mt-0.5 ${bulletColor}`} />
                    <span className="text-sm text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
