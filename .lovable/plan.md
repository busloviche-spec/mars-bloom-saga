
## Цель

Перевести игру в марсианскую эстетику с настоящим 3D-фоном (поверхность Марса + теплица), добавить онлайн-лидерборд, обучение (онбординг + кнопка «?»), тултипы на иконках климата и расширенное описание изо-боксов.

## 1. Марсианская тема (цвета)

`src/styles.css`:
- Заменить космо-палитру (cyan/magenta/lime) на марсианскую: `--mars-bg` (#1a0a08 тёмно-бордовый), `--mars-panel` (#2a1310), `--mars-panel-deep` (#180806), `--mars-rust` (#c1440e медно-красный акцент), `--mars-copper` (#e07a3c), `--mars-amber` (#f4a261), `--mars-glow` (#ff6b3d).
- Переопределить semantic tokens: `--primary` = rust, `--accent` = copper, `--foreground` оставить светлым (тёплый кремовый `oklch(0.96 0.02 60)`) для читаемости.
- Заменить все прежние переменные `--space-bg`, `--space-panel*`, `--neon-cyan/magenta/lime` на новые (алиасы к марсианским), чтобы не переписывать десятки классов в компонентах. Обновить `.stars` (пыль) на приглушённо-оранжевый оттенок.
- Проверить читаемость: заголовки — кремовый, вторичный текст — `oklch(0.78 0.05 40)`, ссылки/акценты — copper/amber.
- Тосты (sonner) — тёмно-бордовый фон, светлый текст.

## 2. 3D-сцена Марса (react-three-fiber)

Установить: `three`, `@react-three/fiber`, `@react-three/drei`.

Новый файл `src/components/game/MarsScene.tsx`:
- `<Canvas>` фиксированный фон (position: fixed, z-index -1, `pointer-events-none`) под всей игрой.
- Марсианская поверхность: большая `PlaneGeometry` (200×200, много сегментов) с процедурной высотой через шум → небольшие кратеры (углубления по радиусу). Материал — `meshStandardMaterial` с текстурой цвета медно-красного (можно процедурно градиентом на vertex colors, без внешних ассетов).
- Кратеры: 8–12 круглых углублений на плоскости (модификация Y вершин по расстоянию до центра кратера), плюс кольцевой ободок.
- Небо: `<color>` для тёмно-ржавого + звёздная пыль через `<Stars>` из drei (приглушённые).
- Теплица: центр сцены, стеклянный купол — полупрозрачная `SphereGeometry` (половина), внутри 3×2 сетка «изо-боксов» — маленькие светящиеся кубы с эмиссией цвета в зависимости от количества посаженного (визуальный декор, не интерактив).
- Медленное вращение камеры (OrbitControls отключён, авто-lerp) для параллакса.
- Освещение: тёплый directional (солнце), слабый ambient красноватый, лёгкий rim light.
- Производительность: `dpr={[1, 1.5]}`, `frameloop="demand"` не подходит из-за анимации — оставить `always`, но простая геометрия.

Подключить `<MarsScene />` в `src/components/game/GreenhouseGame.tsx` вместо старых декоративных `<div class="stars">` слоёв.

## 3. Онлайн-лидерборд (Lovable Cloud)

Включить Cloud (`supabase--enable`) — появятся миграции и auth.

### Схема БД (миграция)
- Enum `app_role` не нужен (ролей нет).
- Таблица `profiles`: `id uuid PK → auth.users(id)`, `username text unique`, `created_at`. Триггер на `auth.users` INSERT → создаёт profile с username из metadata.
- Таблица `scores`: `id uuid PK`, `user_id uuid → auth.users`, `username text` (денормализация для быстрых чтений), `points int`, `credits int`, `stars_earned int`, `created_at`. Индекс по `points desc`.
- GRANTS: `SELECT` для `anon` + `authenticated` на `scores` и `profiles.username`; `INSERT/UPDATE` — только `authenticated` на свои записи.
- RLS: `scores` — публичное чтение, INSERT только `auth.uid() = user_id`, UPDATE только своих (для «обновить рекорд»); `profiles` — публичное чтение, UPDATE своих.

### Аутентификация
- Email/password + Google (через `configure_social_auth`). Обязательный `_authenticated/` layout уже управляется интеграцией.
- Публичные страницы: `/` (игра играбельна анонимно, локальные рекорды), `/auth` (вход/регистрация). Онлайн-лидерборд читается без входа, отправка результата — только для вошедших.

### Компоненты
- `src/components/game/LeaderboardDialog.tsx` — добавить вкладки «Локальный» / «Онлайн». Вкладка «Онлайн» показывает топ-50 из `scores` через `useSuspenseQuery` + серверную функцию `getGlobalLeaderboard` (публичный SUPABASE_PUBLISHABLE_KEY клиент).
- Новая кнопка «Отправить рекорд» — доступна только вошедшим, вызывает `submitScore` (защищённая server fn с `requireSupabaseAuth`), делает upsert текущего лучшего результата игрока.
- Кнопка «Войти» в `TopBar` (если не вошёл) → ведёт на `/auth`; если вошёл — аватар/имя + «Выйти».

### Серверные функции
- `src/lib/leaderboard.functions.ts`:
  - `getGlobalLeaderboard` — публичная, без middleware, читает через publishable-key клиент, топ-50.
  - `submitScore` — `requireSupabaseAuth`, апсерт в `scores` по `user_id`, хранит максимум.
- `src/routes/auth.tsx` — простая страница входа/регистрации (email+password, кнопка «Войти через Google» через `lovable.auth.signInWithOAuth`).

## 4. Обучение и подсказки

### Мини-инструкция (модалка)
- Новый компонент `src/components/game/HelpDialog.tsx` — большая модалка с разделами: «Цель игры», «Изо-боксы и климат», «Растения и апгрейды», «Червь-вредитель», «Сундуки (ИИ)», «Катаклизмы», «Звёзды и разблокировки». Кнопка `?` в `TopBar` открывает её в любой момент.

### Онбординг для новичков
- Пакет: `driver.js` (лёгкий, без зависимостей от React) — 6–7 шагов: показать TopBar (кредиты/очки/звёзды), изо-бокс (клик → посадить), апгрейд бокса, магазин семян (замки), сундуки, кнопка «?».
- Флаг `onboardingCompleted` в zustand store (persist). При первом заходе автозапуск; после — доступ через «?» → «Пройти обучение снова».

### Тултипы на иконках климата
- В `src/components/game/ClimateControls.tsx` обернуть каждую иконку 🌡 💧 🫧 в `<Tooltip>` (shadcn), с текстом:
  - Температура: «Идеальный диапазон зависит от растения. Отклонение снижает настроение и скорость роста.»
  - Влажность: «Влажность воздуха 0–100%. Слишком сухо — растение вянет, слишком влажно — гниёт.»
  - Кислород: «Уровень O₂ 0–100%. Нужен для дыхания корней; влияет на здоровье растения.»
- Также расширить подпись в `GreenhouseGame.tsx` (блок «🧪 Изо-боксы…»): добавить компактные пояснения 🌡/💧/🫧 прямо в тексте, плюс ссылку «Подробнее» → открывает `HelpDialog`.

## Технические детали

- **3D** рендерится в отдельном `<Canvas>` фоном; UI игры остаётся 2D поверх (HTML), чтобы клики/тултипы/диалоги работали без изменений в геймплее.
- **Cloud auth**: генерация OAuth Google — через `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`. `redirect_uri` — публичная страница `/`.
- **Server function** для чтения топа — публичная, серверный publishable client + узкая `TO anon SELECT` политика.
- **Sonner**: адаптировать theme через CSS переменные (уже подхватит `--background`/`--foreground`).
- **Локальные рекорды** остаются, лишь добавляется вкладка/секция «Онлайн».
- **driver.js** подключается только на клиенте (dynamic import при первом использовании).

## Файлы

Новые:
- `src/components/game/MarsScene.tsx` — 3D сцена Марса + теплица
- `src/components/game/HelpDialog.tsx` — модалка правил
- `src/components/game/AuthButton.tsx` — вход/выход в TopBar
- `src/components/game/onboarding.ts` — конфиг driver.js шагов
- `src/lib/leaderboard.functions.ts` — server fns
- `src/routes/auth.tsx` — страница входа/регистрации
- Миграция БД: `profiles`, `scores`, RLS, GRANTs, триггер

Изменяются:
- `src/styles.css` — марсианская палитра, читаемость, звёзды-пыль
- `src/components/game/GreenhouseGame.tsx` — подключение MarsScene, расширенный блок «Изо-боксы», HelpDialog trigger
- `src/components/game/TopBar.tsx` — кнопки «?» и Auth
- `src/components/game/ClimateControls.tsx` — тултипы на иконках
- `src/components/game/LeaderboardDialog.tsx` — вкладки локальный/онлайн, «Отправить рекорд»
- `src/game/store.ts` — флаг `onboardingCompleted`, action `submitScoreOnline`
- `src/routes/__root.tsx` — `onAuthStateChange` подписка

Никаких изменений в игровой логике (спавн, урон, награды, сундуки, звёзды).
