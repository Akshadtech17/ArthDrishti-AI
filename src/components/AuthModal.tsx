import { useState } from "react";
import { Mail, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: Props) {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSent(false);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {!sent ? (
          <>
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold">Sign in to ArthDrishti</h2>
              <p className="text-sm text-muted-foreground">
                No password. We'll email you a magic link — click it and you're in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  : "Send magic link"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              Signing in gives you persistent usage tracking and a better experience.
            </p>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Check your inbox</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Magic link sent to <strong>{email}</strong>.<br />
                Click it to sign in — no password needed.
              </p>
            </div>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Got it
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
