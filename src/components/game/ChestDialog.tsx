import { Sparkles, Coins, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGame, CHEST_PRICE } from "@/game/store";
import { sfx } from "@/game/sounds";
import { toast } from "sonner";
import { generateChestSeeds, type ChestSeed } from "@/lib/ai-chest.functions";
import type { Plant } from "@/game/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const rarityColor: Record<string, string> = {
  rare: "var(--neon-magenta)",
  epic: "var(--neon-lime)",
  legendary: "#facc15",
};

function seedsToPlants(seeds: ChestSeed[]): Plant[] {
  return seeds.map((s) => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    idealTemp: s.idealTemp,
    idealHumidity: s.idealHumidity,
    idealOxygen: s.idealOxygen,
    growthSeconds: s.growthSeconds,
    price: s.price,
    basePoints: s.basePoints,
    baseReward: s.baseReward,
    rarity: s.rarity,
    description: s.description,
    isAi: true,
  }));
}

export function ChestDialog({ open, onOpenChange }: Props) {
  const credits = useGame((s) => s.credits);
  const chests = useGame((s) => s.chests);
  const buyChest = useGame((s) => s.buyChest);
  const openChest = useGame((s) => s.openChest);
  const [loading, setLoading] = useState(false);
  const [lastSeeds, setLastSeeds] = useState<ChestSeed[] | null>(null);

  const handleOpen = async () => {
    if (chests <= 0 || loading) return;
    setLoading(true);
    setLastSeeds(null);
    try {
      const { seeds } = await generateChestSeeds({ data: { tier: "common" } });
      openChest(seedsToPlants(seeds));
      sfx.chest();
      setLastSeeds(seeds);
      toast.success("✨ Сундук открыт!", {
        description: `Получено семян: ${seeds.length}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось открыть сундук";
      toast.error("Ошибка генерации", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (buyChest()) {
      sfx.buy();
      toast.success("Куплен сундук с редкими семенами");
    } else {
      toast.error("Недостаточно кредитов");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[color:var(--neon-magenta)]/30 bg-[color:var(--space-bg)] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Sparkles className="size-6 text-[color:var(--neon-magenta)]" />
            Сундуки с редкими семенами
          </DialogTitle>
          <DialogDescription>
            ИИ придумает уникальные инопланетные растения, которых ещё никто не видел.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-2xl border border-[color:var(--neon-magenta)]/30 bg-[color:var(--neon-magenta)]/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-[color:var(--neon-magenta)]/15 text-2xl">
              🎁
            </div>
            <div>
              <div className="font-display text-base">Сундуков в наличии</div>
              <div className="text-xs text-muted-foreground">
                Дроп с шансом при сборе 3⭐ урожая
              </div>
            </div>
          </div>
          <div className="font-display text-3xl text-[color:var(--neon-magenta)]">×{chests}</div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={handleBuy}
            disabled={credits < CHEST_PRICE}
            className="border-[color:var(--neon-lime)]/40 text-[color:var(--neon-lime)] hover:bg-[color:var(--neon-lime)]/10 hover:text-[color:var(--neon-lime)]"
          >
            <Coins className="mr-1.5 size-4" />
            Купить за {CHEST_PRICE}
          </Button>
          <Button
            onClick={handleOpen}
            disabled={chests <= 0 || loading}
            className="bg-gradient-to-r from-[color:var(--neon-magenta)] to-[color:var(--neon-cyan)] font-display text-[color:var(--space-bg)] hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                ИИ генерирует…
              </>
            ) : (
              <>
                <Package className="mr-1.5 size-4" />
                Открыть сундук
              </>
            )}
          </Button>
        </div>

        {lastSeeds && (
          <div className="mt-2 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Новые семена в инвентаре:
            </div>
            {lastSeeds.map((s) => (
              <div
                key={s.id}
                className="flex gap-3 rounded-xl border p-3"
                style={{
                  borderColor: `color-mix(in oklab, ${rarityColor[s.rarity]} 40%, transparent)`,
                  background: `color-mix(in oklab, ${rarityColor[s.rarity]} 8%, transparent)`,
                }}
              >
                <div className="text-3xl">{s.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm">{s.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                      style={{ color: rarityColor[s.rarity] }}
                    >
                      {s.rarity}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    🌡 {s.idealTemp > 0 ? "+" : ""}
                    {s.idealTemp}°C · 💧 {s.idealHumidity}% · 🫧 {s.idealOxygen}% · ⏱ {s.growthSeconds}с
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
