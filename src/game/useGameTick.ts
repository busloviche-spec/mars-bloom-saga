import { useEffect } from "react";
import { useGame } from "./store";

const EVENT_MIN_INTERVAL_MS = 35_000;
const EVENT_CHANCE_PER_TICK = 0.04;

export function useGameTick() {
  useEffect(() => {
    const tickId = setInterval(() => {
      const s = useGame.getState();
      s.tick();
      const now = Date.now();
      if (!s.activeEvent && now - s.lastEventCheck > EVENT_MIN_INTERVAL_MS) {
        if (Math.random() < EVENT_CHANCE_PER_TICK) {
          s.triggerRandomEvent();
        }
      }
    }, 1000);
    return () => clearInterval(tickId);
  }, []);
}
