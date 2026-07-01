import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveEvent, BoxCell, Climate, GreenhouseBox, LeaderEntry } from "./types";
import { PLANT_BY_ID, growthRate, plantHappiness } from "./plants";
import { EVENTS, EVENT_BY_ID } from "./events";

const INITIAL_BOX_COUNT = 4;
const MAX_BOXES = 8;
const NEW_BOX_COST = 150;

const emptyCell = (): BoxCell => ({
  plantId: null,
  plantedAt: null,
  progress: 0,
  happinessSum: 0,
  happinessSamples: 0,
  isReady: false,
});

const defaultClimate = (): Climate => ({ temp: 20, humidity: 40, oxygen: 60 });

const makeBox = (id: string, climate?: Partial<Climate>): GreenhouseBox => ({
  id,
  climate: { ...defaultClimate(), ...climate },
  cell: emptyCell(),
});

const initialBoxes = (): GreenhouseBox[] =>
  Array.from({ length: INITIAL_BOX_COUNT }, (_, i) => makeBox(`box-${i + 1}`));

export type GameState = {
  playerName: string | null;
  credits: number;
  totalScore: number;
  boxes: GreenhouseBox[];
  inventory: Record<string, number>;
  activeEvent: ActiveEvent | null;
  lastEventCheck: number;
  leaderboard: LeaderEntry[];
  // actions
  setPlayerName: (name: string) => void;
  setBoxClimate: (boxId: string, patch: Partial<Climate>) => void;
  buySeed: (plantId: string) => boolean;
  plantSeed: (boxId: string, plantId: string) => boolean;
  harvest: (boxId: string) => void;
  addBox: () => boolean;
  tick: () => void;
  triggerRandomEvent: () => void;
  saveScoreToLeaderboard: () => void;
  resetRun: () => void;
};

export const NEW_BOX_PRICE = NEW_BOX_COST;
export const MAX_BOX_COUNT = MAX_BOXES;

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: null,
      credits: 250,
      totalScore: 0,
      boxes: initialBoxes(),
      inventory: {},
      activeEvent: null,
      lastEventCheck: Date.now(),
      leaderboard: [],

      setPlayerName: (name) => set({ playerName: name.trim() || "Агроном" }),

      setBoxClimate: (boxId, patch) =>
        set((s) => ({
          boxes: s.boxes.map((b) =>
            b.id === boxId
              ? {
                  ...b,
                  climate: {
                    temp: Math.max(-50, Math.min(50, patch.temp ?? b.climate.temp)),
                    humidity: Math.max(0, Math.min(100, patch.humidity ?? b.climate.humidity)),
                    oxygen: Math.max(0, Math.min(100, patch.oxygen ?? b.climate.oxygen)),
                  },
                }
              : b,
          ),
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

      plantSeed: (boxId, plantId) => {
        const { inventory, boxes } = get();
        if ((inventory[plantId] ?? 0) <= 0) return false;
        const box = boxes.find((b) => b.id === boxId);
        if (!box || box.cell.plantId) return false;
        set({
          boxes: boxes.map((b) =>
            b.id === boxId
              ? { ...b, cell: { ...emptyCell(), plantId, plantedAt: Date.now() } }
              : b,
          ),
          inventory: { ...inventory, [plantId]: inventory[plantId] - 1 },
        });
        return true;
      },

      harvest: (boxId) => {
        const { boxes, credits, totalScore } = get();
        const box = boxes.find((b) => b.id === boxId);
        if (!box || !box.cell.plantId || !box.cell.isReady) return;
        const plant = PLANT_BY_ID[box.cell.plantId];
        const avg = box.cell.happinessSamples > 0 ? box.cell.happinessSum / box.cell.happinessSamples : 0;
        let stars = 1;
        let mult = 1;
        if (avg >= 0.85) { stars = 3; mult = 2; }
        else if (avg >= 0.65) { stars = 2; mult = 1.5; }
        const reward = Math.round(plant.baseReward * mult);
        const points = Math.round(plant.basePoints * mult);
        set({
          boxes: boxes.map((b) => (b.id === boxId ? { ...b, cell: emptyCell() } : b)),
          credits: credits + reward,
          totalScore: totalScore + points,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("greenhouse:harvest", {
              detail: { stars, reward, points, name: plant.name, emoji: plant.emoji },
            }),
          );
        }
      },

      addBox: () => {
        const { boxes, credits } = get();
        if (boxes.length >= MAX_BOXES) return false;
        if (credits < NEW_BOX_COST) return false;
        set({
          credits: credits - NEW_BOX_COST,
          boxes: [...boxes, makeBox(`box-${Date.now()}`)],
        });
        return true;
      },

      tick: () => {
        const state = get();
        const now = Date.now();
        let activeEvent = state.activeEvent;
        if (activeEvent && now >= activeEvent.endsAt) activeEvent = null;
        const ev = activeEvent ? EVENT_BY_ID[activeEvent.eventId] : null;

        const newlyReady: string[] = [];
        const newBoxes = state.boxes.map((box) => {
          const cell = box.cell;
          if (!cell.plantId || cell.isReady) return box;
          const plant = PLANT_BY_ID[cell.plantId];
          if (!plant) return box;
          const effective: Climate = { ...box.climate };
          if (ev) {
            effective.temp = Math.max(-50, Math.min(50, effective.temp + ev.tempDelta));
            effective.humidity = Math.max(0, Math.min(100, effective.humidity + ev.humidityDelta));
            effective.oxygen = Math.max(0, Math.min(100, effective.oxygen + ev.oxygenDelta));
          }
          const happiness = plantHappiness(plant, effective);
          const rate = growthRate(happiness);
          const progress = Math.min(1, cell.progress + (rate * 1) / plant.growthSeconds);
          const isReady = progress >= 1;
          if (isReady && !cell.isReady) newlyReady.push(plant.name);
          return {
            ...box,
            cell: {
              ...cell,
              progress,
              happinessSum: cell.happinessSum + happiness,
              happinessSamples: cell.happinessSamples + 1,
              isReady,
            },
          };
        });

        if (newlyReady.length && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("greenhouse:ready", { detail: { names: newlyReady } }));
        }
        set({ boxes: newBoxes, activeEvent });
      },

      triggerRandomEvent: () => {
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const now = Date.now();
        set({
          activeEvent: { eventId: ev.id, startedAt: now, endsAt: now + ev.durationSeconds * 1000 },
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
        const merged = [...leaderboard, entry].sort((a, b) => b.score - a.score).slice(0, 10);
        set({ leaderboard: merged });
      },

      resetRun: () => {
        const { leaderboard, playerName } = get();
        set({
          credits: 250,
          totalScore: 0,
          boxes: initialBoxes(),
          inventory: {},
          activeEvent: null,
          lastEventCheck: Date.now(),
          leaderboard,
          playerName,
        });
      },
    }),
    {
      name: "mars-greenhouse-v2",
      partialize: (s) => ({
        playerName: s.playerName,
        credits: s.credits,
        totalScore: s.totalScore,
        boxes: s.boxes,
        inventory: s.inventory,
        leaderboard: s.leaderboard,
      }),
    },
  ),
);
