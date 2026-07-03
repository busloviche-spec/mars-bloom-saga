import { useEffect } from "react";
import { useGame } from "./store";
import { sfx } from "./sounds";

const EVENT_MIN_INTERVAL_MS = 35_000;
const EVENT_CHANCE_PER_TICK = 0.04;
const PEST_MIN_INTERVAL_MS = 25_000;
const PEST_CHANCE_PER_TICK = 0.08;

export function useGameTick() {
  useEffect(() => {
    let chewCounter = 0;
    const tickId = setInterval(() => {
      const s = useGame.getState();
      s.tick();
      const now = Date.now();
      if (!s.activeEvent && now - s.lastEventCheck > EVENT_MIN_INTERVAL_MS) {
        if (Math.random() < EVENT_CHANCE_PER_TICK) {
          s.triggerRandomEvent();
        }
      }
      const post = useGame.getState();
      if (!post.pest && now - post.lastPestCheck > PEST_MIN_INTERVAL_MS) {
        if (Math.random() < PEST_CHANCE_PER_TICK) {
          post.trySpawnPest();
          if (useGame.getState().pest) sfx.pest();
          chewCounter = 0;
        }
      } else if (post.pest) {
        chewCounter += 1;
        if (chewCounter % 2 === 0) sfx.pest();
      } else {
        chewCounter = 0;
      }
    }, 1000);
    return () => clearInterval(tickId);
  }, []);
}
