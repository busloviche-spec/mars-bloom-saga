import { useEffect, useState } from "react";
import { ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useGameTick } from "@/game/useGameTick";
import { useGame } from "@/game/store";
import { EVENT_BY_ID } from "@/game/events";
import { sfx } from "@/game/sounds";
import { TopBar } from "./TopBar";
import { Garden } from "./Garden";
import { SeedShopDialog } from "./SeedShopDialog";
import { PlantSeedDialog } from "./PlantSeedDialog";
import { LeaderboardDialog } from "./LeaderboardDialog";
import { PlayerNameDialog } from "./PlayerNameDialog";
import { ChestDialog } from "./ChestDialog";

export function GreenhouseGame() {
  useGameTick();
  const [shopOpen, setShopOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [plantingBox, setPlantingBox] = useState<string | null>(null);
  const activeEvent = useGame((s) => s.activeEvent);
  const chests = useGame((s) => s.chests);
  const ev = activeEvent ? EVENT_BY_ID[activeEvent.eventId] : null;

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const event = EVENT_BY_ID[detail.eventId];
      if (event) {
        sfx.cataclysm();
        toast.warning(`${event.emoji} ${event.name}`, { description: event.description });
      }
    };
    const onReady = (e: Event) => {
      const { names } = (e as CustomEvent).detail;
      sfx.ready();
      toast.success("✨ Урожай созрел", { description: names.join(", ") });
    };
    const onHarvest = (e: Event) => {
      const d = (e as CustomEvent).detail;
      toast.success(`${d.emoji} ${d.name}`, {
        description: `${"⭐".repeat(d.stars)} +${d.reward} 💰 · +${d.points} очков`,
      });
      if (d.gotChest) {
        setTimeout(() => {
          sfx.chest();
          toast("🎁 Выпал сундук с редким семенем!", {
            description: "Открой его в разделе Сундуки",
          });
        }, 400);
      }
    };
    const onPestSpawn = () => {
      toast.warning("🪱 Червь-вредитель!", {
        description: "Он грызёт растение — кликни, чтобы раздавить его",
      });
    };
    const onPestAte = (e: Event) => {
      const d = (e as CustomEvent).detail;
      toast.error("😱 Червь съел урожай", { description: d.name });
    };
    const onPestSquash = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d.bonusChest) {
        toast.success("🎁 Из червя выпал сундук!");
      }
    };
    window.addEventListener("greenhouse:event", onEvent);
    window.addEventListener("greenhouse:ready", onReady);
    window.addEventListener("greenhouse:harvest", onHarvest);
    window.addEventListener("greenhouse:pest-spawn", onPestSpawn);
    window.addEventListener("greenhouse:pest-ate", onPestAte);
    window.addEventListener("greenhouse:pest-squash", onPestSquash);
    return () => {
      window.removeEventListener("greenhouse:event", onEvent);
      window.removeEventListener("greenhouse:ready", onReady);
      window.removeEventListener("greenhouse:harvest", onHarvest);
      window.removeEventListener("greenhouse:pest-spawn", onPestSpawn);
      window.removeEventListener("greenhouse:pest-ate", onPestAte);
      window.removeEventListener("greenhouse:pest-squash", onPestSquash);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--space-bg)] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--neon-magenta)_18%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklab,var(--neon-cyan)_15%,transparent),transparent_60%)]" />
        <div className="stars absolute inset-0" />
      </div>

      <main className="relative mx-auto flex max-w-5xl flex-col gap-4 p-3 sm:p-6">
        <TopBar
          onOpenLeaderboard={() => setLeaderOpen(true)}
          onOpenChests={() => setChestOpen(true)}
        />

        {ev && (
          <div className="rounded-2xl border border-[color:var(--neon-magenta)]/40 bg-[color:var(--neon-magenta)]/10 px-4 py-2 text-sm text-[color:var(--neon-magenta)] animate-pulse">
            {ev.emoji} <span className="font-display">{ev.name}</span> — {ev.description}. Каждый бокс под ударом!
          </div>
        )}

        <div className="rounded-2xl border border-[color:var(--neon-cyan)]/10 bg-[color:var(--space-panel)]/20 p-3 text-xs text-muted-foreground sm:p-4">
          🧪 <span className="font-medium text-foreground">Изо-боксы</span> — у каждого свой микроклимат и уровень апгрейда. Прокачивай сорта и боксы, чтобы растения росли быстрее и приносили больше монет.
        </div>

        <Garden onPlant={(id) => setPlantingBox(id)} />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            onClick={() => setShopOpen(true)}
            className="h-12 bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-lime)] font-display text-base text-[color:var(--space-bg)] shadow-[0_0_24px_-4px_var(--neon-cyan)] hover:opacity-90"
          >
            <ShoppingBag className="mr-2 size-5" />
            Магазин семян
          </Button>
          <Button
            onClick={() => setChestOpen(true)}
            className="relative h-12 bg-gradient-to-r from-[color:var(--neon-magenta)] to-[color:var(--neon-cyan)] font-display text-base text-[color:var(--space-bg)] shadow-[0_0_24px_-4px_var(--neon-magenta)] hover:opacity-90"
          >
            <Sparkles className="mr-2 size-5" />
            Сундуки (ИИ)
            {chests > 0 && (
              <span className="ml-2 rounded-full bg-[color:var(--space-bg)]/80 px-2 py-0.5 text-xs text-[color:var(--neon-magenta)]">
                {chests}
              </span>
            )}
          </Button>
        </div>

        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          Каждый изо-бокс имеет свой климат. Прокачивай сорта и боксы, открывай сундуки с ИИ-семенами.
        </footer>
      </main>

      <PlayerNameDialog />
      <SeedShopDialog open={shopOpen} onOpenChange={setShopOpen} />
      <ChestDialog open={chestOpen} onOpenChange={setChestOpen} />
      <PlantSeedDialog
        boxId={plantingBox}
        onClose={() => setPlantingBox(null)}
        onOpenShop={() => setShopOpen(true)}
      />
      <LeaderboardDialog open={leaderOpen} onOpenChange={setLeaderOpen} />
      <Toaster />
    </div>
  );
}
