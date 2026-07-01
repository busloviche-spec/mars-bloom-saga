import { Coins, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLANTS } from "@/game/plants";
import { useGame } from "@/game/store";
import { sfx } from "@/game/sounds";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const rarityColor: Record<string, string> = {
  common: "var(--neon-cyan)",
  rare: "var(--neon-magenta)",
  epic: "var(--neon-lime)",
};

export function SeedShopDialog({ open, onOpenChange }: Props) {
  const credits = useGame((s) => s.credits);
  const inventory = useGame((s) => s.inventory);
  const buy = useGame((s) => s.buySeed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-bg)] text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">🛒 Магазин семян</DialogTitle>
          <DialogDescription>
            Купи семена и посади их на свободные грядки. Идеальные параметры — справа.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANTS.map((p) => {
            const owned = inventory[p.id] ?? 0;
            const canBuy = credits >= p.price;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border p-3"
                style={{ borderColor: `color-mix(in oklab, ${rarityColor[p.rarity]} 30%, transparent)` }}
              >
                <div
                  className="grid size-14 shrink-0 place-items-center rounded-xl text-3xl"
                  style={{
                    background: `color-mix(in oklab, ${rarityColor[p.rarity]} 12%, transparent)`,
                  }}
                >
                  {p.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-display text-sm">{p.name}</h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                      style={{
                        background: `color-mix(in oklab, ${rarityColor[p.rarity]} 18%, transparent)`,
                        color: rarityColor[p.rarity],
                      }}
                    >
                      {p.rarity}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    🌡 {p.idealTemp > 0 ? "+" : ""}
                    {p.idealTemp}°C · 💧 {p.idealHumidity}% · 🫧 {p.idealOxygen}%
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[color:var(--neon-lime)]">
                      <Coins className="size-3" />
                      {p.price}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      {p.growthSeconds}с
                    </span>
                    {owned > 0 && (
                      <span className="text-[color:var(--neon-cyan)]">в инвентаре: {owned}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!canBuy}
                  onClick={() => {
                    if (buy(p.id)) {
                      sfx.buy();
                      toast.success(`Куплено: ${p.name}`);
                    }
                  }}
                  className="bg-[color:var(--neon-cyan)] text-[color:var(--space-bg)] hover:bg-[color:var(--neon-cyan)]/80"
                >
                  Купить
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
