import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const rules: { emoji: string; title: string; text: string }[] = [
  {
    emoji: "🌱",
    title: "Цель игры",
    text: "Выращивай инопланетные растения в марсианской теплице, зарабатывай монеты 💰 и звёзды ⭐ за качественный урожай.",
  },
  {
    emoji: "🧪",
    title: "Изо-боксы и климат",
    text: "У каждого бокса свой микроклимат: температура 🌡, влажность 💧, кислород 🫧. Настрой ползунки как можно ближе к идеалу сорта — тогда растение растёт быстрее и приносит больше монет и звёзд.",
  },
  {
    emoji: "⚡",
    title: "Апгрейды",
    text: "Прокачивай сами изо-боксы (кнопка ⚡ у бокса) — они дают ускорение роста и повышенную награду. В магазине семян можно прокачивать сорта растений — ещё больше монет и очков.",
  },
  {
    emoji: "🛒",
    title: "Магазин семян",
    text: "Покупай новые семена и открывай сорта, накапливая звёзды ⭐. Заблокированные виды показывают, сколько ещё звёзд нужно.",
  },
  {
    emoji: "🪱",
    title: "Червь-вредитель",
    text: "Иногда на грядке появляется марсианский червь и начинает грызть растение. Кликни по нему, чтобы раздавить: +25 💰, +10 очков и шанс на редкий сундук. Не успел — растение погибает.",
  },
  {
    emoji: "🎁",
    title: "Сундуки (ИИ)",
    text: "Сундуки содержат случайные ИИ-семена, сгенерированные нейросетью. Открывай их в разделе «Сундуки» — там появятся уникальные сорта с собственными идеальными условиями.",
  },
  {
    emoji: "🌪",
    title: "События и катаклизмы",
    text: "Погодные аномалии временно сдвигают климат во всех боксах. На ползунках появляется магента-точка — это фактический уровень с учётом события. Подстраивай ползунки быстро!",
  },
  {
    emoji: "😄",
    title: "Настроение растения",
    text: "Смайлик рядом с боксом показывает, насколько растению комфортно. Чем счастливее растение — тем быстрее рост и больше звёзд ⭐ при сборе.",
  },
];

export function HowToPlayDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[color:var(--neon-cyan)]/30 bg-[color:var(--space-panel)]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-[color:var(--neon-cyan)]">
            📖 Как играть — Марсианская теплица
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Короткая инструкция и правила. Возвращайся к ней в любой момент через кнопку «?» в шапке.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <ul className="space-y-3">
            {rules.map((r) => (
              <li
                key={r.title}
                className="rounded-xl border border-[color:var(--neon-cyan)]/15 bg-[color:var(--space-panel-deep)]/60 p-3"
              >
                <div className="mb-1 flex items-center gap-2 font-display text-sm text-foreground">
                  <span className="text-lg">{r.emoji}</span>
                  {r.title}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.text}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Удачного урожая на Марсе! 🚀
        </p>
      </DialogContent>
    </Dialog>
  );
}
