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

      {/* Кратеры на марсианской поверхности — проглядывают между боксами */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="crater" cx="0.5" cy="0.4" r="0.55">
            <stop offset="0" stopColor="oklch(0.16 0.06 30)" stopOpacity="0.85" />
            <stop offset="0.55" stopColor="oklch(0.22 0.07 35)" stopOpacity="0.6" />
            <stop offset="0.85" stopColor="oklch(0.40 0.10 45)" stopOpacity="0.55" />
            <stop offset="1" stopColor="oklch(0.45 0.11 50)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="craterRim" cx="0.5" cy="0.65" r="0.55">
            <stop offset="0.7" stopColor="transparent" />
            <stop offset="0.9" stopColor="oklch(0.55 0.13 55)" stopOpacity="0.5" />
            <stop offset="1" stopColor="transparent" />
          </radialGradient>
        </defs>
        {[
          { cx: 130, cy: 250, rx: 55, ry: 20 },
          { cx: 400, cy: 260, rx: 70, ry: 24 },
          { cx: 670, cy: 240, rx: 48, ry: 18 },
          { cx: 250, cy: 420, rx: 90, ry: 26 },
          { cx: 560, cy: 430, rx: 75, ry: 22 },
          { cx: 80, cy: 400, rx: 40, ry: 14 },
          { cx: 730, cy: 410, rx: 42, ry: 15 },
        ].map((c, i) => (
          <g key={i}>
            <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="url(#crater)" />
            <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="url(#craterRim)" />
          </g>
        ))}
        {/* Мелкие камешки */}
        {[
          [180, 300], [340, 340], [500, 310], [620, 360], [90, 340], [720, 320], [420, 460],
        ].map(([x, y], i) => (
          <circle key={`r-${i}`} cx={x} cy={y} r={2} fill="oklch(0.28 0.07 35)" opacity="0.7" />
        ))}
      </svg>


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
