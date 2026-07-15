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

  const handleBoxUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const wormEmerging = hasPest && pest ? pest.biteProgress < 0.3 : false;
  const wormOffsetY = hasPest && pest
    ? Math.max(0, (0.3 - Math.min(pest.biteProgress, 0.3)) / 0.3) * 18
    : 0;

  return (
    <div
      data-box-id={box.id}
      className="relative flex w-full min-w-0 flex-col gap-1.5"
    >
      {/* Купол */}
      <button
        onClick={handleBoxClick}
        title={
          plant
            ? `${plant.name}\n🌡 ${plant.idealTemp}°C  💧 ${plant.idealHumidity}%  🫧 ${plant.idealOxygen}%`
            : "Посадить семя"
        }
        className={cn(
          "mars-dome relative flex h-[220px] w-full flex-col items-center justify-end overflow-hidden transition-all",
          cell.isReady && "mars-dome-ready cursor-pointer",
          !cell.plantId && "mars-dome-empty cursor-pointer",
          hasPest && "mars-dome-pest",
        )}
      >
        {/* Блик стекла */}
        <span aria-hidden className="mars-dome-glare" />

        {/* Верхняя плашка: номер / уровень / апгрейд */}
        <span className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[color:var(--neon-cyan)]/40 bg-[color:var(--space-panel)]/80 px-2 py-0.5 backdrop-blur">
          <span className="font-display text-[10px] text-[color:var(--neon-cyan)]">
            #{index + 1}
          </span>
          <span
            className="rounded-full bg-[color:var(--neon-lime)]/15 px-1 font-display text-[9px] text-[color:var(--neon-lime)]"
            title={`Скорость ×${boxSpeedMult(boxLevel).toFixed(2)} · Награда ×${boxRewardMult(boxLevel).toFixed(2)}`}
          >
            ур.{boxLevel}
          </span>
          {plant && (
            <span
              className="text-[10px]"
              style={{ textShadow: `0 0 6px ${moodColor(happiness)}` }}
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
              "flex items-center gap-0.5 rounded-full px-1 font-display text-[9px] transition-all",
              canAffordBoxUpgrade
                ? "text-[color:var(--neon-magenta)] hover:bg-[color:var(--neon-magenta)]/15"
                : "cursor-not-allowed text-muted-foreground opacity-60",
            )}
          >
            <Zap className="size-2.5" />
            {canUpgradeBox ? boxCost : "MAX"}
          </button>
        </span>

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
          <span className="pointer-events-none mb-10 flex items-center gap-1 text-[color:var(--neon-cyan)]/80">
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
            <span className="pointer-events-none absolute bottom-1 left-2 right-2 line-clamp-1 text-center text-[10px] font-medium text-foreground/85">
              {plant?.name}
            </span>
          </>
        )}

        {/* Червь внутри бокса с растением */}
        {hasPest && pest && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Раздавить червя"
            title="Раздавить червя"
            onClick={(e) => {
              e.stopPropagation();
              sfx.squash();
              squashPest();
              toast.success("🪱 Червь уничтожен!", { description: "+25 💰 · +10 очков" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                sfx.squash();
                squashPest();
              }
            }}
            className={cn(
              "absolute bottom-2 left-1/2 z-30 h-7 w-[80%] max-w-[110px] -translate-x-1/2 cursor-pointer",
              wormEmerging ? "worm-emerge" : "worm-chewing",
            )}
            style={{ transform: `translateX(-50%) translateY(${wormOffsetY}px)` }}
          >
            <svg viewBox="0 0 120 40" className="h-full w-full overflow-visible">
              <defs>
                <radialGradient id={`wormSeg-${box.id}`} cx="0.4" cy="0.35" r="0.7">
                  <stop offset="0" stopColor="#ffb4b4" />
                  <stop offset="0.55" stopColor="#d64545" />
                  <stop offset="1" stopColor="#5a0f0f" />
                </radialGradient>
              </defs>
              {/* Голова справа + 5 сегментов тела по убыванию, соединены как одно целое */}
              {/* Хвост -> тело -> голова: рисуем от хвоста, голова поверх */}
              {(() => {
                const headCx = 100;
                const headR = 9;
                // сегменты от головы влево, радиусы по убыванию
                const segs = [
                  { cx: headCx - 12, r: 8 },
                  { cx: headCx - 22, r: 7 },
                  { cx: headCx - 31, r: 6 },
                  { cx: headCx - 39, r: 5 },
                  { cx: headCx - 46, r: 4 },
                ];
                return (
                  <>
                    {segs
                      .slice()
                      .reverse()
                      .map((s, idx) => {
                        const i = segs.length - 1 - idx; // 4..0 (хвост -> к голове)
                        return (
                          <g
                            key={i}
                            className="worm-seg"
                            style={{ animationDelay: `${(segs.length - i) * 0.12}s`, transformOrigin: `${s.cx}px 22px` }}
                          >
                            <circle cx={s.cx} cy={22} r={s.r} fill={`url(#wormSeg-${box.id})`} stroke="#3a0808" strokeWidth="0.5" />
                            <ellipse cx={s.cx - 1.2} cy={20.5} rx={s.r * 0.55} ry={s.r * 0.3} fill="rgba(255,255,255,0.25)" />
                          </g>
                        );
                      })}
                    {/* Голова с глазом и ртом — рисуется последней, перекрывает шов с первым сегментом */}
                    <g className="worm-seg" style={{ animationDelay: "0s", transformOrigin: `${headCx}px 22px` }}>
                      <circle cx={headCx} cy={22} r={headR} fill={`url(#wormSeg-${box.id})`} stroke="#3a0808" strokeWidth="0.6" />
                      <ellipse cx={headCx - 3} cy={19} rx={4} ry={2.4} fill="rgba(255,255,255,0.3)" />
                      <circle cx={headCx + 4} cy={19.5} r={2.2} fill="#fff" />
                      <circle cx={headCx + 4.6} cy={19.8} r={1.2} fill="#000" />
                      <path d={`M${headCx - 4},26 Q${headCx},29 ${headCx + 4},26`} stroke="#3a0808" strokeWidth="1" fill="none" strokeLinecap="round" />
                    </g>
                  </>
                );
              })()}
            </svg>
            <span className="pointer-events-none absolute -bottom-1 left-1/2 h-1 w-14 -translate-x-1/2 overflow-hidden rounded-full bg-white/15">
              <span
                className="block h-full bg-red-500"
                style={{ width: `${pest.biteProgress * 100}%` }}
              />
            </span>
          </span>
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
