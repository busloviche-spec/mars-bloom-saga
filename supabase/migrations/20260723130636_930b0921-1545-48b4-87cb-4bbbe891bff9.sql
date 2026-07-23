
CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leaderboard TO anon;
GRANT SELECT, INSERT ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard public read"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users insert own score"
  ON public.leaderboard FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX leaderboard_score_created_idx
  ON public.leaderboard (score DESC, created_at ASC);

CREATE INDEX leaderboard_user_id_idx
  ON public.leaderboard (user_id);
