import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, Calendar, History, Zap, LogIn, LogOut, User, BarChart3 } from "lucide-react";
import { useStreak } from "@/lib/streak";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/botd",      label: "Today's Business", shortLabel: "Today",     icon: Calendar },
  { to: "/simulator", label: "Simulator",         shortLabel: "Simulate",  icon: Zap      },
  { to: "/history",   label: "History",           shortLabel: "History",   icon: History  },
];

export function Header() {
  const location = useLocation();
  const { streak } = useStreak();
  const { user, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

      {/* ── Desktop + tablet header ─────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-gradient hidden sm:block">
              ArthDrishti
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[15px] font-medium rounded-lg transition-all ${
                  isActive(to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {streak.count > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-600 rounded-full text-xs font-semibold">
                <Flame className="h-3.5 w-3.5" />
                {streak.count}d
              </div>
            )}

            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-lg">
                    <User className="h-3 w-3" />
                    {user.email?.split("@")[0]}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={signOut}
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-sm gap-1.5 hidden sm:inline-flex"
                  onClick={() => setShowAuth(true)}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation bar ───────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center">
          {/* Home */}
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-medium transition-colors ${
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Home
          </Link>

          {NAV.map(({ to, shortLabel, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-medium transition-colors ${
                isActive(to)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {shortLabel}
            </Link>
          ))}

          {/* Auth */}
          <button
            onClick={() => !loading && (user ? signOut() : setShowAuth(true))}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {user ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            {user ? "Sign out" : "Sign in"}
          </button>
        </div>
      </nav>
    </>
  );
}
