import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!email) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        data-tour="auth"
        className="border-[color:var(--mars-amber)]/40 text-[color:var(--mars-amber)] hover:bg-[color:var(--mars-amber)]/10 hover:text-[color:var(--mars-amber)]"
      >
        <Link to="/auth">
          <LogIn className="mr-1.5 size-4" />
          Войти
        </Link>
      </Button>
    );
  }

  const short = email.split("@")[0];
  return (
    <div className="flex items-center gap-1" data-tour="auth">
      <span
        title={email}
        className="max-w-[100px] truncate rounded-full border border-[color:var(--mars-copper)]/40 bg-[color:var(--mars-copper)]/10 px-2.5 py-1 text-xs text-[color:var(--mars-cream)]"
      >
        {short}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await supabase.auth.signOut();
          toast.success("Вы вышли из аккаунта");
        }}
        className="text-muted-foreground hover:text-foreground"
        title="Выйти"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
