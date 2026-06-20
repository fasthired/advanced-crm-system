-- Admin oversight and worker account-control upgrade.
-- Run this in the Supabase SQL Editor after the existing supabase-setup.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

UPDATE public.users
SET account_status = 'active'
WHERE account_status IS NULL;

-- Keep exactly one platform admin. This is the current admin account in this CRM.
UPDATE public.users
SET role = 'user'
WHERE role = 'admin'
  AND lower(email) <> lower('f.hiredandtravels@gmail.com');

UPDATE public.users
SET role = 'admin',
    account_status = 'active',
    full_name = COALESCE(full_name, 'Admin User')
WHERE lower(email) = lower('f.hiredandtravels@gmail.com');

DO $$
BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'disabled', 'banned', 'removed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_idx
  ON public.users ((role))
  WHERE role = 'admin';

-- Prevent profile deletion from the app, SQL editor accidents, or auth cascade.
CREATE OR REPLACE FUNCTION public.prevent_user_profile_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'User accounts cannot be permanently deleted. Set account_status instead.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_profile_delete_trigger ON public.users;
CREATE TRIGGER prevent_user_profile_delete_trigger
  BEFORE DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_profile_delete();

-- Stop auth.users deletion from cascading into public user profiles.
DO $$
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
  ALTER TABLE public.users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;
END $$;

-- Stop deleting a user from deleting their CRM history.
DO $$
BEGIN
  ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_user_id_fkey;
  ALTER TABLE public.calls
    ADD CONSTRAINT calls_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_user_id_fkey;
  ALTER TABLE public.follow_ups
    ADD CONSTRAINT follow_ups_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
  ALTER TABLE public.reminders
    ADD CONSTRAINT reminders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
  ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
  ALTER TABLE public.activities
    ADD CONSTRAINT activities_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

  ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_user_id_fkey;
  ALTER TABLE public.analytics
    ADD CONSTRAINT analytics_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND account_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_account(user_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_uuid
      AND account_status = 'active'
  );
$$;

-- Users table policies: admins can see/manage workers; workers can see/update only themselves.
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view active own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update active own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update workers" ON public.users;

CREATE POLICY "Users can view active own profile" ON public.users
  FOR SELECT USING (auth.uid() = id AND public.is_active_account(id));

CREATE POLICY "Users can update active own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id AND public.is_active_account(id))
  WITH CHECK (auth.uid() = id AND role <> 'admin' AND account_status = 'active');

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update workers" ON public.users
  FOR UPDATE USING (public.is_admin() AND role <> 'admin')
  WITH CHECK (role <> 'admin');

-- Admin read access across all records. Workers remain limited to their own active account.
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers" ON public.customers
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all calls" ON public.calls;
CREATE POLICY "Admins can view all calls" ON public.calls
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all follow-ups" ON public.follow_ups;
CREATE POLICY "Admins can view all follow-ups" ON public.follow_ups
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all reminders" ON public.reminders;
CREATE POLICY "Admins can view all reminders" ON public.reminders
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
CREATE POLICY "Admins can view all tasks" ON public.tasks
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all activities" ON public.activities;
CREATE POLICY "Admins can view all activities" ON public.activities
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;
CREATE POLICY "Admins can view all analytics" ON public.analytics
  FOR SELECT USING (public.is_admin());

-- Rebuild worker policies so inactive accounts cannot keep using old tokens.
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can insert customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id AND public.is_active_account(user_id))
  WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can insert calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON public.calls;
CREATE POLICY "Users can view their own calls" ON public.calls
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can insert calls" ON public.calls
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can update their own calls" ON public.calls
  FOR UPDATE USING (auth.uid() = user_id AND public.is_active_account(user_id))
  WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own follow-ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can insert follow-ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update their own follow-ups" ON public.follow_ups;
CREATE POLICY "Users can view their own follow-ups" ON public.follow_ups
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can insert follow-ups" ON public.follow_ups
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can update their own follow-ups" ON public.follow_ups
  FOR UPDATE USING (auth.uid() = user_id AND public.is_active_account(user_id))
  WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
CREATE POLICY "Users can view their own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can insert reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can update their own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id AND public.is_active_account(user_id))
  WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id AND public.is_active_account(user_id))
  WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id AND public.is_active_account(user_id))
  WITH CHECK (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));

DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics;
CREATE POLICY "Users can view their own analytics" ON public.analytics
  FOR SELECT USING (auth.uid() = user_id AND public.is_active_account(user_id));

-- Remove worker-side permanent delete permissions.
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can delete their own follow-ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
