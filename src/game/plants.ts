import type { Plant } from "./types";

export const PLANTS: Plant[] = [
  {
    id: "cosmo-cactus",
    name: "Космо-кактус",
    emoji: "🌵",
    idealTemp: 25,
    idealHumidity: 20,
    idealOxygen: 40,
    growthSeconds: 30,
    price: 20,
    basePoints: 5,
    baseReward: 30,
    rarity: "common",
  },
  {
    id: "neon-mushroom",
    name: "Неоновый гриб",
    emoji: "🍄",
    idealTemp: 0,
    idealHumidity: 90,
    idealOxygen: 30,
    growthSeconds: 45,
    price: 40,
    basePoints: 8,
    baseReward: 60,
    rarity: "common",
  },
  {
    id: "lava-bush",
    name: "Лавовый куст",
    emoji: "🔥",
    idealTemp: 40,
    idealHumidity: 10,
    idealOxygen: 50,
    growthSeconds: 60,
    price: 50,
    basePoints: 10,
    baseReward: 80,
    rarity: "rare",
  },
  {
    id: "star-lichen",
    name: "Звёздный лишайник",
    emoji: "✨",
    idealTemp: 10,
    idealHumidity: 50,
    idealOxygen: 80,
    growthSeconds: 60,
    price: 60,
    basePoints: 12,
    baseReward: 90,
    rarity: "rare",
  },
  {
    id: "ice-rose",
    name: "Ледяная роза",
    emoji: "🌸",
    idealTemp: -20,
    idealHumidity: 70,
    idealOxygen: 60,
    growthSeconds: 90,
    price: 80,
    basePoints: 15,
    baseReward: 130,
    rarity: "epic",
  },
  {
    id: "plasma-vine",
    name: "Плазма-лиана",
    emoji: "🌿",
    idealTemp: 35,
    idealHumidity: 60,
    idealOxygen: 70,
    growthSeconds: 120,
    price: 100,
    basePoints: 20,
    baseReward: 180,
    rarity: "epic",
  },
];

export const PLANT_BY_ID: Record<string, Plant> = Object.fromEntries(
  PLANTS.map((p) => [p.id, p]),
);

// happiness 0..1 based on distance from ideal
export function plantHappiness(plant: Plant, climate: { temp: number; humidity: number; oxygen: number }) {
  const dT = Math.abs(plant.idealTemp - climate.temp); // up to 100
  const dH = Math.abs(plant.idealHumidity - climate.humidity); // up to 100
  const dO = Math.abs(plant.idealOxygen - climate.oxygen); // up to 100
  // normalize: temp range 100, others 100
  const score = 1 - (dT / 100 + dH / 100 + dO / 100) / 3;
  return Math.max(0, Math.min(1, score));
}

export function growthRate(happiness: number) {
  if (happiness >= 0.85) return 1;
  if (happiness >= 0.65) return 0.5;
  if (happiness >= 0.45) return 0.2;
  return 0;
}

export function stageFromProgress(progress: number): "seed" | "sprout" | "adult" | "harvest" {
  if (progress >= 1) return "harvest";
  if (progress >= 0.66) return "adult";
  if (progress >= 0.33) return "sprout";
  return "seed";
}

export function stageEmoji(plant: Plant, progress: number) {
  const stage = stageFromProgress(progress);
  if (stage === "seed") return "🌰";
  if (stage === "sprout") return "🌱";
  if (stage === "adult") return "🌿";
  return plant.emoji;
}
