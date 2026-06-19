import type { ReactNode } from "react";

export function SectionCard({
  title,
  icon,
  children,
  className = "",
  accent,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: "green" | "yellow" | "red" | "indigo";
}) {
  const accentBar = {
    green:  "bg-emerald-400",
    yellow: "bg-amber-400",
    red:    "bg-red-400",
    indigo: "bg-primary",
  };

  return (
    <div className={`card-elevated rounded-2xl overflow-hidden ${className}`}>
      {/* Accent bar */}
      {accent && <div className={`h-1 w-full ${accentBar[accent]}`} />}

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        {icon && (
          <div className="h-8 w-8 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <h2 className="font-heading text-base sm:text-lg font-bold text-foreground leading-tight">
          {title}
        </h2>
      </div>

      {/* Body */}
      <div className="p-5 bg-white">{children}</div>
    </div>
  );
}
