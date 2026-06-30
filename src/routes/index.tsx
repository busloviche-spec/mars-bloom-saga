import { createFileRoute } from "@tanstack/react-router";
import { GreenhouseGame } from "@/components/game/GreenhouseGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Марсианская теплица — космическая игра-симулятор" },
      {
        name: "description",
        content:
          "Управляй температурой, влажностью и кислородом в марсианской теплице. Выращивай инопланетные растения, реагируй на катаклизмы и становись лучшим агрономом галактики.",
      },
      { property: "og:title", content: "Марсианская теплица" },
      {
        property: "og:description",
        content: "Браузерная игра-симулятор: климат-контроль, редкие растения и катаклизмы на Марсе.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <GreenhouseGame />;
}
