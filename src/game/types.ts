export type Climate = {
  temp: number; // -50..50
  humidity: number; // 0..100
  oxygen: number; // 0..100
};

export type Plant = {
  id: string;
  name: string;
  emoji: string;
  idealTemp: number;
  idealHumidity: number;
  idealOxygen: number;
  growthSeconds: number; // total time to fully grow
  price: number;
  basePoints: number;
  baseReward: number;
  rarity: "common" | "rare" | "epic";
};

export type GardenCell = {
  plantId: string | null;
  plantedAt: number | null; // ms epoch
  progress: number; // 0..1
  happinessSum: number; // accumulated happiness samples
  happinessSamples: number;
  isReady: boolean;
};

export type GameEvent = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tempDelta: number;
  humidityDelta: number;
  oxygenDelta: number;
  durationSeconds: number;
};

export type ActiveEvent = {
  eventId: string;
  startedAt: number;
  endsAt: number;
};

export type LeaderEntry = {
  name: string;
  score: number;
  date: number;
};
