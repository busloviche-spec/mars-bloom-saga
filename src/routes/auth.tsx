import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход · Марсианская теплица" },
      {
        name: "description",
        content:
          "Войди, чтобы отправить свой рекорд в глобальный лидерборд игры «Марсианская теплица».",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Не удалось войти", { description: error.message });
      return;
    }
    toast.success("С возвращением, агроном!");
    navigate({ to: "/", replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username: username.trim() || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Не удалось зарегистрироваться", { description: error.message });
      return;
    }
    toast.success("Аккаунт создан!", {
      description: "Можешь сразу играть — сессия активна.",
    });
    navigate({ to: "/", replace: true });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Ошибка входа через Google", {
        description: result.error.message,
      });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="relative min-h-screen bg-[color:var(--mars-bg)] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-40 stars" aria-hidden />
      <div className="relative mx-auto flex max-w-md flex-col gap-4 p-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[color:var(--mars-amber)] hover:underline">
          <ArrowLeft className="size-4" />
          К теплице
        </Link>
        <div className="rounded-2xl border border-[color:var(--mars-copper)]/30 bg-[color:var(--mars-panel)]/80 p-5 backdrop-blur">
          <h1 className="mb-1 font-display text-2xl text-[color:var(--mars-cream)]">
            🚀 Вход в колонию
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Войди, чтобы отправить рекорд в галактический лидерборд.
          </p>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 pt-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Пароль</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[color:var(--mars-rust)] hover:bg-[color:var(--mars-rust)]/85">
                  {loading ? "Вход…" : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 pt-3">
                <div>
                  <Label htmlFor="username">Ник агронома</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ares" />
                </div>
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password2">Пароль</Label>
                  <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[color:var(--mars-rust)] hover:bg-[color:var(--mars-rust)]/85">
                  {loading ? "Создаём…" : "Создать аккаунт"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" />
            или
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            className="w-full border-[color:var(--mars-amber)]/40 text-[color:var(--mars-cream)] hover:bg-[color:var(--mars-amber)]/10"
          >
            Войти через Google
          </Button>
        </div>
      </div>
    </div>
  );
}
