import { Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGame } from "@/game/store";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function LeaderboardDialog({ open, onOpenChange }: Props) {
  const leaderboard = useGame((s) => s.leaderboard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-bg)] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Trophy className="size-5 text-[color:var(--neon-lime)]" />
            Лучшие агрономы Галактики
          </DialogTitle>
          <DialogDescription>
            Топ-10 рекордов на этом устройстве. Очки сохраняются при перезапуске.
          </DialogDescription>
        </DialogHeader>
        {leaderboard.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Пока пусто. Собери первый урожай!
          </p>
        ) : (
          <ol className="space-y-1.5">
            {leaderboard.map((e, i) => (
              <li
                key={`${e.name}-${e.date}-${i}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[color:var(--space-panel)]/60 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="grid size-7 place-items-center rounded-full font-display text-xs"
                    style={{
                      background:
                        i === 0
                          ? "color-mix(in oklab, var(--neon-lime) 25%, transparent)"
                          : i === 1
                            ? "color-mix(in oklab, var(--neon-cyan) 20%, transparent)"
                            : i === 2
                              ? "color-mix(in oklab, var(--neon-magenta) 20%, transparent)"
                              : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium">{e.name}</span>
                </span>
                <span className="font-display tabular-nums text-[color:var(--neon-lime)]">
                  {e.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
