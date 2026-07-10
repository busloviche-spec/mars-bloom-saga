import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startOnboardingTour() {
  const d = driver({
    showProgress: true,
    popoverClass: "mars-driver",
    allowClose: true,
    nextBtnText: "Далее →",
    prevBtnText: "← Назад",
    doneBtnText: "Готово ✨",
    steps: [
      {
        element: '[data-tour="topbar"]',
        popover: {
          title: "🚀 Верхняя панель",
          description:
            "Здесь твои ресурсы: 💰 кредиты (валюта), ★ очки, ⭐ звёзды урожая. Звёзды разблокируют редкие сорта.",
        },
      },
      {
        element: '[data-tour="box"]',
        popover: {
          title: "🧪 Изо-бокс",
          description:
            "У каждого бокса свой микроклимат: 🌡 температура, 💧 влажность, 🫧 кислород. Наведи на иконки — увидишь подсказки.",
        },
      },
      {
        element: '[data-tour="box-upgrade"]',
        popover: {
          title: "⚡ Апгрейд бокса",
          description: "Прокачивает скорость роста и награду для всех растений в этом боксе.",
        },
      },
      {
        element: '[data-tour="shop"]',
        popover: {
          title: "🛒 Магазин семян",
          description:
            "Покупай семена и прокачивай сорта. Редкие растения открываются по мере накопления звёзд ⭐.",
        },
      },
      {
        element: '[data-tour="chests"]',
        popover: {
          title: "🎁 Сундуки (ИИ)",
          description:
            "Открывай сундуки — ИИ сгенерирует уникальные инопланетные семена с собственным климатом.",
        },
      },
      {
        element: '[data-tour="help"]',
        popover: {
          title: "❓ Помощь всегда рядом",
          description:
            "Нажми кнопку «?» в любой момент, чтобы прочитать правила или пройти это обучение снова.",
        },
      },
      {
        element: '[data-tour="auth"]',
        popover: {
          title: "🏆 Онлайн-рекорды",
          description:
            "Войди, чтобы отправить свой результат в глобальный лидерборд и соревноваться с игроками со всего мира.",
        },
      },
    ],
  });
  d.drive();
}
