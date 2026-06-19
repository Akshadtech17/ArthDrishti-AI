import { useState } from "react";
import { Share2, Sparkles, X, Crown, Loader2, ShieldCheck, Mail, CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  onProActivated: (token: string) => void;
  hasUnlocked: boolean;
};

export function FreemiumGate({ open, onClose, onUnlocked, onProActivated, hasUnlocked }: Props) {
  const { toast } = useToast();
  const { user, signInWithEmail } = useAuth();

  const [justUnlocked,    setJustUnlocked]    = useState(false);
  const [paymentLoading,  setPaymentLoading]  = useState(false);
  const [email,           setEmail]           = useState("");
  const [magicLoading,    setMagicLoading]    = useState(false);
  const [magicSent,       setMagicSent]       = useState(false);

  if (!open) return null;

  const alreadyUnlocked = hasUnlocked || justUnlocked;

  // ── Share-to-unlock ──────────────────────────────────────────────────────────
  const handleShare = () => {
    const url = `${window.location.origin}?ref=shared`;
    navigator.clipboard.writeText(url).catch(() => {});
    onUnlocked();
    setJustUnlocked(true);
    track("share_unlock_clicked");
    toast({ title: "2 analyses unlocked!", description: "Share link copied. Send it to a friend." });
  };

  // ── Magic-link sign-in (inline, no extra modal) ───────────────────────────
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMagicLoading(true);
    try {
      await signInWithEmail(email.trim());
      setMagicSent(true);
      track("gate_signin_clicked");
    } catch {
      toast({ title: "Could not send link", description: "Check your email and try again.", variant: "destructive" });
    } finally {
      setMagicLoading(false);
    }
  };

  // ── Razorpay pro checkout ─────────────────────────────────────────────────
  const handleProCheckout = async () => {
    const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes("REPLACE")) {
      toast({ title: "Payments not configured yet", description: "Add your Razorpay key to .env", variant: "destructive" });
      return;
    }

    setPaymentLoading(true);
    track("pro_checkout_opened");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey     = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const orderRes = await fetch(`${supabaseUrl}/functions/v1/create-razorpay-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!orderRes.ok) throw new Error("Could not create payment order. Try again.");
      const { orderId, amount, currency } = await orderRes.json();

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "ArthDrishti",
        description: "Pro — Unlimited Analyses for 30 Days",
        order_id: orderId,
        prefill: user?.email ? { email: user.email } : {},
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setPaymentLoading(false) },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: { session } } = await supabase.auth.getSession();
            const authToken = session?.access_token ?? anonKey;

            const verifyRes = await fetch(`${supabaseUrl}/functions/v1/verify-razorpay-payment`, {
              method: "POST",
              headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                order_id:   response.razorpay_order_id,
                signature:  response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error("Payment verification failed.");
            const { accessToken } = await verifyRes.json();

            track("pro_activated", { payment_id: response.razorpay_payment_id });
            onProActivated(accessToken);
            onClose();
            toast({ title: "Welcome to Pro!", description: "Unlimited analyses for 30 days." });
          } catch (e) {
            toast({ title: "Verification failed", description: e instanceof Error ? e.message : "Contact support.", variant: "destructive" });
          } finally {
            setPaymentLoading(false);
          }
        },
      });

      rzp.open();
    } catch (e) {
      setPaymentLoading(false);
      toast({ title: "Payment error", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold">Daily limit reached</h2>
          <p className="text-sm text-muted-foreground">You've used your <strong>3 free analyses</strong> for today. Choose how to continue:</p>
        </div>

        {/* ── Pro upgrade ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Go Pro — ₹199/month</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-green-500 shrink-0" /> Unlimited analyses every day</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-green-500 shrink-0" /> Access on all your devices</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-green-500 shrink-0" /> Priority access to new features</li>
          </ul>
          <Button className="w-full" onClick={handleProCheckout} disabled={paymentLoading}>
            {paymentLoading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
              : <><Crown className="h-4 w-4 mr-2" />Upgrade for ₹199/month</>}
          </Button>
        </div>

        <Divider />

        {/* ── Sign-in (only when not authenticated) ───────────────────────── */}
        {!user && (
          <>
            {!magicSent ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5 shrink-0" />
                  Sign in for persistent tracking across browsers &amp; devices
                </p>
                <form onSubmit={handleMagicLink} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm" disabled={magicLoading || !email.trim()}>
                    {magicLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send link"}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Magic link sent to <strong>{email}</strong> — check your inbox!</span>
              </div>
            )}

            <Divider />
          </>
        )}

        {/* ── Share to unlock ──────────────────────────────────────────────── */}
        {!alreadyUnlocked ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Share ArthDrishti to unlock <strong>2 more free analyses</strong> today
            </p>
            <Button variant="outline" className="w-full" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />Share &amp; Unlock 2 More
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <span>2 extra analyses unlocked for today!</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">Free limit resets at midnight · No account needed</p>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
