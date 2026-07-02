import { createServerFn } from "@tanstack/react-start";

export type ChestSeed = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  idealTemp: number;
  idealHumidity: number;
  idealOxygen: number;
  growthSeconds: number;
  price: number;
  basePoints: number;
  baseReward: number;
  rarity: "rare" | "epic" | "legendary";
};

const TIER_SPECS: Record<string, { count: [number, number]; rarityHint: string }> = {
  common: { count: [1, 2], rarityHint: "в основном rare, иногда epic" },
  bonus: { count: [2, 3], rarityHint: "epic и, возможно, legendary" },
};

export const generateChestSeeds = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const input = (d ?? {}) as { tier?: string };
    return { tier: input.tier === "bonus" ? "bonus" : "common" };
  })
  .handler(async ({ data }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY не задан на сервере");

    const spec = TIER_SPECS[data.tier];
    const [min, max] = spec.count;

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        seeds: {
          type: "array",
          minItems: min,
          maxItems: max,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string", description: "Название на русском, короткое и яркое" },
              emoji: { type: "string", description: "Один эмодзи-символ растения" },
              description: { type: "string", description: "1-2 предложения описания на русском" },
              idealTemp: { type: "number", description: "От -50 до 50 °C" },
              idealHumidity: { type: "number", description: "От 0 до 100" },
              idealOxygen: { type: "number", description: "От 0 до 100" },
              growthSeconds: { type: "number", description: "От 45 до 180 секунд" },
              price: { type: "number", description: "От 60 до 220 кредитов" },
              basePoints: { type: "number", description: "От 12 до 40" },
              baseReward: { type: "number", description: "От 90 до 320" },
              rarity: { type: "string", enum: ["rare", "epic", "legendary"] },
            },
            required: [
              "name",
              "emoji",
              "description",
              "idealTemp",
              "idealHumidity",
              "idealOxygen",
              "growthSeconds",
              "price",
              "basePoints",
              "baseReward",
              "rarity",
            ],
          },
        },
      },
      required: ["seeds"],
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 1.0,
        messages: [
          {
            role: "system",
            content:
              "Ты — генератор редких инопланетных растений для игры 'Марсианская теплица'. Придумывай необычные виды с уникальными климатическими требованиями. Пиши на русском, названия яркие и запоминающиеся. Чем выше редкость — тем экстремальнее условия и выше награда.",
          },
          {
            role: "user",
            content: `Сгенерируй ${min}-${max} новых редких семян (${spec.rarityHint}). Только JSON, соответствующий схеме.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "chest_seeds", strict: true, schema },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
    }

    const payload = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const parsed = JSON.parse(payload.choices[0].message.content) as {
      seeds: Omit<ChestSeed, "id">[];
    };

    const seeds: ChestSeed[] = parsed.seeds.map((s, i) => ({
      ...s,
      id: `ai-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      idealTemp: Math.max(-50, Math.min(50, Math.round(s.idealTemp))),
      idealHumidity: Math.max(0, Math.min(100, Math.round(s.idealHumidity))),
      idealOxygen: Math.max(0, Math.min(100, Math.round(s.idealOxygen))),
      growthSeconds: Math.max(30, Math.min(240, Math.round(s.growthSeconds))),
      price: Math.max(40, Math.round(s.price)),
      basePoints: Math.max(8, Math.round(s.basePoints)),
      baseReward: Math.max(60, Math.round(s.baseReward)),
    }));

    return { seeds };
  });
