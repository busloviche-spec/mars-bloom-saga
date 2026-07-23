import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Crown, RefreshCw, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getLeaderboardPage, type LeaderRow } from "@/lib/leaderboard.functions";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Глобальный рейтинг · Марсианская теплица" },
      {
        name: "description",
        content:
          "ТОП-50 лучших агрономов Марсианской теплицы. Побей личный рекорд и поднимись в глобальном рейтинге.",
      },
      { property: "og:title", content: "Глобальный рейтинг · Марсианская теплица" },
      {
        property: "og:description",
        content: "Лидеры космических огородников со всей Галактики.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Не удалось загрузить рейтинг.
        </p>
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Повторить
        </Button>
      </div>
    );
  },
  component: LeaderboardPage,
});

const PAGE = 50;

function LeaderboardPage() {
  const [pages, setPages] = useState<LeaderRow[][]>([]);
  const [offset, setOffset] = useState(0);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setMyId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["leaderboard", offset],
    queryFn: () => getLeaderboardPage({ data: { limit: PAGE, offset } }),
  });

  useEffect(() => {
    if (data) {
      setPages((prev) => {
        const idx = Math.floor(offset / PAGE);
        const next = [...prev];
        next[idx] = data.items;
        return next;
      });
    }
  }, [data, offset]);

  const items = pages.flat();
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="relative min-h-screen bg-[color:var(--space-bg)] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="stars absolute inset-0" />
      </div>
      <main className="relative mx-auto max-w-2xl p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[color:var(--neon-cyan)] hover:underline"
          >
            <ArrowLeft className="size-4" />
            В теплицу
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPages([]);
              setOffset(0);
              refetch();
            }}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>

        <header className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <Trophy className="size-10 text-[color:var(--neon-lime)]" />
          </div>
          <h1 className="font-display text-3xl">Глобальный рейтинг</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Лучшие агрономы Марсианской теплицы
          </p>
          {!myId && (
            <div className="mt-3">
              <Link to="/auth">
                <Button size="sm" variant="outline">
                  Войти, чтобы попасть в топ
                </Button>
              </Link>
            </div>
          )}
        </header>

        {isLoading && !items.length ? (
          <ol className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="h-12 animate-pulse rounded-xl border border-white/5 bg-[color:var(--space-panel)]/40"
              />
            ))}
          </ol>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Пока никто не отправил рекорд. Будь первым!
          </p>
        ) : (
          <ol className="space-y-2">
            {items.map((row) => {
              const isMe = myId === row.user_id;
              return (
                <li
                  key={`${row.user_id}-${row.created_at}`}
                  ref={(el) => {
                    if (el && isMe) {
                      // scroll into view on first render
                      requestAnimationFrame(() =>
                        el.scrollIntoView({ block: "center", behavior: "smooth" }),
                      );
                    }
                  }}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    isMe
                      ? "border-[color:var(--neon-cyan)] bg-[color:var(--neon-cyan)]/10 shadow-[0_0_18px_-6px_var(--neon-cyan)]"
                      : "border-white/5 bg-[color:var(--space-panel)]/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="grid size-9 place-items-center rounded-full font-display text-sm"
                      style={{
                        background:
                          row.rank === 1
                            ? "color-mix(in oklab, var(--neon-lime) 30%, transparent)"
                            : row.rank === 2
                              ? "color-mix(in oklab, var(--neon-cyan) 25%, transparent)"
                              : row.rank === 3
                                ? "color-mix(in oklab, var(--neon-magenta) 25%, transparent)"
                                : "rgba(255,255,255,0.05)",
                      }}
                    >
                      {row.rank === 1 ? (
                        <Crown className="size-4 text-yellow-300" />
                      ) : (
                        row.rank
                      )}
                    </span>
                    <span className="font-medium">
                      {row.nickname}
                      {isMe && (
                        <span className="ml-2 text-xs text-[color:var(--neon-cyan)]">
                          (ты)
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="font-display tabular-nums text-[color:var(--neon-lime)]">
                    {row.score}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setOffset((o) => o + PAGE)}
              disabled={isFetching}
            >
              {isFetching ? "Загрузка..." : "Загрузить ещё"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
