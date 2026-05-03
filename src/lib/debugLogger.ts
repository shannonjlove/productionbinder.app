import { supabase } from "@/integrations/supabase/client";

type Level = "info" | "warn" | "error" | "debug";

export async function logDebug(
  level: Level,
  message: string,
  opts: { source?: string; context?: Record<string, any> } = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("debug_events").insert({
      level,
      message,
      source: opts.source ?? "client",
      context: opts.context ?? null,
      user_id: user?.id ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
    });
  } catch {
    // swallow — never break app on logging failure
  }
}

export async function logSignInEvent(
  event_type:
    | "sign_in"
    | "sign_out"
    | "sign_in_failed"
    | "password_reset_request"
    | "password_reset_complete",
  opts: { email?: string | null; user_id?: string | null; metadata?: Record<string, any> } = {}
) {
  try {
    await supabase.from("sign_in_log").insert({
      event_type,
      email: opts.email ?? null,
      user_id: opts.user_id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata: opts.metadata ?? null,
    });
  } catch {
    // ignore
  }
}

// Install a global error handler once
let installed = false;
export function installGlobalDebugHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => {
    logDebug("error", e.message, {
      source: "window.error",
      context: { filename: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error?.stack },
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logDebug("error", String(e.reason?.message ?? e.reason ?? "unhandledrejection"), {
      source: "unhandledrejection",
      context: { stack: e.reason?.stack },
    });
  });
}
