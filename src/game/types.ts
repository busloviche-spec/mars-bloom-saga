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
  growthSeconds: number;
  price: number;
  basePoints: number;
  baseReward: number;
  rarity: "common" | "rare" | "epic";
};

export type BoxCell = {
  plantId: string | null;
  plantedAt: number | null;
  progress: number;
  happinessSum: number;
  happinessSamples: number;
  isReady: boolean;
};

export type GreenhouseBox = {
  id: string;
  climate: Climate;
  cell: BoxCell;
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
