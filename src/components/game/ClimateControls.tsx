import { Thermometer, Droplets, Wind } from "lucide-react";
import type { Climate } from "@/game/types";
import { EVENT_BY_ID } from "@/game/events";
import { useGame } from "@/game/store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function tempColor(v: number) {
  if (v < 0) return `hsl(${210 + v * 0.5}, 85%, 60%)`;
  return `hsl(${30 - v * 0.4}, 90%, 60%)`;
}
function humidityColor(v: number) {
  return `hsl(${200 - v * 0.6}, 80%, 55%)`;
}
function oxygenColor(v: number) {
  return `hsl(${280 - v * 1.4}, 80%, 60%)`;
}

type RowProps = {
  icon: React.ReactNode;
  tooltip: string;
  value: number;
  display: string;
  min: number;
  max: number;
  color: string;
  drift?: number;
  onChange: (v: number) => void;
};

function Row({ icon, tooltip, value, display, min, max, color, drift, onChange }: RowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const effPct = drift !== undefined && drift !== 0 ? ((value + drift - min) / (max - min)) * 100 : null;
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span style={{ color }} className="shrink-0 cursor-help">{icon}</span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px] bg-[color:var(--mars-panel)] text-[color:var(--mars-cream)] border border-[color:var(--mars-copper)]/40">
          {tooltip}
        </TooltipContent>
      </Tooltip>
      <div className="relative h-2 flex-1 rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
        {effPct !== null && (
          <div
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--mars-rust)] bg-[color:var(--space-bg)]"
            style={{ left: `${Math.max(0, Math.min(100, effPct))}%` }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[color:var(--space-bg)]"
          style={{ left: `${pct}%`, borderColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right font-display text-xs tabular-nums" style={{ color }}>
        {display}
      </span>
    </div>
  );
}

type Props = {
  boxId: string;
  climate: Climate;
};

export function BoxClimateControls({ boxId, climate }: Props) {
  const setBoxClimate = useGame((s) => s.setBoxClimate);
  const activeEvent = useGame((s) => s.activeEvent);
  const ev = activeEvent ? EVENT_BY_ID[activeEvent.eventId] : null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-1.5">
        <Row
          icon={<Thermometer className="size-3.5" />}
          tooltip="🌡 Температура (−50…+50°C). У каждого сорта — свой идеал. Отклонение снижает настроение и замедляет рост."
          value={climate.temp}
          display={`${climate.temp > 0 ? "+" : ""}${climate.temp}°`}
          min={-50}
          max={50}
          color={tempColor(climate.temp)}
          drift={ev?.tempDelta}
          onChange={(v) => setBoxClimate(boxId, { temp: v })}
        />
        <Row
          icon={<Droplets className="size-3.5" />}
          tooltip="💧 Влажность воздуха (0…100%). Слишком сухо — растение вянет, слишком влажно — гниёт."
          value={climate.humidity}
          display={`${climate.humidity}%`}
          min={0}
          max={100}
          color={humidityColor(climate.humidity)}
          drift={ev?.humidityDelta}
          onChange={(v) => setBoxClimate(boxId, { humidity: v })}
        />
        <Row
          icon={<Wind className="size-3.5" />}
          tooltip="🫧 Уровень кислорода O₂ (0…100%). Нужен корням для дыхания; влияет на здоровье и урожай."
          value={climate.oxygen}
          display={`${climate.oxygen}%`}
          min={0}
          max={100}
          color={oxygenColor(climate.oxygen)}
          drift={ev?.oxygenDelta}
          onChange={(v) => setBoxClimate(boxId, { oxygen: v })}
        />
      </div>
    </TooltipProvider>
  );
}
