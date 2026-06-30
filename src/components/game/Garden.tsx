import { useGame } from "@/game/store";
import { PlantCell } from "./PlantCell";

type Props = {
  onPlant: (index: number) => void;
};

export function Garden({ onPlant }: Props) {
  const garden = useGame((s) => s.garden);
  return (
    <div className="grid grid-cols-3 gap-3 rounded-3xl border border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-panel)]/40 p-4 backdrop-blur-sm sm:gap-4 sm:p-6">
      {garden.map((cell, i) => (
        <PlantCell key={i} cell={cell} index={i} onPlant={onPlant} />
      ))}
    </div>
  );
}
