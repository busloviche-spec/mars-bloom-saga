import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useGameTick } from "@/game/useGameTick";
import { useGame } from "@/game/store";
import { EVENT_BY_ID } from "@/game/events";
import { TopBar } from "./TopBar";
import { Garden } from "./Garden";
import { ClimateControls } from "./ClimateControls";
import { SeedShopDialog } from "./SeedShopDialog";
import { PlantSeedDialog } from "./PlantSeedDialog";
import { LeaderboardDialog } from "./LeaderboardDialog";
import { PlayerNameDialog } from "./PlayerNameDialog";

export function GreenhouseGame() {
  useGameTick();
  const [shopOpen, setShopOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [plantingCell, setPlantingCell] = useState<number | null>(null);
  const activeEvent = useGame((s) => s.activeEvent);
  const ev = activeEvent ? EVENT_BY_ID[activeEvent.eventId] : null;

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const event = EVENT_BY_ID[detail.eventId];
      if (event) toast.warning(`${event.emoji} ${event.name}`, { description: event.description });
    };
    const onReady = (e: Event) => {
      const { names } = (e as CustomEvent).detail;
      toast.success("✨ Урожай созрел", { description: names.join(", ") });
    };
    const onHarvest = (e: Event) => {
      const d = (e as CustomEvent).detail;
      toast.success(`${d.emoji} ${d.name}`, {
        description: `${"⭐".repeat(d.stars)} +${d.reward} 💰 · +${d.points} очков`,
      });
    };
    window.addEventListener("greenhouse:event", onEvent);
    window.addEventListener("greenhouse:ready", onReady);
    window.addEventListener("greenhouse:harvest", onHarvest);
    return () => {
      window.removeEventListener("greenhouse:event", onEvent);
      window.removeEventListener("greenhouse:ready", onReady);
      window.removeEventListener("greenhouse:harvest", onHarvest);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--space-bg)] text-foreground">
      {/* starfield */}
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--neon-magenta)_18%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklab,var(--neon-cyan)_15%,transparent),transparent_60%)]" />
        <div className="stars absolute inset-0" />
      </div>

      <main className="relative mx-auto flex max-w-5xl flex-col gap-4 p-3 sm:p-6">
        <TopBar onOpenLeaderboard={() => setLeaderOpen(true)} />

        {ev && (
          <div className="rounded-2xl border border-[color:var(--neon-magenta)]/40 bg-[color:var(--neon-magenta)]/10 px-4 py-2 text-sm text-[color:var(--neon-magenta)] animate-pulse">
            {ev.emoji} <span className="font-display">{ev.name}</span> — {ev.description}. Подстрой климат!
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <Garden onPlant={(i) => setPlantingCell(i)} />
          <div className="flex flex-col gap-3">
            <ClimateControls />
            <Button
              onClick={() => setShopOpen(true)}
              className="h-12 w-full bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-lime)] font-display text-base text-[color:var(--space-bg)] shadow-[0_0_24px_-4px_var(--neon-cyan)] hover:opacity-90"
            >
              <ShoppingBag className="mr-2 size-5" />
              Магазин семян
            </Button>
          </div>
        </div>

        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          Наведи курсор на грядку, чтобы увидеть идеальные параметры растения.
        </footer>
      </main>

      <PlayerNameDialog />
      <SeedShopDialog open={shopOpen} onOpenChange={setShopOpen} />
      <PlantSeedDialog
        cellIndex={plantingCell}
        onClose={() => setPlantingCell(null)}
        onOpenShop={() => setShopOpen(true)}
      />
      <LeaderboardDialog open={leaderOpen} onOpenChange={setLeaderOpen} />
      <Toaster />
    </div>
  );
}
