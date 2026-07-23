
## Обзор

Добавим глобальную таблицу лидеров с регистрацией игроков (email/пароль + Google), защищённой записью через RLS, публичным GET-эндпоинтом, страницей рейтинга с подсветкой текущего игрока и авто-отправкой только при побитии личного рекорда.

## Уточнение

Сейчас в проекте нет UI авторизации, но требование «user_id → зарегистрированный пользователь» подразумевает вход. Поставлю дефолт Lovable Cloud: **email/пароль + Google OAuth**. Если игрок не залогинен, кнопка «Отправить в топ» будет предлагать войти; локальный лидерборд на устройстве остаётся как есть.

Существующая таблица `scores` в БД дублирует функциональность, но по ТЗ нужна именно `leaderboard` — сделаю новую, `scores` не трогаю.

## 1. База данных (миграция)

Новая таблица `public.leaderboard`:
- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null references auth.users on delete cascade`
- `score integer not null check (score >= 0)`
- `created_at timestamptz not null default now()`
- Индекс `(score DESC, created_at ASC)` для сортировки топа.
- Индекс по `user_id` для быстрого чтения личного рекорда.

RLS:
- `SELECT` — всем (`anon`, `authenticated`), полный публичный read.
- `INSERT` — `authenticated`, `WITH CHECK (auth.uid() = user_id)`.
- `UPDATE`/`DELETE` — политики не создаём (запрещено всем).
- GRANT `SELECT` для `anon` и `authenticated`, `INSERT` только для `authenticated`, `ALL` для `service_role`.

Nickname/аватар возьмём из `public.profiles` через JOIN (там уже есть `username`; аватар пока `null`, поле в API отдадим опционально).

## 2. Авторизация

- Роут `src/routes/auth.tsx` — форма email/пароль (sign in / sign up) и кнопка «Войти через Google».
- Google провайдер настраиваю через `supabase--configure_social_auth`.
- В `__root.tsx` — подписка на `onAuthStateChange` (identity events) + `router.invalidate()`.
- `attachSupabaseAuth` уже в `src/start.ts` — проверю и при необходимости добавлю.

## 3. API-эндпоинт `/api/leaderboard`

Публичный TSS-роут `src/routes/api/public/leaderboard.ts` (GET):
- Query: `limit` (default 50, max 100), `offset` (default 0).
- Использует server publishable client (RLS, роль `anon`), безопасно для SSR.
- SQL:
  ```
  select l.score, l.created_at, l.user_id, p.username as nickname
  from leaderboard l
  left join profiles p on p.id = l.user_id
  order by l.score desc, l.created_at asc
  limit $1 offset $2
  ```
- Ответ: `{ items: [{ user_id, nickname, avatar_url: null, score, rank }], total, limit, offset }`.
- `rank` = `offset + index + 1`.
- CORS не нужен (same-origin), но добавлю `Cache-Control: no-store` для актуальности.

## 4. Server-функции для клиента

`src/lib/leaderboard.functions.ts`:
- `getLeaderboardPage({ limit, offset })` — обёртка чтения (для React Query).
- `getMyBestScore()` — `.middleware([requireSupabaseAuth])`, возвращает `max(score)` текущего юзера.
- `submitScore({ score })` — `.middleware([requireSupabaseAuth])`, читает личный рекорд и делает INSERT только если `score > best`. Возвращает `{ inserted: boolean, best: number }`.

## 5. UI — страница `/leaderboard`

`src/routes/leaderboard.tsx` (публичный роут, свой `head()`):
- Загрузка через TanStack Query: `useSuspenseQuery` в лоадере (`ensureQueryData`), пагинация `limit=50`, кнопка «Загрузить ещё» инкрементит offset и мёржит страницы.
- Скелетон-строки во время initial loading.
- Список строк: rank (иконка короны 👑 для #1, медали для #2/#3), nickname, score.
- Текущий пользователь (`supabase.auth.getUser` через клиентский хук): подсветка рамкой neon-cyan и якорь-скролл к своей строке.
- Кнопка «Обновить» → `queryClient.invalidateQueries(['leaderboard'])`.
- Ошибка (errorComponent): «Не удалось загрузить рейтинг» + retry.
- Кнопка «Войти» если анонимен.
- Ссылка на страницу — из `TopBar` (иконка Trophy рядом с локальным лидербордом) и из главного меню.

## 6. Интеграция с игрой (auto-submit)

- В `useGame` store: после каждого `harvest()` (или при `saveScoreToLeaderboard`) проверяем: если пользователь залогинен и `totalScore > lastSubmittedBest` (кешируется в сторе + подтверждается сервером через `getMyBestScore`), вызываем `submitScore({ score: totalScore })`.
- Дебаунс 3–5 сек, чтобы не спамить сервер при быстрых сборах подряд.
- Сохраняем `lastSubmittedBest` в persist-стор, чтобы не гонять RPC при каждом заходе.
- Toast «🏆 Новый личный рекорд: N — отправлен в глобальный топ».

## 7. Файлы

Новые:
- миграция `leaderboard` (через `supabase--migration`)
- `src/routes/auth.tsx`
- `src/routes/leaderboard.tsx`
- `src/routes/api/public/leaderboard.ts`
- `src/lib/leaderboard.functions.ts`
- `src/components/game/LeaderboardLink.tsx` (кнопка в TopBar)

Правки:
- `src/game/store.ts` — `lastSubmittedBest`, auto-submit хук.
- `src/components/game/TopBar.tsx` — кнопка перехода на `/leaderboard`.
- `src/components/game/GreenhouseGame.tsx` — вызов auto-submit после harvest, toast.
- `src/routes/__root.tsx` — `onAuthStateChange`.

## Технические детали

- Публичный чтение-эндпоинт использует publishable-key client в TSS-роуте, RLS-политика `SELECT TO anon` разрешает.
- Запись — через `createServerFn` + `requireSupabaseAuth`, так что `user_id = context.userId` не подделать.
- INSERT-only: проверка «лучше личного рекорда» делается на сервере в `submitScore`, чтобы клиент не мог насыпать записей с одинаковым низким счётом.
- SEO: у `/leaderboard` и `/auth` собственные `head()` c уникальными title/description/og.
- errorComponent + notFoundComponent на новых роутах с лоадером.

Скажи «ок» — начну реализацию.
