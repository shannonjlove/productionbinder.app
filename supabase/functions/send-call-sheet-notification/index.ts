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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const esc = (s: unknown): string =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  try {
    const request: NotificationRequest = await req.json();
    const { callSheet, recipient, recipients, method, batch } = request;

    const allRecipients = batch && recipients ? recipients : recipient ? [recipient] : [];
    
    if (allRecipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      email: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 }
    };

    // Send emails using fetch to Resend API
    if (method === "email" || method === "both") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      
      if (resendApiKey) {
        for (const r of allRecipients) {
          if (!r.email) continue;

          try {
            const locationInfo = callSheet.locations?.length 
              ? callSheet.locations.map(l => `${l.name}: ${l.address}`).join("\n")
              : "TBD";

            const emailHtml = `
              <h1>Call Sheet: ${callSheet.productionName}</h1>
              <p>Hi ${r.name},</p>
              <p><strong>Date:</strong> ${callSheet.shootDate}</p>
              <p><strong>Call Time:</strong> ${callSheet.generalCallTime}</p>
              <p><strong>Location:</strong> ${locationInfo}</p>
              ${callSheet.specialInstructions ? `<p><strong>Notes:</strong> ${callSheet.specialInstructions}</p>` : ""}
            `;

            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Call Sheet <onboarding@resend.dev>",
                to: [r.email],
                subject: `Call Sheet: ${callSheet.productionName} - ${callSheet.shootDate}`,
                html: emailHtml,
              }),
            });

            if (response.ok) {
              results.email.sent++;
              console.log(`Email sent to ${r.email}`);
            } else {
              results.email.failed++;
            }
          } catch (err) {
            console.error(`Failed to send email to ${r.email}:`, err);
            results.email.failed++;
          }
        }
      }
    }

    // Send SMS via Twilio
    if (method === "sms" || method === "both") {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioSid && twilioAuth && twilioPhone) {
        for (const r of allRecipients) {
          if (!r.phone) continue;

          try {
            const locationName = callSheet.locations?.[0]?.name || "TBD";
            const smsBody = `CALL SHEET: ${callSheet.productionName}\nDate: ${callSheet.shootDate}\nCall: ${callSheet.generalCallTime}\nLocation: ${locationName}`;

            const auth = btoa(`${twilioSid}:${twilioAuth}`);
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
              method: "POST",
              headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: r.phone,
                From: twilioPhone,
                Body: smsBody,
              }),
            });

            if (response.ok) {
              results.sms.sent++;
            } else {
              results.sms.failed++;
            }
          } catch (err) {
            console.error(`Failed to send SMS to ${r.phone}:`, err);
            results.sms.failed++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
