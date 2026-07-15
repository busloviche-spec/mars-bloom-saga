import { Thermometer, Droplets, Wind } from "lucide-react";
import type { Climate } from "@/game/types";
import { EVENT_BY_ID } from "@/game/events";
import { useGame } from "@/game/store";

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
  value: number;
  display: string;
  min: number;
  max: number;
  color: string;
  drift?: number;
  tooltip: string;
  compact?: boolean;
  onChange: (v: number) => void;
};

function Row({ icon, value, display, min, max, color, drift, tooltip, compact, onChange }: RowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const effPct = drift !== undefined && drift !== 0 ? ((value + drift - min) / (max - min)) * 100 : null;
  return (
    <div className={compact ? "flex items-center gap-1.5" : "flex items-center gap-2"}>
      <span style={{ color }} title={tooltip} className="shrink-0 cursor-help">{icon}</span>
      <div className={`relative ${compact ? "h-1.5" : "h-2"} flex-1 rounded-full bg-white/5`} title={tooltip}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
        {effPct !== null && (
          <div
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--neon-magenta)] bg-[color:var(--space-bg)]"
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
          className={`pointer-events-none absolute top-1/2 ${compact ? "size-3" : "size-4"} -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[color:var(--space-bg)]`}
          style={{ left: `${pct}%`, borderColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <span
        className={`shrink-0 text-right font-display tabular-nums ${compact ? "w-9 text-[10px]" : "w-14 text-xs"}`}
        style={{ color }}
      >
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
    <div className="space-y-1.5">
      <Row
        icon={<Thermometer className="size-3.5" />}
        value={climate.temp}
        display={`${climate.temp > 0 ? "+" : ""}${climate.temp}°`}
        min={-50}
        max={50}
        color={tempColor(climate.temp)}
        drift={ev?.tempDelta}
        tooltip="🌡 Температура (−50…+50°C). У каждого сорта свой идеал — чем ближе, тем быстрее рост и больше монет."
        onChange={(v) => setBoxClimate(boxId, { temp: v })}
      />
      <Row
        icon={<Droplets className="size-3.5" />}
        value={climate.humidity}
        display={`${climate.humidity}%`}
        min={0}
        max={100}
        color={humidityColor(climate.humidity)}
        drift={ev?.humidityDelta}
        tooltip="💧 Влажность (0–100%). Уровень воды в воздухе. Слишком сухо или сыро — растение грустит и растёт медленнее."
        onChange={(v) => setBoxClimate(boxId, { humidity: v })}
      />
      <Row
        icon={<Wind className="size-3.5" />}
        value={climate.oxygen}
        display={`${climate.oxygen}%`}
        min={0}
        max={100}
        color={oxygenColor(climate.oxygen)}
        drift={ev?.oxygenDelta}
        tooltip="🫧 Кислород (0–100%). Влияет на скорость фотосинтеза и настроение растения."
        onChange={(v) => setBoxClimate(boxId, { oxygen: v })}
      />
    </div>
  );
}
