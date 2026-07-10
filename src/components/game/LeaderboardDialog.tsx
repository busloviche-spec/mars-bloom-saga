import { useEffect, useState } from "react";
import { Trophy, Cloud, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { useServerFn } from "@tanstack/react-start";
import { getGlobalLeaderboard, submitScore, type OnlineScore } from "@/lib/leaderboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function LeaderboardDialog({ open, onOpenChange }: Props) {
  const leaderboard = useGame((s) => s.leaderboard);
  const playerName = useGame((s) => s.playerName);
  const totalScore = useGame((s) => s.totalScore);
  const credits = useGame((s) => s.credits);
  const starsEarned = useGame((s) => s.starsEarned);

  const fetchTop = useServerFn(getGlobalLeaderboard);
  const sendScore = useServerFn(submitScore);

  const [online, setOnline] = useState<OnlineScore[] | null>(null);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user?.email ?? null));
    setLoadingOnline(true);
    fetchTop()
      .then((rows) => setOnline(rows))
      .catch(() => setOnline([]))
      .finally(() => setLoadingOnline(false));
  }, [open, fetchTop]);

  const handleSubmit = async () => {
    if (!sessionEmail) return;
    setSubmitting(true);
    try {
      const res = await sendScore({
        data: {
          points: totalScore,
          credits,
          starsEarned,
          username: playerName ?? sessionEmail.split("@")[0],
        },
      });
      if (res.replaced) {
        toast.success("🏆 Рекорд отправлен!", { description: `Новый лучший: ${res.best}` });
      } else {
        toast.info("Твой сохранённый рекорд выше", { description: `Лучший: ${res.best}` });
      }
      const rows = await fetchTop();
      setOnline(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Не удалось отправить рекорд", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[color:var(--mars-copper)]/30 bg-[color:var(--mars-panel)] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl text-[color:var(--mars-amber)]">
            <Trophy className="size-5" />
            Лучшие агрономы Галактики
          </DialogTitle>
          <DialogDescription>
            Локальные рекорды с этого устройства и общий онлайн-лидерборд.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="online">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="online">
              <Cloud className="mr-1.5 size-4" /> Онлайн
            </TabsTrigger>
            <TabsTrigger value="local">Локальный</TabsTrigger>
          </TabsList>

          <TabsContent value="online" className="space-y-3">
            {sessionEmail ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || totalScore <= 0}
                className="w-full bg-[color:var(--mars-rust)] hover:bg-[color:var(--mars-rust)]/85"
              >
                {submitting ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Отправка…</>
                ) : (
                  <><Send className="mr-2 size-4" /> Отправить мой рекорд ({totalScore})</>
                )}
              </Button>
            ) : (
              <div className="rounded-xl border border-[color:var(--mars-amber)]/30 bg-[color:var(--mars-amber)]/10 p-3 text-center text-sm">
                <p className="mb-2 text-[color:var(--mars-cream)]">
                  Войди, чтобы отправить свой рекорд в общий лидерборд.
                </p>
                <Button asChild size="sm" className="bg-[color:var(--mars-rust)] hover:bg-[color:var(--mars-rust)]/85">
                  <Link to="/auth" onClick={() => onOpenChange(false)}>Войти / Зарегистрироваться</Link>
                </Button>
              </div>
            )}

            {loadingOnline ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                Загружаем рекорды…
              </p>
            ) : !online || online.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Онлайн-таблица пока пустая. Стань первым!
              </p>
            ) : (
              <ol className="max-h-[45vh] space-y-1.5 overflow-y-auto pr-1">
                {online.map((e, i) => (
                  <Row key={`${e.username}-${i}`} rank={i} name={e.username} score={e.points} stars={e.stars_earned} />
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="local">
            {leaderboard.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Пока пусто. Собери первый урожай!
              </p>
            ) : (
              <ol className="space-y-1.5">
                {leaderboard.map((e, i) => (
                  <Row key={`${e.name}-${e.date}-${i}`} rank={i} name={e.name} score={e.score} />
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Row({ rank, name, score, stars }: { rank: number; name: string; score: number; stars?: number }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-white/5 bg-[color:var(--mars-panel-deep)]/60 px-3 py-2 text-sm">
      <span className="flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-full font-display text-xs"
          style={{
            background:
              rank === 0
                ? "color-mix(in oklab, var(--mars-amber) 35%, transparent)"
                : rank === 1
                  ? "color-mix(in oklab, var(--mars-copper) 30%, transparent)"
                  : rank === 2
                    ? "color-mix(in oklab, var(--mars-rust) 30%, transparent)"
                    : "rgba(255,255,255,0.05)",
          }}
        >
          {rank + 1}
        </span>
        <span className="font-medium text-[color:var(--mars-cream)]">{name}</span>
      </span>
      <span className="flex items-center gap-2 font-display tabular-nums text-[color:var(--mars-amber)]">
        {stars !== undefined && stars > 0 && <span className="text-xs text-yellow-300">⭐{stars}</span>}
        {score}
      </span>
    </li>
  );
}
