import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход · Марсианская теплица" },
      {
        name: "description",
        content:
          "Войди или зарегистрируйся, чтобы отправлять свои рекорды в глобальный рейтинг Марсианской теплицы.",
      },
      { property: "og:title", content: "Вход · Марсианская теплица" },
      {
        property: "og:description",
        content: "Регистрация и вход в игру Марсианская теплица.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/leaderboard" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/leaderboard`,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Аккаунт создан", {
          description: "Проверь почту для подтверждения (если требуется).",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("С возвращением, агроном!");
      }
      navigate({ to: "/leaderboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) throw res.error;
      navigate({ to: "/leaderboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка Google-входа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[color:var(--space-bg)] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="stars absolute inset-0" />
      </div>
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
        <div className="text-center">
          <h1 className="font-display text-3xl">🚀 Марсианская теплица</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Войди, чтобы попасть в глобальный рейтинг.
          </p>
        </div>

        <div className="rounded-2xl border border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-panel)]/70 p-5 backdrop-blur">
          <div className="mb-4 flex gap-2">
            <Button
              variant={mode === "sign-in" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("sign-in")}
              type="button"
            >
              Вход
            </Button>
            <Button
              variant={mode === "sign-up" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("sign-up")}
              type="button"
            >
              Регистрация
            </Button>
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "sign-up" && (
              <div>
                <Label htmlFor="username">Ник агронома</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Марсианский пионер"
                  maxLength={40}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "..." : mode === "sign-up" ? "Создать аккаунт" : "Войти"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" /> или <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
            type="button"
          >
            Войти через Google
          </Button>
        </div>

        <div className="text-center text-xs">
          <Link to="/" className="text-[color:var(--neon-cyan)] hover:underline">
            ← Назад в теплицу
          </Link>
        </div>
      </main>
    </div>
  );
}
