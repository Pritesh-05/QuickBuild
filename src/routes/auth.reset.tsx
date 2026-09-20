import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/reset")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    // Supabase's reset link lands here with a recovery token in the URL
    // hash; the browser client picks it up automatically and fires this
    // event once it has turned it into a (temporary) session.
    const supabase = getSupabaseBrowserClient();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If the session was already established before this listener attached.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in");
      await router.invalidate();
      void navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm flex-col justify-center px-5 py-16">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <KeyRound className="size-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-[-0.03em]">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          {ready ? "Choose a new password for your account." : "Verifying your reset link…"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          required
          minLength={6}
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!ready}
          className="rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!ready || loading}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}
