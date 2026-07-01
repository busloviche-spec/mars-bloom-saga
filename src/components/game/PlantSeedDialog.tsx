import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLANT_BY_ID } from "@/game/plants";
import { useGame } from "@/game/store";
import { sfx } from "@/game/sounds";
import { toast } from "sonner";

type Props = {
  boxId: string | null;
  onClose: () => void;
  onOpenShop: () => void;
};

export function PlantSeedDialog({ boxId, onClose, onOpenShop }: Props) {
  const inventory = useGame((s) => s.inventory);
  const plant = useGame((s) => s.plantSeed);

  const owned = Object.entries(inventory).filter(([, n]) => n > 0);

  return (
    <Dialog open={boxId !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-bg)] text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">🌱 Посадить семя</DialogTitle>
          <DialogDescription>Выбери, что посадить в этот изо-бокс.</DialogDescription>
        </DialogHeader>
        {owned.length === 0 ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">Инвентарь пуст. Загляни в магазин.</p>
            <Button
              onClick={() => {
                onClose();
                onOpenShop();
              }}
              className="bg-[color:var(--neon-cyan)] text-[color:var(--space-bg)] hover:bg-[color:var(--neon-cyan)]/80"
            >
              Открыть магазин
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {owned.map(([id, n]) => {
              const p = PLANT_BY_ID[id];
              if (!p) return null;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (boxId && plant(boxId, id)) {
                      sfx.plant();
                      toast.success(`${p.name} посажен`);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-[color:var(--space-panel)]/60 p-3 text-left transition-all hover:border-[color:var(--neon-cyan)]/50"
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex-1">
                    <div className="font-display text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      🌡 {p.idealTemp > 0 ? "+" : ""}
                      {p.idealTemp}°C · 💧 {p.idealHumidity}% · 🫧 {p.idealOxygen}%
                    </div>
                  </div>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-muted-foreground">
                    ×{n}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
