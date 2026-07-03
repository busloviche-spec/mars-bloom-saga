import { Trophy, Coins, Star, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";

type Props = {
  onOpenLeaderboard: () => void;
  onOpenChests: () => void;
};

export function TopBar({ onOpenLeaderboard, onOpenChests }: Props) {
  const playerName = useGame((s) => s.playerName);
  const credits = useGame((s) => s.credits);
  const totalScore = useGame((s) => s.totalScore);
  const starsEarned = useGame((s) => s.starsEarned);
  const chests = useGame((s) => s.chests);
  const saveScore = useGame((s) => s.saveScoreToLeaderboard);
  const reset = useGame((s) => s.resetRun);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-panel)]/70 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚀</span>
        <div>
          <h1 className="font-display text-lg leading-tight tracking-tight text-foreground">
            Марсианская теплица
          </h1>
          <p className="text-xs text-[color:var(--neon-cyan)]/80">Агроном: {playerName ?? "—"}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--neon-lime)]/30 bg-[color:var(--neon-lime)]/10 px-3 py-1.5 text-sm font-semibold text-[color:var(--neon-lime)]">
          <Coins className="size-4" />
          {credits}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--neon-magenta)]/30 bg-[color:var(--neon-magenta)]/10 px-3 py-1.5 text-sm font-semibold text-[color:var(--neon-magenta)]">
          <Star className="size-4" />
          {totalScore}
        </div>
        <div
          title="Заработанные звёзды урожая — открывают новые сорта в магазине"
          className="flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5 text-sm font-semibold text-yellow-300"
        >
          ⭐ {starsEarned}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenChests}
          className="border-[color:var(--neon-magenta)]/40 text-[color:var(--neon-magenta)] hover:bg-[color:var(--neon-magenta)]/10 hover:text-[color:var(--neon-magenta)]"
        >
          <Sparkles className="mr-1.5 size-4" />
          Сундуки
          {chests > 0 && (
            <span className="ml-1.5 rounded-full bg-[color:var(--neon-magenta)]/20 px-1.5 text-xs">
              {chests}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            saveScore();
            onOpenLeaderboard();
          }}
          className="border-[color:var(--neon-cyan)]/40 text-[color:var(--neon-cyan)] hover:bg-[color:var(--neon-cyan)]/10 hover:text-[color:var(--neon-cyan)]"
        >
          <Trophy className="mr-1.5 size-4" />
          Рекорды
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Сохранить очки в таблицу рекордов и начать заново?")) {
              saveScore();
              reset();
            }
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </header>
  );
}
