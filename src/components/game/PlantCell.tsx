import { Plus, Zap } from "lucide-react";
import type { GreenhouseBox } from "@/game/types";
import { plantHappiness, stageEmoji } from "@/game/plants";
import { EVENT_BY_ID } from "@/game/events";
import {
  useGame,
  resolvePlant,
  boxUpgradeCost,
  MAX_BOX_LEVEL,
  boxSpeedMult,
  boxRewardMult,
} from "@/game/store";
import { sfx } from "@/game/sounds";
import { toast } from "sonner";
import { BoxClimateControls } from "./ClimateControls";
import { cn } from "@/lib/utils";

type Props = {
  box: GreenhouseBox;
  index: number;
  onPlant: (boxId: string) => void;
};

function moodColor(h: number) {
  if (h >= 0.85) return "var(--neon-lime)";
  if (h >= 0.65) return "#facc15";
  if (h >= 0.45) return "#fb923c";
  return "#ef4444";
}
function moodEmoji(h: number) {
  if (h >= 0.85) return "😄";
  if (h >= 0.65) return "🙂";
  if (h >= 0.45) return "😕";
  return "😣";
}

export function GreenhouseBoxCard({ box, index, onPlant }: Props) {
  const harvest = useGame((s) => s.harvest);
  const upgradeBox = useGame((s) => s.upgradeBox);
  const squashPest = useGame((s) => s.squashPest);
  const credits = useGame((s) => s.credits);
  const customPlants = useGame((s) => s.customPlants);
  const activeEvent = useGame((s) => s.activeEvent);
  const pest = useGame((s) => s.pest);
  const ev = activeEvent ? EVENT_BY_ID[activeEvent.eventId] : null;
  const hasPest = pest?.boxId === box.id;

  const effective = ev
    ? {
        temp: Math.max(-50, Math.min(50, box.climate.temp + ev.tempDelta)),
        humidity: Math.max(0, Math.min(100, box.climate.humidity + ev.humidityDelta)),
        oxygen: Math.max(0, Math.min(100, box.climate.oxygen + ev.oxygenDelta)),
      }
    : box.climate;

  const cell = box.cell;
  const plant = cell.plantId ? resolvePlant({ customPlants }, cell.plantId) : null;
  const happiness = plant ? plantHappiness(plant, effective) : 1;

  const boxLevel = box.level ?? 1;
  const canUpgradeBox = boxLevel < MAX_BOX_LEVEL;
  const boxCost = boxUpgradeCost(boxLevel);
  const canAffordBoxUpgrade = credits >= boxCost && canUpgradeBox;

  const handleBoxUpgrade = () => {
    if (upgradeBox(box.id)) {
      sfx.upgrade();
      toast.success(`Изо-бокс #${index + 1} прокачан`, {
        description: `Уровень ${boxLevel + 1} · +скорость, +награда`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-panel)]/60 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-[color:var(--neon-cyan)]/15 font-display text-xs text-[color:var(--neon-cyan)]">
            {index + 1}
          </span>
          <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Изо-бокс
          </span>
          <span
            className="rounded-full border border-[color:var(--neon-lime)]/40 bg-[color:var(--neon-lime)]/10 px-1.5 py-0.5 font-display text-[10px] text-[color:var(--neon-lime)]"
            title={`Скорость ×${boxSpeedMult(boxLevel).toFixed(2)} · Награда ×${boxRewardMult(boxLevel).toFixed(2)}`}
          >
            ур.{boxLevel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {plant && (
            <span
              className="grid size-6 place-items-center rounded-full border border-white/10 bg-[color:var(--space-bg)] text-xs"
              style={{ boxShadow: `0 0 8px ${moodColor(happiness)}` }}
              title="Настроение растения"
            >
              {moodEmoji(happiness)}
            </span>
          )}
          <button
            onClick={handleBoxUpgrade}
            disabled={!canAffordBoxUpgrade}
            title={
              canUpgradeBox
                ? `Апгрейд бокса за ${boxCost}💰`
                : "Максимальный уровень"
            }
            className={cn(
              "flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-display transition-all",
              canAffordBoxUpgrade
                ? "border-[color:var(--neon-magenta)]/40 text-[color:var(--neon-magenta)] hover:bg-[color:var(--neon-magenta)]/10"
                : "cursor-not-allowed border-white/10 text-muted-foreground opacity-60",
            )}
          >
            <Zap className="size-3" />
            {canUpgradeBox ? boxCost : "MAX"}
          </button>
        </div>
      </div>

      {!cell.plantId ? (
        <button
          onClick={() => onPlant(box.id)}
          className="group flex aspect-[2/1] items-center justify-center rounded-xl border-2 border-dashed border-[color:var(--neon-cyan)]/25 bg-[color:var(--space-panel-deep)]/40 text-[color:var(--neon-cyan)]/60 transition-all hover:border-[color:var(--neon-cyan)]/60 hover:bg-[color:var(--neon-cyan)]/5 hover:text-[color:var(--neon-cyan)]"
        >
          <Plus className="size-7 transition-transform group-hover:scale-110" />
          <span className="ml-2 font-display text-sm">Посадить</span>
        </button>
      ) : (
        <button
          onClick={() => {
            if (cell.isReady) {
              sfx.harvest();
              harvest(box.id);
            }
          }}
          title={plant ? `${plant.name}\n🌡 ${plant.idealTemp}°C  💧 ${plant.idealHumidity}%  🫧 ${plant.idealOxygen}%` : ""}
          className={cn(
            "relative flex aspect-[2/1] flex-col items-center justify-center rounded-xl border bg-gradient-to-br from-[color:var(--space-panel)] to-[color:var(--space-panel-deep)] p-2 text-center transition-all",
            cell.isReady
              ? "cursor-pointer border-[color:var(--neon-lime)]/70 shadow-[0_0_24px_-4px_var(--neon-lime)]"
              : "cursor-default border-[color:var(--neon-cyan)]/15",
          )}
        >
          <span
            className={cn("text-4xl transition-transform duration-500", cell.isReady && "animate-bounce")}
            style={{ transform: `scale(${0.7 + cell.progress * 0.6})` }}
          >
            {plant ? stageEmoji(plant, cell.progress) : "🌰"}
          </span>
          <span className="mt-1 line-clamp-1 text-[11px] font-medium text-muted-foreground">
            {plant?.name}
          </span>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${cell.progress * 100}%`,
                background: "linear-gradient(90deg, var(--neon-cyan), var(--neon-lime))",
              }}
            />
          </div>
        </button>
      )}

      <BoxClimateControls boxId={box.id} climate={box.climate} />
    </div>
  );
}
