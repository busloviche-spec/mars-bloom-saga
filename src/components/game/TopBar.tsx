import { Trophy, Coins, Star, RotateCcw, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { AuthButton } from "./AuthButton";

type Props = {
  onOpenLeaderboard: () => void;
  onOpenChests: () => void;
  onOpenHelp: () => void;
};

export function TopBar({ onOpenLeaderboard, onOpenChests, onOpenHelp }: Props) {
  const playerName = useGame((s) => s.playerName);
  const credits = useGame((s) => s.credits);
  const totalScore = useGame((s) => s.totalScore);
  const starsEarned = useGame((s) => s.starsEarned);
  const chests = useGame((s) => s.chests);
  const saveScore = useGame((s) => s.saveScoreToLeaderboard);
  const reset = useGame((s) => s.resetRun);

  return (
    <header
      data-tour="topbar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--mars-copper)]/25 bg-[color:var(--mars-panel)]/80 px-4 py-3 backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚀</span>
        <div>
          <h1 className="font-display text-lg leading-tight tracking-tight text-[color:var(--mars-cream)]">
            Марсианская теплица
          </h1>
          <p className="text-xs text-[color:var(--mars-amber)]/85">Агроном: {playerName ?? "—"}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div
          title="Кредиты — валюта для покупки семян, апгрейдов и сундуков"
          className="flex items-center gap-1.5 rounded-full border border-[color:var(--mars-copper)]/40 bg-[color:var(--mars-copper)]/15 px-3 py-1.5 text-sm font-semibold text-[color:var(--mars-amber)]"
        >
          <Coins className="size-4" />
          {credits}
        </div>
        <div
          title="Очки за собранный урожай — определяют место в лидерборде"
          className="flex items-center gap-1.5 rounded-full border border-[color:var(--mars-rust)]/40 bg-[color:var(--mars-rust)]/15 px-3 py-1.5 text-sm font-semibold text-[color:var(--mars-cream)]"
        >
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
          data-tour="chests"
          className="border-[color:var(--mars-rust)]/50 text-[color:var(--mars-cream)] hover:bg-[color:var(--mars-rust)]/15 hover:text-[color:var(--mars-cream)]"
        >
          <Sparkles className="mr-1.5 size-4" />
          Сундуки
          {chests > 0 && (
            <span className="ml-1.5 rounded-full bg-[color:var(--mars-rust)]/40 px-1.5 text-xs">
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
          className="border-[color:var(--mars-amber)]/40 text-[color:var(--mars-amber)] hover:bg-[color:var(--mars-amber)]/10 hover:text-[color:var(--mars-amber)]"
        >
          <Trophy className="mr-1.5 size-4" />
          Рекорды
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenHelp}
          data-tour="help"
          title="Правила игры и обучение"
          className="border-[color:var(--mars-copper)]/40 text-[color:var(--mars-copper)] hover:bg-[color:var(--mars-copper)]/10 hover:text-[color:var(--mars-copper)]"
        >
          <HelpCircle className="size-4" />
        </Button>
        <AuthButton />
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
          title="Начать заново"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </header>
  );
}
