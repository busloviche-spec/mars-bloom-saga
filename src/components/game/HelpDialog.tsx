import { HelpCircle, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStartTour: () => void;
};

export function HelpDialog({ open, onOpenChange, onStartTour }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[color:var(--mars-copper)]/30 bg-[color:var(--mars-panel)] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl text-[color:var(--mars-amber)]">
            <HelpCircle className="size-5" />
            Правила игры «Марсианская теплица»
          </DialogTitle>
          <DialogDescription>
            Мини-инструкция и подсказки по всем механикам.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-5 text-sm leading-relaxed">
            <Section title="🎯 Цель игры">
              Ты — агроном первой колонии на Марсе. Выращивай инопланетные растения в
              изо-боксах, зарабатывай кредиты и очки, поднимайся в галактическом
              лидерборде.
            </Section>

            <Section title="🧪 Изо-боксы и микроклимат">
              У каждого бокса свой микроклимат: <b>🌡 температура</b>,{" "}
              <b>💧 влажность</b> и <b>🫧 уровень кислорода</b>. У каждого сорта — свои
              идеальные значения; чем ближе климат к идеалу, тем счастливее растение
              (эмоджи-настроение сверху бокса), тем быстрее оно растёт и тем больше
              звёзд ⭐ ты получаешь при сборе (1–3⭐ = ×1, ×1.5, ×2 награды).
            </Section>

            <Section title="🌱 Посадка и сбор">
              1) Купи семена в «Магазине семян». 2) Нажми «+ Посадить» в пустом
              боксе. 3) Дождись, пока полоска прогресса заполнится и растение
              подпрыгнет. 4) Кликни по нему, чтобы собрать урожай.
            </Section>

            <Section title="⚡ Апгрейды">
              Каждый бокс и каждый сорт можно прокачать до 5 уровня:
              <ul className="mt-1 list-inside list-disc space-y-0.5 pl-2">
                <li>Апгрейд <b>бокса</b> (жёлтая молния ⚡ в углу) — +скорость роста и +награда для всего, что в нём растёт.</li>
                <li>Апгрейд <b>сорта</b> (в магазине семян) — +скорость и +награда конкретно этого растения во всех боксах.</li>
              </ul>
            </Section>

            <Section title="⭐ Разблокировка сортов">
              Редкие сорта в магазине закрыты 🔒 до тех пор, пока ты не заработаешь
              нужное количество звёзд ⭐ (счётчик в верхней панели). Прогресс-бар
              показывает, сколько осталось.
            </Section>

            <Section title="🪱 Червь-вредитель">
              Иногда на растение заползает червь. Он грызёт культуру и за 20 секунд
              полностью её уничтожает. Кликай по червю, чтобы раздавить его:{" "}
              <b>+25💰 и +10 очков</b>, а с малым шансом выпадает сундук.
            </Section>

            <Section title="🎁 Сундуки (ИИ)">
              Сундуки можно купить за монеты или получить в награду за трёхзвёздный
              урожай или раздавленного червя. При открытии ИИ (OpenAI) генерирует 3
              уникальных инопланетных семени с собственными параметрами климата.
              Требуется твой ключ OpenAI, добавленный в настройках Cloud.
            </Section>

            <Section title="☄️ Катаклизмы">
              Периодически на теплицу обрушиваются катаклизмы: пыльная буря,
              солнечная вспышка и др. Они временно сдвигают показатели климата во
              всех боксах — следи за красной подсказкой сверху и подстраивай ползунки.
            </Section>

            <Section title="🏆 Рекорды">
              Локальный лидерборд — топ-10 на этом устройстве. Онлайн-лидерборд
              показывает лучших игроков со всего мира. Чтобы отправить свой рекорд,
              войди по e-mail или через Google.
            </Section>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              onStartTour();
            }}
            className="bg-[color:var(--mars-rust)] text-[color:var(--mars-cream)] hover:bg-[color:var(--mars-rust)]/85"
          >
            <PlayCircle className="mr-2 size-4" />
            Пройти обучение заново
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-display text-base text-[color:var(--mars-amber)]">{title}</h3>
      <div className="text-[color:var(--mars-cream)]/85">{children}</div>
    </section>
  );
}
