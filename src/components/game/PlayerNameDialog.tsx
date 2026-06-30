import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from "@/game/store";

export function PlayerNameDialog() {
  const playerName = useGame((s) => s.playerName);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const [value, setValue] = useState("");

  return (
    <Dialog open={!playerName}>
      <DialogContent className="max-w-sm border-[color:var(--neon-cyan)]/30 bg-[color:var(--space-bg)] text-foreground" hideClose>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">👨‍🚀 Добро пожаловать на Марс</DialogTitle>
          <DialogDescription>
            Как тебя записать в журнал теплицы?
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPlayerName(value || "Агроном");
          }}
          className="space-y-3"
        >
          <Input
            autoFocus
            placeholder="Имя космо-агронома"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={24}
            className="border-[color:var(--neon-cyan)]/30 bg-[color:var(--space-panel)]"
          />
          <Button
            type="submit"
            className="w-full bg-[color:var(--neon-cyan)] text-[color:var(--space-bg)] hover:bg-[color:var(--neon-cyan)]/80"
          >
            Начать миссию
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
