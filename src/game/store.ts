import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveEvent, BoxCell, Climate, GreenhouseBox, LeaderEntry, Pest, Plant } from "./types";
import { PLANT_BY_ID, growthRate, plantHappiness } from "./plants";
import { EVENTS, EVENT_BY_ID } from "./events";

const INITIAL_BOX_COUNT = 4;
const MAX_BOXES = 8;
const NEW_BOX_COST = 150;

export const CHEST_PRICE = 200;
export const MAX_PLANT_LEVEL = 5;
export const MAX_BOX_LEVEL = 5;

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
  level: 1,
});

const initialBoxes = (): GreenhouseBox[] =>
  Array.from({ length: INITIAL_BOX_COUNT }, (_, i) => makeBox(`box-${i + 1}`));

export function plantUpgradeCost(currentLevel: number) {
  return 120 * currentLevel;
}
export function boxUpgradeCost(currentLevel: number) {
  return 180 * currentLevel;
}
export function plantSpeedMult(level: number) {
  return 1 + 0.2 * (level - 1);
}
export function plantRewardMult(level: number) {
  return 1 + 0.25 * (level - 1);
}
export function boxSpeedMult(level: number) {
  return 1 + 0.15 * (level - 1);
}
export function boxRewardMult(level: number) {
  return 1 + 0.15 * (level - 1);
}

export type GameState = {
  playerName: string | null;
  credits: number;
  totalScore: number;
  boxes: GreenhouseBox[];
  inventory: Record<string, number>;
  customPlants: Record<string, Plant>;
  plantLevels: Record<string, number>;
  chests: number;
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
  buyChest: () => boolean;
  openChest: (seeds: Plant[]) => void;
  upgradePlant: (plantId: string) => boolean;
  upgradeBox: (boxId: string) => boolean;
  tick: () => void;
  triggerRandomEvent: () => void;
  saveScoreToLeaderboard: () => void;
  resetRun: () => void;
};

export const NEW_BOX_PRICE = NEW_BOX_COST;
export const MAX_BOX_COUNT = MAX_BOXES;

function getPlant(state: Pick<GameState, "customPlants">, id: string): Plant | undefined {
  return state.customPlants[id] ?? PLANT_BY_ID[id];
}

export function resolvePlant(state: { customPlants: Record<string, Plant> }, id: string) {
  return state.customPlants[id] ?? PLANT_BY_ID[id];
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: null,
      credits: 250,
      totalScore: 0,
      boxes: initialBoxes(),
      inventory: {},
      customPlants: {},
      plantLevels: {},
      chests: 0,
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
        const state = get();
        const plant = getPlant(state, plantId);
        if (!plant) return false;
        if (state.credits < plant.price) return false;
        set({
          credits: state.credits - plant.price,
          inventory: { ...state.inventory, [plantId]: (state.inventory[plantId] ?? 0) + 1 },
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
        const state = get();
        const box = state.boxes.find((b) => b.id === boxId);
        if (!box || !box.cell.plantId || !box.cell.isReady) return;
        const plant = getPlant(state, box.cell.plantId);
        if (!plant) return;
        const avg = box.cell.happinessSamples > 0 ? box.cell.happinessSum / box.cell.happinessSamples : 0;
        let stars = 1;
        let mult = 1;
        if (avg >= 0.85) { stars = 3; mult = 2; }
        else if (avg >= 0.65) { stars = 2; mult = 1.5; }
        const pLvl = state.plantLevels[plant.id] ?? 1;
        const bLvl = box.level ?? 1;
        const rewardBoost = plantRewardMult(pLvl) * boxRewardMult(bLvl);
        const reward = Math.round(plant.baseReward * mult * rewardBoost);
        const points = Math.round(plant.basePoints * mult * rewardBoost);
        // Chest drop on perfect harvest (3⭐)
        const gotChest = stars === 3 && Math.random() < 0.35;
        set({
          boxes: state.boxes.map((b) => (b.id === boxId ? { ...b, cell: emptyCell() } : b)),
          credits: state.credits + reward,
          totalScore: state.totalScore + points,
          chests: state.chests + (gotChest ? 1 : 0),
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("greenhouse:harvest", {
              detail: { stars, reward, points, name: plant.name, emoji: plant.emoji, gotChest },
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

      buyChest: () => {
        const { credits, chests } = get();
        if (credits < CHEST_PRICE) return false;
        set({ credits: credits - CHEST_PRICE, chests: chests + 1 });
        return true;
      },

      openChest: (seeds) => {
        if (!seeds.length) return;
        const state = get();
        if (state.chests <= 0) return;
        const nextCustom = { ...state.customPlants };
        const nextInv = { ...state.inventory };
        for (const s of seeds) {
          nextCustom[s.id] = { ...s, isAi: true };
          nextInv[s.id] = (nextInv[s.id] ?? 0) + 1;
        }
        set({ chests: state.chests - 1, customPlants: nextCustom, inventory: nextInv });
      },

      upgradePlant: (plantId) => {
        const state = get();
        const plant = getPlant(state, plantId);
        if (!plant) return false;
        const cur = state.plantLevels[plantId] ?? 1;
        if (cur >= MAX_PLANT_LEVEL) return false;
        const cost = plantUpgradeCost(cur);
        if (state.credits < cost) return false;
        set({
          credits: state.credits - cost,
          plantLevels: { ...state.plantLevels, [plantId]: cur + 1 },
        });
        return true;
      },

      upgradeBox: (boxId) => {
        const state = get();
        const box = state.boxes.find((b) => b.id === boxId);
        if (!box) return false;
        const cur = box.level ?? 1;
        if (cur >= MAX_BOX_LEVEL) return false;
        const cost = boxUpgradeCost(cur);
        if (state.credits < cost) return false;
        set({
          credits: state.credits - cost,
          boxes: state.boxes.map((b) => (b.id === boxId ? { ...b, level: cur + 1 } : b)),
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
          const plant = getPlant(state, cell.plantId);
          if (!plant) return box;
          const effective: Climate = { ...box.climate };
          if (ev) {
            effective.temp = Math.max(-50, Math.min(50, effective.temp + ev.tempDelta));
            effective.humidity = Math.max(0, Math.min(100, effective.humidity + ev.humidityDelta));
            effective.oxygen = Math.max(0, Math.min(100, effective.oxygen + ev.oxygenDelta));
          }
          const happiness = plantHappiness(plant, effective);
          const rate = growthRate(happiness);
          const pLvl = state.plantLevels[plant.id] ?? 1;
          const bLvl = box.level ?? 1;
          const speedBoost = plantSpeedMult(pLvl) * boxSpeedMult(bLvl);
          const progress = Math.min(1, cell.progress + (rate * speedBoost) / plant.growthSeconds);
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
          customPlants: {},
          plantLevels: {},
          chests: 0,
          activeEvent: null,
          lastEventCheck: Date.now(),
          leaderboard,
          playerName,
        });
      },
    }),
    {
      name: "mars-greenhouse-v3",
      partialize: (s) => ({
        playerName: s.playerName,
        credits: s.credits,
        totalScore: s.totalScore,
        boxes: s.boxes,
        inventory: s.inventory,
        customPlants: s.customPlants,
        plantLevels: s.plantLevels,
        chests: s.chests,
        leaderboard: s.leaderboard,
      }),
    },
  ),
);
