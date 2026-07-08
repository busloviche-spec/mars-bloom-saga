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
  .validator((d: unknown) => {
    const input = (d ?? {}) as { tier?: string };
    return { tier: input.tier === "bonus" ? "bonus" : "common" };
  })
  .handler(async ({ data }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.error("[chest] OPENAI_API_KEY is not set on the server");
      throw new Error("OPENAI_API_KEY не задан на сервере");
    }

    const spec = TIER_SPECS[data.tier];
    const [min, max] = spec.count;

    const userPrompt = `Сгенерируй ${min}-${max} новых редких семян (${spec.rarityHint}) для игры "Марсианская теплица".
Верни СТРОГО JSON вида:
{
  "seeds": [
    {
      "name": "яркое короткое название на русском",
      "emoji": "один эмодзи-символ растения",
      "description": "1-2 предложения описания на русском",
      "idealTemp": число от -50 до 50,
      "idealHumidity": число от 0 до 100,
      "idealOxygen": число от 0 до 100,
      "growthSeconds": число от 45 до 180,
      "price": число от 60 до 220,
      "basePoints": число от 12 до 40,
      "baseReward": число от 90 до 320,
      "rarity": "rare" | "epic" | "legendary"
    }
  ]
}
Никакого текста вне JSON.`;

    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.9,
          messages: [
            {
              role: "system",
              content:
                "Ты — генератор редких инопланетных растений. Придумывай необычные виды с уникальными климатическими требованиями. Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.",
            },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[chest] network error", msg);
      throw new Error(`Сеть недоступна: ${msg}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[chest] openai error", res.status, text.slice(0, 500));
      if (res.status === 401) throw new Error("OpenAI: неверный API ключ (401)");
      if (res.status === 429) throw new Error("OpenAI: превышен лимит запросов (429)");
      if (res.status === 402) throw new Error("OpenAI: недостаточно кредитов (402)");
      throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200) || "ошибка запроса"}`);
    }

    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[chest] empty content", JSON.stringify(payload).slice(0, 500));
      throw new Error("OpenAI вернул пустой ответ");
    }

    let parsed: { seeds?: Omit<ChestSeed, "id">[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[chest] invalid JSON", content.slice(0, 500));
      throw new Error("OpenAI вернул некорректный JSON");
    }
    if (!parsed.seeds || !Array.isArray(parsed.seeds) || parsed.seeds.length === 0) {
      throw new Error("OpenAI не вернул ни одного семени");
    }

    const seeds: ChestSeed[] = parsed.seeds.map((s, i) => ({
      ...s,
      id: `ai-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      idealTemp: Math.max(-50, Math.min(50, Math.round(Number(s.idealTemp) || 20))),
      idealHumidity: Math.max(0, Math.min(100, Math.round(Number(s.idealHumidity) || 50))),
      idealOxygen: Math.max(0, Math.min(100, Math.round(Number(s.idealOxygen) || 50))),
      growthSeconds: Math.max(30, Math.min(240, Math.round(Number(s.growthSeconds) || 90))),
      price: Math.max(40, Math.round(Number(s.price) || 100)),
      basePoints: Math.max(8, Math.round(Number(s.basePoints) || 20)),
      baseReward: Math.max(60, Math.round(Number(s.baseReward) || 150)),
      rarity: (["rare", "epic", "legendary"].includes(s.rarity) ? s.rarity : "rare") as ChestSeed["rarity"],
    }));

    return { seeds };
  });
