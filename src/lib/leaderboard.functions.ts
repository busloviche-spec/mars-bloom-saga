import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type LeaderRow = {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  score: number;
  rank: number;
  created_at: string;
};

function createPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getLeaderboardPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const limit = data.limit ?? 50;
    const offset = data.offset ?? 0;
    const supabase = createPublicClient();

    const { data: rows, error } = await supabase
      .from("leaderboard")
      .select("user_id, score, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", ids);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.username]));
    }

    const items: LeaderRow[] = (rows ?? []).map((r, i) => ({
      user_id: r.user_id,
      nickname: names[r.user_id] ?? "Агроном",
      avatar_url: null,
      score: r.score,
      created_at: r.created_at,
      rank: offset + i + 1,
    }));

    return { items, limit, offset, hasMore: items.length === limit };
  });

export const getMyBestScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leaderboard")
      .select("score")
      .eq("user_id", context.userId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { best: data?.score ?? 0 };
  });

export const submitScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ score: z.number().int().min(0).max(10_000_000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: prev, error: readErr } = await context.supabase
      .from("leaderboard")
      .select("score")
      .eq("user_id", context.userId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    const best = prev?.score ?? 0;
    if (data.score <= best) return { inserted: false, best };

    const { error: insErr } = await context.supabase
      .from("leaderboard")
      .insert({ user_id: context.userId, score: data.score });
    if (insErr) throw new Error(insErr.message);
    return { inserted: true, best: data.score };
  });
