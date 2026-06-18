import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  name: string;
  email?: string;
  phone?: string;
}

interface NotificationRequest {
  productionId: string;
  callSheet: {
    productionName: string;
    shootDate: string;
    generalCallTime: string;
    locations: Array<{ name: string; address: string }>;
    weather?: string;
    temperature?: string;
    specialInstructions?: string;
  };
  recipient?: Recipient;
  recipients?: Recipient[];
  method: "email" | "sms" | "both";
  batch?: boolean;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normPhone = (p?: string) => (p ? p.replace(/[^\d+]/g, "") : "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  const userId = claimsData?.claims?.sub as string | undefined;
  if (claimsError || !userId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const esc = (s: unknown): string =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  let request: NotificationRequest;
  try {
    request = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { productionId, callSheet, recipient, recipients, method, batch } = request;

  if (!productionId || !UUID_RE.test(productionId)) {
    return json({ error: "productionId is required" }, 400);
  }
  if (!callSheet || typeof callSheet !== "object") {
    return json({ error: "callSheet is required" }, 400);
  }
  if (method !== "email" && method !== "sms" && method !== "both") {
    return json({ error: "Invalid method" }, 400);
  }

  // Service-role client for authorization & recipient validation (bypasses RLS server-side only)
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Verify caller is a member of the production
  const { data: memberCheck, error: memberErr } = await admin.rpc("is_production_member", {
    _user_id: userId,
    _production_id: productionId,
  });
  if (memberErr || !memberCheck) {
    return json({ error: "Forbidden: not a member of this production" }, 403);
  }

  const requested: Recipient[] = batch && recipients ? recipients : recipient ? [recipient] : [];
  if (requested.length === 0) {
    return json({ error: "No recipients provided" }, 400);
  }
  if (requested.length > 200) {
    return json({ error: "Too many recipients" }, 400);
  }

  // Load production-approved contact info from cast & crew
  const [{ data: crew }, { data: cast }] = await Promise.all([
    admin.from("crew_members").select("email, phone").eq("production_id", productionId),
    admin.from("cast_members").select("email, phone").eq("production_id", productionId),
  ]);

  const allowedEmails = new Set<string>();
  const allowedPhones = new Set<string>();
  for (const row of [...(crew ?? []), ...(cast ?? [])] as Array<{ email?: string | null; phone?: string | null }>) {
    if (row.email) allowedEmails.add(row.email.toLowerCase());
    if (row.phone) allowedPhones.add(normPhone(row.phone));
  }

  // Filter to only recipients whose contact info belongs to this production
  const safeRecipients: Recipient[] = requested
    .map((r) => ({
      name: String(r.name ?? "").slice(0, 200),
      email: r.email && EMAIL_RE.test(r.email) && allowedEmails.has(r.email.toLowerCase()) ? r.email : undefined,
      phone: r.phone && allowedPhones.has(normPhone(r.phone)) ? r.phone : undefined,
    }))
    .filter((r) => r.email || r.phone);

  const rejectedCount = requested.length - safeRecipients.length;

  if (safeRecipients.length === 0) {
    return json(
      { error: "No recipients matched this production's cast or crew", rejected: rejectedCount },
      400,
    );
  }

  const results = {
    email: { sent: 0, failed: 0 },
    sms: { sent: 0, failed: 0 },
    rejected: rejectedCount,
  };

  try {
    if (method === "email" || method === "both") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        for (const r of safeRecipients) {
          if (!r.email) continue;
          try {
            const locationInfo = callSheet.locations?.length
              ? callSheet.locations.map((l) => `${esc(l.name)}: ${esc(l.address)}`).join("<br>")
              : "TBD";

            const emailHtml = `
              <h1>Call Sheet: ${esc(callSheet.productionName)}</h1>
              <p>Hi ${esc(r.name)},</p>
              <p><strong>Date:</strong> ${esc(callSheet.shootDate)}</p>
              <p><strong>Call Time:</strong> ${esc(callSheet.generalCallTime)}</p>
              <p><strong>Location:</strong> ${locationInfo}</p>
              ${callSheet.specialInstructions ? `<p><strong>Notes:</strong> ${esc(callSheet.specialInstructions)}</p>` : ""}
            `;

            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Call Sheet <onboarding@resend.dev>",
                to: [r.email],
                subject: `Call Sheet: ${callSheet.productionName} - ${callSheet.shootDate}`,
                html: emailHtml,
              }),
            });

            if (response.ok) results.email.sent++;
            else results.email.failed++;
          } catch (err) {
            console.error("email send failed", err);
            results.email.failed++;
          }
        }
      }
    }

    if (method === "sms" || method === "both") {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioSid && twilioAuth && twilioPhone) {
        for (const r of safeRecipients) {
          if (!r.phone) continue;
          try {
            const locationName = callSheet.locations?.[0]?.name || "TBD";
            const smsBody = `CALL SHEET: ${callSheet.productionName}\nDate: ${callSheet.shootDate}\nCall: ${callSheet.generalCallTime}\nLocation: ${locationName}`;

            const auth = btoa(`${twilioSid}:${twilioAuth}`);
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${auth}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ To: r.phone, From: twilioPhone, Body: smsBody }),
              },
            );

            if (response.ok) results.sms.sent++;
            else results.sms.failed++;
          } catch (err) {
            console.error("sms send failed", err);
            results.sms.failed++;
          }
        }
      }
    }

    return json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("notification error:", message);
    return json({ error: "Failed to send notifications" }, 500);
  }
});
