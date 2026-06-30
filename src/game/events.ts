import type { GameEvent } from "./types";

export const EVENTS: GameEvent[] = [
  {
    id: "dust-storm",
    name: "Пылевая буря",
    emoji: "🌪",
    description: "Температура резко падает",
    tempDelta: -15,
    humidityDelta: 0,
    oxygenDelta: 0,
    durationSeconds: 12,
  },
  {
    id: "solar-flare",
    name: "Солнечная вспышка",
    emoji: "☀️",
    description: "Перегрев теплицы",
    tempDelta: 20,
    humidityDelta: -5,
    oxygenDelta: 0,
    durationSeconds: 12,
  },
  {
    id: "oxygen-leak",
    name: "Утечка кислорода",
    emoji: "💨",
    description: "Уровень кислорода падает",
    tempDelta: 0,
    humidityDelta: 0,
    oxygenDelta: -25,
    durationSeconds: 12,
  },
  {
    id: "meteor-rain",
    name: "Метеоритный дождь",
    emoji: "☄️",
    description: "Влажность падает от ударов",
    tempDelta: 5,
    humidityDelta: -20,
    oxygenDelta: 0,
    durationSeconds: 12,
  },
];

export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
