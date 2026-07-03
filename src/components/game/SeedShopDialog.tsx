import { Coins, Clock, Zap, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLANTS } from "@/game/plants";
import {
  useGame,
  MAX_PLANT_LEVEL,
  plantUpgradeCost,
  plantSpeedMult,
  plantRewardMult,
} from "@/game/store";
import { sfx } from "@/game/sounds";
import { toast } from "sonner";
import type { Plant } from "@/game/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const rarityColor: Record<string, string> = {
  common: "var(--neon-cyan)",
  rare: "var(--neon-magenta)",
  epic: "var(--neon-lime)",
  legendary: "#facc15",
};

function PlantRow({
  p,
  owned,
  level,
  credits,
  onBuy,
  onUpgrade,
  aiOnly,
  locked,
  starsEarned,
}: {
  p: Plant;
  owned: number;
  level: number;
  credits: number;
  onBuy?: () => void;
  onUpgrade: () => void;
  aiOnly?: boolean;
  locked?: boolean;
  starsEarned?: number;
}) {
  const canBuy = !aiOnly && !locked && credits >= p.price;
  const canUpgrade = !locked && level < MAX_PLANT_LEVEL;
  const upCost = plantUpgradeCost(level);
  const canAffordUpgrade = credits >= upCost && canUpgrade;
  const color = rarityColor[p.rarity] ?? "var(--neon-cyan)";
  const need = p.unlockStars ?? 0;
  const have = starsEarned ?? 0;
  const lockPct = need > 0 ? Math.min(100, (have / need) * 100) : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-3 transition-opacity",
        locked && "opacity-70",
      )}
      style={{ borderColor: `color-mix(in oklab, ${color} 30%, transparent)` }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-xl text-3xl",
            locked && "grayscale",
          )}
          style={{ background: `color-mix(in oklab, ${color} 12%, transparent)` }}
        >
          {locked ? "🔒" : p.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-display text-sm text-foreground">{p.name}</h3>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{
                background: `color-mix(in oklab, ${color} 18%, transparent)`,
                color,
              }}
            >
              {p.rarity}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-foreground/70">
            🌡 {p.idealTemp > 0 ? "+" : ""}
            {p.idealTemp}°C · 💧 {p.idealHumidity}% · 🫧 {p.idealOxygen}%
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
            {!aiOnly && !locked && (
              <span className="flex items-center gap-1 text-[color:var(--neon-lime)]">
                <Coins className="size-3" />
                {p.price}
              </span>
            )}
            <span className="flex items-center gap-1 text-foreground/60">
              <Clock className="size-3" />
              {p.growthSeconds}с
            </span>
            {owned > 0 && !locked && (
              <span className="text-[color:var(--neon-cyan)]">×{owned}</span>
            )}
          </div>
        </div>
      </div>

      {locked ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-yellow-400/30 bg-yellow-400/5 px-2.5 py-2">
          <div className="flex items-center justify-between text-xs text-yellow-300">
            <span className="flex items-center gap-1.5 font-display">
              <Lock className="size-3.5" /> Заблокировано
            </span>
            <span>
              ⭐ {have}/{need}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-yellow-400/80"
              style={{ width: `${lockPct}%` }}
            />
          </div>
          <p className="text-[11px] text-foreground/70">
            Заработай ещё ⭐ {Math.max(0, need - have)}, чтобы открыть этот сорт.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-white/5 bg-[color:var(--space-panel-deep)]/40 px-2 py-1.5 text-[11px]">
            <span className="font-display text-[color:var(--neon-lime)]">ур.{level}</span>
            <span className="ml-2 text-foreground/70">
              ×{plantSpeedMult(level).toFixed(2)} скор · ×{plantRewardMult(level).toFixed(2)} 💰
            </span>
          </div>
          {onBuy && (
            <Button
              size="sm"
              disabled={!canBuy}
              onClick={onBuy}
              className="bg-[color:var(--neon-cyan)] text-[color:var(--space-bg)] hover:bg-[color:var(--neon-cyan)]/80"
            >
              Купить
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!canAffordUpgrade}
            onClick={onUpgrade}
            className="border-[color:var(--neon-magenta)]/40 text-[color:var(--neon-magenta)] hover:bg-[color:var(--neon-magenta)]/10 hover:text-[color:var(--neon-magenta)]"
          >
            <Zap className="mr-1 size-3" />
            {canUpgrade ? upCost : "MAX"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function SeedShopDialog({ open, onOpenChange }: Props) {
  const credits = useGame((s) => s.credits);
  const inventory = useGame((s) => s.inventory);
  const customPlants = useGame((s) => s.customPlants);
  const plantLevels = useGame((s) => s.plantLevels);
  const starsEarned = useGame((s) => s.starsEarned);
  const buy = useGame((s) => s.buySeed);
  const upgradePlant = useGame((s) => s.upgradePlant);

  const aiList = Object.values(customPlants);

  const sortedPlants = [...PLANTS].sort((a, b) => {
    const na = a.unlockStars ?? 0;
    const nb = b.unlockStars ?? 0;
    const la = starsEarned < na ? 1 : 0;
    const lb = starsEarned < nb ? 1 : 0;
    if (la !== lb) return la - lb;
    return na - nb;
  });

  const handleBuy = (p: Plant) => {
    if (buy(p.id)) {
      sfx.buy();
      toast.success(`Куплено: ${p.name}`);
    }
  };
  const handleUpgrade = (p: Plant, level: number) => {
    if (upgradePlant(p.id)) {
      sfx.upgrade();
      toast.success(`${p.name} прокачан`, {
        description: `Уровень ${level + 1} · быстрее растёт и приносит больше монет`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-bg)] text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">🛒 Магазин семян</DialogTitle>
          <DialogDescription>
            Покупай семена, прокачивай сорта — рост быстрее и монет больше. Новые сорта открываются за ⭐ звёзды урожая.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedPlants.map((p) => {
            const need = p.unlockStars ?? 0;
            const locked = starsEarned < need;
            return (
              <PlantRow
                key={p.id}
                p={p}
                owned={inventory[p.id] ?? 0}
                level={plantLevels[p.id] ?? 1}
                credits={credits}
                starsEarned={starsEarned}
                locked={locked}
                onBuy={locked ? undefined : () => handleBuy(p)}
                onUpgrade={() => handleUpgrade(p, plantLevels[p.id] ?? 1)}
              />
            );
          })}
        </div>

        {aiList.length > 0 && (
          <>
            <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[color:var(--neon-magenta)]">
              ✨ Из сундуков (ИИ)
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {aiList.map((p) => (
                <PlantRow
                  key={p.id}
                  p={p}
                  owned={inventory[p.id] ?? 0}
                  level={plantLevels[p.id] ?? 1}
                  credits={credits}
                  aiOnly
                  onUpgrade={() => handleUpgrade(p, plantLevels[p.id] ?? 1)}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
