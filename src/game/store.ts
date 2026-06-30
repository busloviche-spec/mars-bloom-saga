import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveEvent, Climate, GardenCell, LeaderEntry } from "./types";
import { PLANT_BY_ID, growthRate, plantHappiness } from "./plants";
import { EVENTS, EVENT_BY_ID } from "./events";

const GRID_SIZE = 9;

const emptyCell = (): GardenCell => ({
  plantId: null,
  plantedAt: null,
  progress: 0,
  happinessSum: 0,
  happinessSamples: 0,
  isReady: false,
});

export type GameState = {
  playerName: string | null;
  credits: number;
  totalScore: number;
  climate: Climate;
  garden: GardenCell[];
  inventory: Record<string, number>; // plantId -> count
  activeEvent: ActiveEvent | null;
  lastEventCheck: number;
  leaderboard: LeaderEntry[];
  // actions
  setPlayerName: (name: string) => void;
  setClimate: (patch: Partial<Climate>) => void;
  buySeed: (plantId: string) => boolean;
  plantSeed: (cellIndex: number, plantId: string) => boolean;
  harvest: (cellIndex: number) => void;
  tick: () => void;
  triggerRandomEvent: () => void;
  saveScoreToLeaderboard: () => void;
  resetRun: () => void;
};

const initialGarden = () => Array.from({ length: GRID_SIZE }, emptyCell);

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: null,
      credits: 250,
      totalScore: 0,
      climate: { temp: 20, humidity: 40, oxygen: 60 },
      garden: initialGarden(),
      inventory: {},
      activeEvent: null,
      lastEventCheck: Date.now(),
      leaderboard: [],

      setPlayerName: (name) => set({ playerName: name.trim() || "Агроном" }),

      setClimate: (patch) =>
        set((s) => ({
          climate: {
            temp: Math.max(-50, Math.min(50, patch.temp ?? s.climate.temp)),
            humidity: Math.max(0, Math.min(100, patch.humidity ?? s.climate.humidity)),
            oxygen: Math.max(0, Math.min(100, patch.oxygen ?? s.climate.oxygen)),
          },
        })),

      buySeed: (plantId) => {
        const plant = PLANT_BY_ID[plantId];
        if (!plant) return false;
        const { credits, inventory } = get();
        if (credits < plant.price) return false;
        set({
          credits: credits - plant.price,
          inventory: { ...inventory, [plantId]: (inventory[plantId] ?? 0) + 1 },
        });
        return true;
      },

      plantSeed: (cellIndex, plantId) => {
        const { inventory, garden } = get();
        if ((inventory[plantId] ?? 0) <= 0) return false;
        if (garden[cellIndex].plantId) return false;
        const newGarden = garden.slice();
        newGarden[cellIndex] = {
          plantId,
          plantedAt: Date.now(),
          progress: 0,
          happinessSum: 0,
          happinessSamples: 0,
          isReady: false,
        };
        set({
          garden: newGarden,
          inventory: { ...inventory, [plantId]: inventory[plantId] - 1 },
        });
        return true;
      },

      harvest: (cellIndex) => {
        const { garden, credits, totalScore } = get();
        const cell = garden[cellIndex];
        if (!cell.plantId || !cell.isReady) return;
        const plant = PLANT_BY_ID[cell.plantId];
        const avgHappiness = cell.happinessSamples > 0 ? cell.happinessSum / cell.happinessSamples : 0;
        let stars = 1;
        let multiplier = 1;
        if (avgHappiness >= 0.85) {
          stars = 3;
          multiplier = 2;
        } else if (avgHappiness >= 0.65) {
          stars = 2;
          multiplier = 1.5;
        }
        const reward = Math.round(plant.baseReward * multiplier);
        const points = Math.round(plant.basePoints * multiplier);
        const newGarden = garden.slice();
        newGarden[cellIndex] = emptyCell();
        set({
          garden: newGarden,
          credits: credits + reward,
          totalScore: totalScore + points,
        });
        // return result via window event for toast
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("greenhouse:harvest", {
              detail: { stars, reward, points, name: plant.name, emoji: plant.emoji },
            }),
          );
        }
      },

      tick: () => {
        const state = get();
        const now = Date.now();
        // resolve active event
        let activeEvent = state.activeEvent;
        if (activeEvent && now >= activeEvent.endsAt) {
          activeEvent = null;
        }
        // effective climate
        const effective: Climate = { ...state.climate };
        if (activeEvent) {
          const ev = EVENT_BY_ID[activeEvent.eventId];
          if (ev) {
            effective.temp = Math.max(-50, Math.min(50, effective.temp + ev.tempDelta));
            effective.humidity = Math.max(0, Math.min(100, effective.humidity + ev.humidityDelta));
            effective.oxygen = Math.max(0, Math.min(100, effective.oxygen + ev.oxygenDelta));
          }
        }
        // update garden
        const newGarden = state.garden.map((cell) => {
          if (!cell.plantId || cell.isReady) return cell;
          const plant = PLANT_BY_ID[cell.plantId];
          if (!plant) return cell;
          const happiness = plantHappiness(plant, effective);
          const rate = growthRate(happiness);
          // per tick (1s), progress increase = rate * (1 / growthSeconds)
          const progress = Math.min(1, cell.progress + (rate * 1) / plant.growthSeconds);
          const isReady = progress >= 1;
          return {
            ...cell,
            progress,
            happinessSum: cell.happinessSum + happiness,
            happinessSamples: cell.happinessSamples + 1,
            isReady,
          };
        });
        // check if any newly ready
        const newlyReady: string[] = [];
        newGarden.forEach((c, i) => {
          if (c.isReady && !state.garden[i].isReady && c.plantId) {
            newlyReady.push(PLANT_BY_ID[c.plantId].name);
          }
        });
        if (newlyReady.length && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("greenhouse:ready", { detail: { names: newlyReady } }),
          );
        }
        set({ garden: newGarden, activeEvent });
      },

      triggerRandomEvent: () => {
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const now = Date.now();
        set({
          activeEvent: {
            eventId: ev.id,
            startedAt: now,
            endsAt: now + ev.durationSeconds * 1000,
          },
          lastEventCheck: now,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("greenhouse:event", { detail: { eventId: ev.id } }));
        }
      },

      saveScoreToLeaderboard: () => {
        const { playerName, totalScore, leaderboard } = get();
        if (!playerName || totalScore <= 0) return;
        const entry: LeaderEntry = { name: playerName, score: totalScore, date: Date.now() };
        const merged = [...leaderboard, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        set({ leaderboard: merged });
      },

      resetRun: () => {
        const { leaderboard, playerName } = get();
        set({
          credits: 250,
          totalScore: 0,
          climate: { temp: 20, humidity: 40, oxygen: 60 },
          garden: initialGarden(),
          inventory: {},
          activeEvent: null,
          lastEventCheck: Date.now(),
          leaderboard,
          playerName,
        });
      },
    }),
    {
      name: "mars-greenhouse-v1",
      partialize: (s) => ({
        playerName: s.playerName,
        credits: s.credits,
        totalScore: s.totalScore,
        climate: s.climate,
        garden: s.garden,
        inventory: s.inventory,
        leaderboard: s.leaderboard,
      }),
    },
  ),
);
