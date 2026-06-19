import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const PRO_KEY = "arthdrishti_pro";

type ProData = { token: string; expiresAt: number };

function readProData(): ProData | null {
  try {
    const raw = localStorage.getItem(PRO_KEY);
    if (!raw) return null;
    const data: ProData = JSON.parse(raw);
    if (data.expiresAt <= Date.now()) {
      localStorage.removeItem(PRO_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function getProToken(): string | null {
  return readProData()?.token ?? null;
}

export function useProStatus() {
  const [proData, setProData] = useState<ProData | null>(readProData);

  const isPro  = proData !== null;
  const daysLeft = proData ? Math.ceil((proData.expiresAt - Date.now()) / 86_400_000) : 0;

  const activatePro = useCallback((token: string) => {
    const data: ProData = { token, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    localStorage.setItem(PRO_KEY, JSON.stringify(data));
    setProData(data);
  }, []);

  // Verify localStorage token against DB (catches revoked/expired tokens)
  const verifyWithServer = useCallback(async (token: string): Promise<boolean> => {
    const { data } = await supabase
      .from("pro_subscriptions")
      .select("expires_at")
      .eq("access_token", token)
      .single();
    if (!data || new Date(data.expires_at).getTime() <= Date.now()) {
      localStorage.removeItem(PRO_KEY);
      setProData(null);
      return false;
    }
    return true;
  }, []);

  // Cross-device restore: when a user signs in, check if they have a linked pro subscription
  const syncWithUser = useCallback(async (userId: string): Promise<void> => {
    if (proData) {
      // Already have a token — just verify it's still valid
      await verifyWithServer(proData.token);
      return;
    }
    // No local token — check DB for a subscription linked to this user account
    const { data } = await supabase
      .from("pro_subscriptions")
      .select("access_token, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      activatePro(data.access_token);
    }
  }, [proData, verifyWithServer, activatePro]);

  return { isPro, daysLeft, token: proData?.token ?? null, activatePro, verifyWithServer, syncWithUser };
}
