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

export function GreenhouseBox2D({ box, index, onPlant }: Props) {
  const harvest = useGame((s) => s.harvest);
  const upgradeBox = useGame((s) => s.upgradeBox);
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

  const handleBoxClick = () => {
    if (!cell.plantId) {
      onPlant(box.id);
    } else if (cell.isReady) {
      sfx.harvest();
      harvest(box.id);
    }
  };

  return (
    <div
      data-box-id={box.id}
      className="mars-box relative flex w-[168px] shrink-0 flex-col gap-1.5 sm:w-[184px]"
    >
      {/* Крышка / рамка */}
      <div className="flex items-center justify-between gap-1 rounded-t-md border border-b-0 border-[color:var(--neon-cyan)]/40 bg-gradient-to-b from-[color:var(--neon-cyan)]/20 to-[color:var(--space-panel)]/60 px-2 py-1">
        <div className="flex items-center gap-1.5">
          <span className="grid size-5 place-items-center rounded bg-[color:var(--neon-cyan)]/25 font-display text-[10px] text-[color:var(--neon-cyan)]">
            {index + 1}
          </span>
          <span
            className="rounded-full border border-[color:var(--neon-lime)]/40 bg-[color:var(--neon-lime)]/10 px-1.5 py-0.5 font-display text-[9px] text-[color:var(--neon-lime)]"
            title={`Скорость ×${boxSpeedMult(boxLevel).toFixed(2)} · Награда ×${boxRewardMult(boxLevel).toFixed(2)}`}
          >
            ур.{boxLevel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {plant && (
            <span
              className="grid size-5 place-items-center rounded-full border border-white/10 bg-[color:var(--space-bg)] text-[10px]"
              style={{ boxShadow: `0 0 6px ${moodColor(happiness)}` }}
              title="Настроение растения"
            >
              {moodEmoji(happiness)}
            </span>
          )}
          <button
            onClick={handleBoxUpgrade}
            disabled={!canAffordBoxUpgrade}
            title={canUpgradeBox ? `Апгрейд бокса за ${boxCost}💰` : "Максимальный уровень"}
            className={cn(
              "flex items-center gap-0.5 rounded-md border px-1 py-0.5 text-[9px] font-display transition-all",
              canAffordBoxUpgrade
                ? "border-[color:var(--neon-magenta)]/50 text-[color:var(--neon-magenta)] hover:bg-[color:var(--neon-magenta)]/10"
                : "cursor-not-allowed border-white/10 text-muted-foreground opacity-60",
            )}
          >
            <Zap className="size-2.5" />
            {canUpgradeBox ? boxCost : "MAX"}
          </button>
        </div>
      </div>

      {/* Стеклянный аквариум */}
      <button
        onClick={handleBoxClick}
        title={
          plant
            ? `${plant.name}\n🌡 ${plant.idealTemp}°C  💧 ${plant.idealHumidity}%  🫧 ${plant.idealOxygen}%`
            : "Посадить семя"
        }
        className={cn(
          "relative flex h-[180px] w-full flex-col items-center justify-end overflow-hidden border-2 border-t-0 bg-gradient-to-b from-[color:var(--neon-cyan)]/8 via-transparent to-[color:var(--space-panel-deep)]/50 backdrop-blur-[2px] transition-all",
          cell.isReady
            ? "cursor-pointer border-[color:var(--neon-lime)]/70 shadow-[inset_0_0_28px_-4px_var(--neon-lime),0_0_20px_-6px_var(--neon-lime)]"
            : cell.plantId
              ? "cursor-default border-[color:var(--neon-cyan)]/40"
              : "cursor-pointer border-dashed border-[color:var(--neon-cyan)]/30 hover:border-[color:var(--neon-cyan)]/70 hover:bg-[color:var(--neon-cyan)]/5",
          hasPest && "border-red-500/70 shadow-[inset_0_0_28px_-4px_#ef4444]",
        )}
        style={{ borderRadius: "0 0 10px 10px" }}
      >
        {/* Блик стекла */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-2 w-1.5 rounded-full bg-white/10 blur-[1px]"
        />
        {/* Пол бокса (грунт) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
          style={{
            background:
              "linear-gradient(180deg, transparent, oklch(0.28 0.08 40) 30%, oklch(0.22 0.07 38))",
          }}
        />
        {/* Растение или + */}
        {!cell.plantId ? (
          <span className="pointer-events-none mb-8 flex items-center gap-1 text-[color:var(--neon-cyan)]/70">
            <Plus className="size-6" />
            <span className="font-display text-xs">Посадить</span>
          </span>
        ) : (
          <>
            <span
              className={cn(
                "pointer-events-none relative z-10 mb-4 origin-bottom text-4xl",
                cell.isReady ? "animate-bounce" : "mars-sway",
              )}
              style={{
                transform: `scale(${0.55 + cell.progress * 0.75})`,
                filter: cell.isReady ? "drop-shadow(0 0 10px var(--neon-lime))" : undefined,
              }}
            >
              {stageEmoji(plant!, cell.progress)}
            </span>
            {/* Стебель, если растение уже проросло */}
            {cell.progress > 0.15 && (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-t from-emerald-800 to-emerald-500"
                style={{
                  width: 3,
                  height: 8 + cell.progress * 40,
                  opacity: 0.6,
                }}
              />
            )}
            <span className="pointer-events-none absolute bottom-1 left-2 right-2 line-clamp-1 text-[10px] font-medium text-foreground/80">
              {plant?.name}
            </span>
          </>
        )}
      </button>

      {/* Прогресс роста */}
      {cell.plantId && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${cell.progress * 100}%`,
              background: "linear-gradient(90deg, var(--neon-cyan), var(--neon-lime))",
            }}
          />
        </div>
      )}

      {/* Мини-ползунки климата */}
      <div className="rounded-md border border-[color:var(--neon-cyan)]/15 bg-[color:var(--space-panel)]/60 px-2 py-1.5">
        <BoxClimateControls boxId={box.id} climate={box.climate} compact />
      </div>
    </div>
  );
}
