import { Plus, Coins } from "lucide-react";
import { useGame, NEW_BOX_PRICE, MAX_BOX_COUNT } from "@/game/store";
import { GreenhouseBoxCard } from "./PlantCell";
import { toast } from "sonner";

type Props = {
  onPlant: (boxId: string) => void;
};

export function Garden({ onPlant }: Props) {
  const boxes = useGame((s) => s.boxes);
  const credits = useGame((s) => s.credits);
  const addBox = useGame((s) => s.addBox);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {boxes.map((box, i) => (
        <GreenhouseBoxCard key={box.id} box={box} index={i} onPlant={onPlant} />
      ))}
      {boxes.length < MAX_BOX_COUNT && (
        <button
          onClick={() => {
            if (credits < NEW_BOX_PRICE) {
              toast.error(`Нужно ${NEW_BOX_PRICE} кредитов`);
              return;
            }
            if (addBox()) toast.success("Новый изо-бокс установлен");
          }}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color:var(--neon-lime)]/30 bg-[color:var(--space-panel)]/30 p-4 text-[color:var(--neon-lime)]/70 transition-all hover:border-[color:var(--neon-lime)]/70 hover:bg-[color:var(--neon-lime)]/5 hover:text-[color:var(--neon-lime)]"
        >
          <Plus className="size-8" />
          <span className="font-display text-sm">Новый изо-бокс</span>
          <span className="flex items-center gap-1 text-xs">
            <Coins className="size-3" />
            {NEW_BOX_PRICE}
          </span>
        </button>
      )}
    </div>
  );
}
