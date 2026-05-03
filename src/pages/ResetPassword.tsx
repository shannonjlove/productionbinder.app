import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Clapperboard, AlertTriangle } from "lucide-react";
import { AnimatedGradientBackground } from "@/components/AnimatedGradientBackground";

type Status = "validating" | "ready" | "invalid" | "authenticated" | "success";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("validating");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Detect errors in URL hash (e.g. #error=access_denied&error_code=otp_expired)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const errorCode = hashParams.get("error_code") || hashParams.get("error");

    // Try to extract email from access_token JWT in the URL hash
    const accessToken = hashParams.get("access_token");
    let prefill: string | null = null;
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload?.email) prefill = payload.email;
      } catch {}
    }
    if (!prefill) {
      try { prefill = localStorage.getItem("last_reset_email"); } catch {}
    }
    if (prefill) setResendEmail(prefill);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setStatus("ready");
      }
      if (session?.user?.email && !resendEmail) {
        setResendEmail(session.user.email);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setResendEmail((prev) => prev || session.user.email!);
      if (errorCode) {
        setStatus("invalid");
        return;
      }
      if (session) {
        // If session exists without recovery event shortly after, treat as logged-in user
        setTimeout(() => {
          setStatus((prev) => {
            if (prev === "validating") {
              if (isRecovery) return "ready";
              return "authenticated";
            }
            return prev;
          });
        }, 800);
      } else {
        setTimeout(() => {
          setStatus((prev) => (prev === "validating" ? "invalid" : prev));
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      await supabase.auth.signOut();
      setStatus("success");
      setTimeout(() => navigate("/auth"), 3000);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Please enter your email");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Reset link sent. Check your inbox.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedGradientBackground />
      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl border-slate-200 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            {status === "invalid" ? (
              <AlertTriangle className="w-8 h-8 text-white" />
            ) : (
              <Clapperboard className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {status === "invalid"
                ? "Reset link invalid or expired"
                : status === "authenticated"
                ? "You're already signed in"
                : "Set a new password"}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {status === "validating" && "Validating reset link..."}
              {status === "ready" && "Enter and confirm your new password"}
              {status === "invalid" && "Request a new reset link below"}
              {status === "authenticated" && "Return to your dashboard"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-700">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

          {status === "invalid" && (
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email" className="text-slate-700">Email</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <Button
                type="submit"
                disabled={resending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25"
              >
                {resending ? "Sending..." : "Resend reset email"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="w-full text-slate-700"
              >
                Back to sign in
              </Button>
            </form>
          )}

          {status === "authenticated" && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25"
              >
                Go to dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setStatus("invalid");
                }}
                className="w-full text-slate-700"
              >
                Sign out and reset password
              </Button>
            </div>
          )}

          {status === "validating" && (
            <div className="text-center text-sm text-slate-500 py-4">Please wait…</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
