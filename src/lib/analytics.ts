import { supabase } from "@/integrations/supabase/client";

// Fire-and-forget product analytics — never throws, never blocks the UI.
export async function track(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase
      .from("events")
      .insert({ event_name: event, properties: properties ?? {} });
  } catch {
    // Silently ignore — analytics must never break the app
  }
}
