import { useLayoutEffect, useRef, useState } from "react";
import { Plus, Coins } from "lucide-react";
import { toast } from "sonner";
import { useGame, NEW_BOX_PRICE, MAX_BOX_COUNT } from "@/game/store";
import { sfx } from "@/game/sounds";
import { GreenhouseBox2D } from "./GreenhouseBox2D";

type Props = {
  onPlant: (boxId: string) => void;
};

export function GreenhouseScene({ onPlant }: Props) {
  const boxes = useGame((s) => s.boxes);
  const credits = useGame((s) => s.credits);
  const addBox = useGame((s) => s.addBox);
  const pest = useGame((s) => s.pest);
  const squashPest = useGame((s) => s.squashPest);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [wormTargetLeft, setWormTargetLeft] = useState<number | null>(null);

  // Compute pest target box center relative to container
  useLayoutEffect(() => {
    if (!pest || !containerRef.current) {
      setWormTargetLeft(null);
      return;
    }
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-box-id="${pest.boxId}"]`,
    );
    if (!el) {
      setWormTargetLeft(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const boxRect = el.getBoundingClientRect();
    setWormTargetLeft(boxRect.left - containerRect.left + boxRect.width / 2);
  }, [pest, boxes]);

  // Worm crawls in from left edge during first 30% of biteProgress,
  // then anchors at target and shakes while chewing.
  const wormLeft = (() => {
    if (!pest || wormTargetLeft === null) return null;
    const crawlPhase = Math.min(1, pest.biteProgress / 0.3);
    return -40 + (wormTargetLeft + 40) * crawlPhase;
  })();
  const isChewing = pest ? pest.biteProgress > 0.3 : false;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-[color:var(--neon-cyan)]/25 bg-gradient-to-b from-[oklch(0.20_0.09_25)] via-[oklch(0.24_0.10_35)] to-[oklch(0.30_0.09_50)] shadow-[inset_0_0_60px_-20px_rgba(0,0,0,0.7)]"
      style={{ minHeight: 440 }}
    >
      {/* Небо со звёздами */}
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="stars absolute inset-0" />
      </div>

      {/* Дальние скалы */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[128px] w-full"
        height="90"
        viewBox="0 0 800 90"
        preserveAspectRatio="none"
      >
        <path
          d="M0,90 L0,60 L60,40 L120,55 L180,25 L260,50 L340,20 L420,45 L500,15 L580,50 L660,30 L740,55 L800,35 L800,90 Z"
          fill="oklch(0.30 0.08 35)"
          opacity="0.75"
        />
        <path
          d="M0,90 L0,72 L80,58 L160,68 L240,50 L320,65 L400,48 L480,62 L560,52 L640,68 L720,55 L800,65 L800,90 Z"
          fill="oklch(0.25 0.07 30)"
          opacity="0.85"
        />
      </svg>

      {/* Пыльная буря — эффект во время события */}
      <div className="pointer-events-none absolute inset-0 mars-dust" aria-hidden />

      {/* Ряд боксов на песке */}
      <div className="relative flex h-full min-h-[440px] items-end overflow-x-auto pb-[110px] pt-6">
        <div className="flex items-end gap-3 px-4 sm:px-6">
          {boxes.map((box, i) => (
            <GreenhouseBox2D key={box.id} box={box} index={i} onPlant={onPlant} />
          ))}
          {boxes.length < MAX_BOX_COUNT && (
            <button
              onClick={() => {
                if (credits < NEW_BOX_PRICE) {
                  toast.error(`Нужно ${NEW_BOX_PRICE} кредитов`);
                  return;
                }
                if (addBox()) toast.success("Новый изо-бокс установлен");
              }}
              className="flex h-[240px] w-[168px] shrink-0 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[color:var(--neon-lime)]/40 bg-[color:var(--space-panel)]/30 text-[color:var(--neon-lime)]/80 transition-all hover:border-[color:var(--neon-lime)]/80 hover:bg-[color:var(--neon-lime)]/5 sm:w-[184px]"
            >
              <Plus className="size-7" />
              <span className="font-display text-xs">Новый изо-бокс</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Coins className="size-3" />
                {NEW_BOX_PRICE}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Марсианский песок — передний план */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 mars-ground"
        style={{ height: 110 }}
      />

      {/* Червь ползёт по песку */}
      {pest && wormLeft !== null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sfx.squash();
            squashPest();
            toast.success("🪱 Червь уничтожен!", { description: "+25 💰 · +10 очков" });
          }}
          aria-label="Раздавить червя"
          title="Раздавить червя"
          className={`absolute z-20 h-8 w-24 transition-all duration-700 ease-linear ${isChewing ? "worm-chewing" : ""}`}
          style={{
            left: wormLeft,
            bottom: 42,
            transform: "translateX(-50%)",
          }}
        >
          <svg viewBox="0 0 100 40" className="h-full w-full">
            <defs>
              <linearGradient id="wormBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#7a1717" />
                <stop offset="0.5" stopColor="#d64545" />
                <stop offset="1" stopColor="#ffb4b4" />
              </linearGradient>
            </defs>
            {/* Тело — волнистая колбаса */}
            <path
              className="worm-body"
              d="M6,22 Q18,10 30,22 T54,22 T78,22 Q88,22 92,20"
              stroke="url(#wormBody)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            {/* Сегменты — тёмные насечки */}
            <path
              d="M6,22 Q18,10 30,22 T54,22 T78,22 Q88,22 92,20"
              stroke="rgba(0,0,0,0.28)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="1 8"
              opacity="0.55"
            />
            {/* Голова */}
            <circle cx="90" cy="20" r="7.5" fill="#e04a4a" stroke="#5a0f0f" strokeWidth="0.6" />
            <circle cx="93" cy="18" r="1.4" fill="#000" />
            <path d="M87,23 Q90,25 93,23" stroke="#4a0a0a" strokeWidth="0.8" fill="none" />
          </svg>
          {/* Полоса прогресса поедания */}
          <span
            className="pointer-events-none absolute -bottom-1 left-1/2 h-1 w-16 -translate-x-1/2 overflow-hidden rounded-full bg-white/15"
          >
            <span
              className="block h-full bg-red-500"
              style={{ width: `${pest.biteProgress * 100}%` }}
            />
          </span>
        </button>
      )}
    </div>
  );
}
