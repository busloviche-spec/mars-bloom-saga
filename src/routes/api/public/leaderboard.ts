import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

export const Route = createFileRoute("/api/public/leaderboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(
          Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1),
          100,
        );
        const offset = Math.max(
          parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
          0,
        );
        const supabase = createPublicClient();
        const { data: rows, error } = await supabase
          .from("leaderboard")
          .select("user_id, score, created_at")
          .order("score", { ascending: false })
          .order("created_at", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
        const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
        let names: Record<string, string> = {};
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", ids);
          names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.username]));
        }
        const items = (rows ?? []).map((r, i) => ({
          user_id: r.user_id,
          nickname: names[r.user_id] ?? "Агроном",
          avatar_url: null,
          score: r.score,
          created_at: r.created_at,
          rank: offset + i + 1,
        }));
        return Response.json(
          { items, limit, offset, hasMore: items.length === limit },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
