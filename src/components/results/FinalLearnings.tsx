import { SectionCard } from "./SectionCard";
import { CheckCircle2, XCircle, Zap, Target, GraduationCap } from "lucide-react";

type Props = {
  data: { whatToDo: string[]; whatToAvoid: string[]; strategyRules: string[]; decisionFrameworks: string[] };
};

const SECTIONS = [
  {
    key: "whatToDo",
    label: "What To Do",
    icon: CheckCircle2,
    headerBg: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    bullet: "bg-emerald-400",
    textColor: "text-emerald-800",
  },
  {
    key: "whatToAvoid",
    label: "What To Avoid",
    icon: XCircle,
    headerBg: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
    bullet: "bg-red-400",
    textColor: "text-red-800",
  },
  {
    key: "strategyRules",
    label: "Strategy Rules",
    icon: Zap,
    headerBg: "bg-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    bullet: "bg-indigo-400",
    textColor: "text-indigo-800",
  },
  {
    key: "decisionFrameworks",
    label: "Decision Frameworks",
    icon: Target,
    headerBg: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    bullet: "bg-amber-400",
    textColor: "text-amber-800",
  },
] as const;

export function FinalLearnings({ data }: Props) {
  return (
    <SectionCard title="Final Learnings" icon={<GraduationCap className="h-4 w-4 text-primary" />} accent="indigo">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ key, label, icon: Icon, headerBg, bg, border, bullet, textColor }) => {
          const items = data?.[key] ?? [];
          return (
            <div key={key} className={`rounded-xl border ${border} ${bg} overflow-hidden`}>
              {/* Header */}
              <div className={`${headerBg} flex items-center justify-between px-4 py-3`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">{label}</span>
                </div>
                <span className="text-[11px] font-bold text-white/70">{items.length} rules</span>
              </div>
              {/* List */}
              <ul className="p-4 space-y-2.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${bullet} mt-2 shrink-0`} />
                    <span className={`text-sm leading-relaxed ${textColor} font-medium`}>{item}</span>
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
