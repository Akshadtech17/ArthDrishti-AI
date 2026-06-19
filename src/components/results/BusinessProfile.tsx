import type { BusinessAnalysis } from "@/lib/api";
import { Building2, Layers, DollarSign, Users, Globe, Gauge, MapPin } from "lucide-react";

const STAGE_COLOR: Record<string, string> = {
  "Idea Stage":   "bg-gray-100 text-gray-600 border-gray-200",
  "Early Stage":  "bg-blue-50 text-blue-700 border-blue-200",
  "Growth Stage": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Mature":       "bg-violet-50 text-violet-700 border-violet-200",
  "Scale Stage":  "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
];

export function BusinessProfile({ data }: { data: { businessName: string; industry: string; businessModel: string; revenueModel: string; targetMarket: string; geography: string; stage: string } }) {
  const initials = data.businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const gradient = GRADIENTS[data.businessName.charCodeAt(0) % GRADIENTS.length];
  const stageStyle = STAGE_COLOR[data.stage] ?? "bg-indigo-50 text-indigo-700 border-indigo-200";

  return (
    <div className="card-elevated rounded-2xl overflow-hidden">

      {/* ── Gradient header ────────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${gradient} px-6 pt-6 pb-10`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white leading-tight">
                {data.businessName}
              </h1>
              <p className="text-white/75 text-sm mt-0.5 font-medium">{data.industry}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${stageStyle} bg-white/90 shrink-0`}>
            <Gauge className="h-3 w-3" />
            {data.stage}
          </span>
        </div>
      </div>

      {/* ── Metrics grid — overlaps the header ─────────────────── */}
      <div className="px-4 sm:px-6 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <MetricCard icon={Layers} label="Business Model" value={data.businessModel} />
          <MetricCard icon={DollarSign} label="Revenue Model" value={data.revenueModel} />
          <MetricCard icon={Users} label="Target Market" value={data.targetMarket} />

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4 mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground">Geography:</span> {data.geography}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground">Industry:</span> {data.industry}
        </span>
      </div>

    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
    </div>
  );
}
