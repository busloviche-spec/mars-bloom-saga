import { Thermometer, Droplets, Wind } from "lucide-react";
import { useGame } from "@/game/store";
import { EVENT_BY_ID } from "@/game/events";

function tempColor(v: number) {
  // -50 blue -> 0 cyan -> 50 red
  if (v < 0) return `hsl(${210 + v * 0.5}, 85%, 60%)`;
  return `hsl(${30 - v * 0.4}, 90%, 60%)`;
}
function humidityColor(v: number) {
  return `hsl(${200 - v * 0.6}, 80%, 55%)`;
}
function oxygenColor(v: number) {
  return `hsl(${280 - v * 1.4}, 80%, 60%)`;
}

type SliderRowProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  color: string;
  drift?: number;
  onChange: (v: number) => void;
};

function SliderRow({ icon, label, value, display, min, max, color, drift, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const effectivePct = drift !== undefined ? ((value + drift - min) / (max - min)) * 100 : null;
  return (
    <div className="rounded-2xl border border-white/5 bg-[color:var(--space-panel-deep)]/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span style={{ color }}>{icon}</span>
          {label}
        </div>
        <div className="font-display text-sm tabular-nums" style={{ color }}>
          {display}
          {drift !== undefined && drift !== 0 && (
            <span className="ml-1 text-xs text-[color:var(--neon-magenta)]">
              ({drift > 0 ? "+" : ""}
              {drift})
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}` }}
        />
        {effectivePct !== null && (
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--neon-magenta)] bg-[color:var(--space-bg)]"
            style={{ left: `${Math.max(0, Math.min(100, effectivePct))}%` }}
            title="С учётом события"
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />
        <div
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[color:var(--space-bg)] transition-all"
          style={{ left: `${pct}%`, borderColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}

export function ClimateControls() {
  const climate = useGame((s) => s.climate);
  const setClimate = useGame((s) => s.setClimate);
  const activeEvent = useGame((s) => s.activeEvent);
  const ev = activeEvent ? EVENT_BY_ID[activeEvent.eventId] : null;

  return (
    <div className="space-y-3 rounded-3xl border border-[color:var(--neon-cyan)]/20 bg-[color:var(--space-panel)]/40 p-4 backdrop-blur-sm">
      <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
        Климат-контроль
      </h2>
      <SliderRow
        icon={<Thermometer className="size-4" />}
        label="Температура"
        value={climate.temp}
        display={`${climate.temp > 0 ? "+" : ""}${climate.temp}°C`}
        min={-50}
        max={50}
        color={tempColor(climate.temp)}
        drift={ev?.tempDelta}
        onChange={(v) => setClimate({ temp: v })}
      />
      <SliderRow
        icon={<Droplets className="size-4" />}
        label="Влажность"
        value={climate.humidity}
        display={`${climate.humidity}%`}
        min={0}
        max={100}
        color={humidityColor(climate.humidity)}
        drift={ev?.humidityDelta}
        onChange={(v) => setClimate({ humidity: v })}
      />
      <SliderRow
        icon={<Wind className="size-4" />}
        label="Кислород"
        value={climate.oxygen}
        display={`${climate.oxygen}%`}
        min={0}
        max={100}
        color={oxygenColor(climate.oxygen)}
        drift={ev?.oxygenDelta}
        onChange={(v) => setClimate({ oxygen: v })}
      />
    </div>
  );
}
