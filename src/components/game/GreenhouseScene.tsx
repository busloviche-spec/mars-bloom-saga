import { Plus, Coins } from "lucide-react";
import { toast } from "sonner";
import { useGame, NEW_BOX_PRICE, MAX_BOX_COUNT } from "@/game/store";
import { GreenhouseBox2D } from "./GreenhouseBox2D";

type Props = {
  onPlant: (boxId: string) => void;
};

export function GreenhouseScene({ onPlant }: Props) {
  const boxes = useGame((s) => s.boxes);
  const credits = useGame((s) => s.credits);
  const addBox = useGame((s) => s.addBox);

  const canAddMore = boxes.length < MAX_BOX_COUNT;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[color:var(--neon-cyan)]/25 bg-gradient-to-b from-[oklch(0.20_0.09_25)] via-[oklch(0.24_0.10_35)] to-[oklch(0.30_0.09_50)] shadow-[inset_0_0_60px_-20px_rgba(0,0,0,0.7)]"
    >
      {/* Небо со звёздами */}
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="stars absolute inset-0" />
      </div>

      {/* Дальние скалы */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[10%] w-full"
        height="90"
        viewBox="0 0 800 90"
        preserveAspectRatio="none"
      >
        <path
          d="M0,90 L0,60 L60,40 L120,55 L180,25 L260,50 L340,20 L420,45 L500,15 L580,50 L660,30 L740,55 L800,35 L800,90 Z"
          fill="oklch(0.30 0.08 35)"
          opacity="0.75"
        />
        <path
          d="M0,90 L0,72 L80,58 L160,68 L240,50 L320,65 L400,48 L480,62 L560,52 L640,68 L720,55 L800,65 L800,90 Z"
          fill="oklch(0.25 0.07 30)"
          opacity="0.85"
        />
      </svg>

      {/* Пыльная буря */}
      <div className="pointer-events-none absolute inset-0 mars-dust" aria-hidden />

      {/* Сетка боксов */}
      <div className="relative z-10 grid grid-cols-3 gap-3 px-4 py-6 sm:gap-4 sm:px-6">
        {boxes.map((box, i) => (
          <GreenhouseBox2D key={box.id} box={box} index={i} onPlant={onPlant} />
        ))}
        {canAddMore && (
          <button
            onClick={() => {
              if (credits < NEW_BOX_PRICE) {
                toast.error(`Нужно ${NEW_BOX_PRICE} кредитов`);
                return;
              }
              if (addBox()) toast.success("Новый изо-бокс установлен");
            }}
            className="mars-dome mars-dome-empty relative flex min-h-[220px] w-full flex-col items-center justify-center gap-2 text-[color:var(--neon-lime)]/85 transition-all hover:brightness-125"
          >
            <span className="mars-dome-glare" aria-hidden />
            <Plus className="size-7" />
            <span className="font-display text-xs">Новый изо-бокс</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Coins className="size-3" />
              {NEW_BOX_PRICE}
            </span>
          </button>
        )}
      </div>

      {/* Марсианский песок — передний план */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 mars-ground"
        style={{ height: 40 }}
      />
    </div>
  );
}
