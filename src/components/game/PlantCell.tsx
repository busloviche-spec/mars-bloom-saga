import { Plus } from "lucide-react";
import type { GardenCell } from "@/game/types";
import { PLANT_BY_ID, plantHappiness, stageEmoji } from "@/game/plants";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

type Props = {
  cell: GardenCell;
  index: number;
  onPlant: (index: number) => void;
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

export function PlantCell({ cell, index, onPlant }: Props) {
  const climate = useGame((s) => s.climate);
  const harvest = useGame((s) => s.harvest);

  if (!cell.plantId) {
    return (
      <button
        onClick={() => onPlant(index)}
        className="group flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-[color:var(--neon-cyan)]/25 bg-[color:var(--space-panel)]/40 text-[color:var(--neon-cyan)]/60 transition-all hover:border-[color:var(--neon-cyan)]/60 hover:bg-[color:var(--neon-cyan)]/5 hover:text-[color:var(--neon-cyan)]"
        aria-label="Посадить семя"
      >
        <Plus className="size-8 transition-transform group-hover:scale-110" />
      </button>
    );
  }

  const plant = PLANT_BY_ID[cell.plantId];
  const happiness = plantHappiness(plant, climate);
  const ready = cell.isReady;
  const emoji = stageEmoji(plant, cell.progress);

  return (
    <button
      onClick={() => ready && harvest(index)}
      title={`${plant.name}\n🌡 ${plant.idealTemp}°C  💧 ${plant.idealHumidity}%  🫧 ${plant.idealOxygen}%`}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center rounded-2xl border bg-gradient-to-br from-[color:var(--space-panel)] to-[color:var(--space-panel-deep)] p-2 text-center transition-all",
        ready
          ? "cursor-pointer border-[color:var(--neon-lime)]/70 shadow-[0_0_24px_-4px_var(--neon-lime)]"
          : "cursor-default border-[color:var(--neon-cyan)]/15",
      )}
    >
      <span
        className={cn(
          "text-4xl transition-transform duration-500 sm:text-5xl",
          ready && "animate-bounce",
        )}
        style={{ transform: `scale(${0.7 + cell.progress * 0.6})` }}
      >
        {emoji}
      </span>
      <span className="mt-1 line-clamp-1 text-[10px] font-medium text-muted-foreground">
        {plant.name}
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
      <span
        className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-white/10 bg-[color:var(--space-bg)] text-xs"
        style={{ boxShadow: `0 0 10px ${moodColor(happiness)}` }}
      >
        {moodEmoji(happiness)}
      </span>
    </button>
  );
}
