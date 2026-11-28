-- Phase 1: real user accounts on top of the anonymous device-id pipeline.
-- workout_history gains a user_id (FK to auth.users); RLS is re-keyed from the
-- open anon device_id policies to strict authenticated user_id ones, so the
-- anon key can no longer read or write any history. device_id stays as source
-- metadata (and as the claim key: a fresh account adopts the anonymous device's
-- rows on first login).

ALTER TABLE public.workout_history
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS workout_history_user_id_idx
  ON public.workout_history (user_id);

-- Remove the effectively-open anonymous policies.
DROP POLICY IF EXISTS "anon_insert_own_device" ON public.workout_history;
DROP POLICY IF EXISTS "anon_read_own_device" ON public.workout_history;

-- Strict per-user policies: each authenticated user sees only their own rows.
DROP POLICY IF EXISTS "authenticated_select_own_history" ON public.workout_history;
CREATE POLICY "authenticated_select_own_history" ON public.workout_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "authenticated_insert_own_history" ON public.workout_history;
CREATE POLICY "authenticated_insert_own_history" ON public.workout_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "authenticated_update_own_history" ON public.workout_history;
CREATE POLICY "authenticated_update_own_history" ON public.workout_history
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "authenticated_delete_own_history" ON public.workout_history;
CREATE POLICY "authenticated_delete_own_history" ON public.workout_history
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
