-- workout_history: anonymous device-keyed workout log (no login).
-- Each device generates a UUID stored in localStorage and sends it as device_id.
-- RLS is enabled; policies allow the anon role to read/write rows for any
-- device_id (the app is login-free by design — the device ID is the key).

CREATE TABLE IF NOT EXISTS public.workout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  date TEXT NOT NULL,
  day_id TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  volume INTEGER NOT NULL DEFAULT 0,
  feel TEXT,
  joint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_history_device_date_idx
  ON public.workout_history (device_id, date DESC);

ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_own_device" ON public.workout_history;
CREATE POLICY "anon_read_own_device" ON public.workout_history
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_own_device" ON public.workout_history;
CREATE POLICY "anon_insert_own_device" ON public.workout_history
  FOR INSERT TO anon WITH CHECK (true);
