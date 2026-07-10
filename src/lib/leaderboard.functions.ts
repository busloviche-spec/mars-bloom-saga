import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type OnlineScore = {
  username: string;
  points: number;
  credits: number;
  stars_earned: number;
  updated_at: string;
};

/** Публичное чтение топа рекордов через publishable-key клиент */
export const getGlobalLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<OnlineScore[]> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return [];
    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("scores")
      .select("username, points, credits, stars_earned, updated_at")
      .order("points", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[leaderboard] read failed", error);
      return [];
    }
    return (data ?? []) as OnlineScore[];
  },
);

const submitScoreSchema = z.object({
  points: z.number().int().nonnegative(),
  credits: z.number().int().nonnegative(),
  starsEarned: z.number().int().nonnegative(),
  username: z.string().trim().min(1).max(40),
});

/** Отправка рекорда: апсерт по user_id, хранит максимум по очкам */
export const submitScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => submitScoreSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Читаем текущий рекорд, чтобы не понижать
    const { data: existing } = await supabase
      .from("scores")
      .select("points")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing && existing.points >= data.points) {
      return { ok: true, replaced: false, best: existing.points };
    }

    const { error } = await supabase.from("scores").upsert(
      {
        user_id: userId,
        username: data.username,
        points: data.points,
        credits: data.credits,
        stars_earned: data.starsEarned,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) {
      console.error("[leaderboard] upsert failed", error);
      throw new Error(error.message);
    }
    return { ok: true, replaced: true, best: data.points };
  });
