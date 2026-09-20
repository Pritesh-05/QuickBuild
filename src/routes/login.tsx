import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Cpu, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "signin" | "signup" | "reset";

// Flip to true to bring the "Continue with Google" button back — nothing
// else needs to change. Google OAuth still has to be configured in
// Supabase for it to actually work once re-enabled.
const SHOW_GOOGLE_LOGIN = false;

function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"password" | "google" | "reset" | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();

    if (mode === "reset") {
      setLoading("reset");
      const supabase = getSupabaseBrowserClient();
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) throw error;
        setResetSent(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(null);
      }
      return;
    }

    setLoading("password");
    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then log in.");
      }
      await router.invalidate();
      void navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading("google");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
    // On success, Supabase redirects the browser to Google — no further code runs here.
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm flex-col justify-center px-5 py-16">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Cpu className="size-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-[-0.03em]">
          {mode === "signin" && "Log in to QuickBuild"}
          {mode === "signup" && "Create your account"}
          {mode === "reset" && "Reset your password"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "reset"
            ? "Enter your email and we'll send you a reset link."
            : "Save builds and pick up where you left off, on any device."}
        </p>
      </div>

      {SHOW_GOOGLE_LOGIN && mode !== "reset" && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading !== null}
            className="mb-4 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {loading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon className="size-4" />
            )}
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {mode === "reset" && resetSent ? (
        <p className="rounded-md border border-border bg-accent/40 px-4 py-3 text-sm text-foreground">
          If an account exists for <span className="font-medium">{email}</span>, a reset link is on
          its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {mode !== "reset" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="self-end text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </button>
          )}
          <button
            type="submit"
            disabled={loading !== null}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {(loading === "password" || loading === "reset") && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {mode === "signin" && "Log In"}
            {mode === "signup" && "Sign Up"}
            {mode === "reset" && "Send reset link"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => {
          setResetSent(false);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
        className="mt-5 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {mode === "reset" && "Back to log in"}
        {mode === "signin" && "Don't have an account? Sign up"}
        {mode === "signup" && "Already have an account? Log in"}
      </button>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.54-5.17 3.54-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.07.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.31v3.09C3.28 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.66H1.31A11.96 11.96 0 000 12.03c0 1.93.46 3.76 1.31 5.37l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.28 2.7 1.31 6.66l4 3.09c.94-2.83 3.58-4.93 6.69-5z"
      />
    </svg>
  );
}