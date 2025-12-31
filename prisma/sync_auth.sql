-- One-off SQL you can run in Supabase SQL editor to backfill and create trigger
-- Backfill existing auth.users into app "User" table
INSERT INTO "User" (id, email, name, "createdAt")
SELECT 
  id, 
  email, 
  COALESCE(
    (raw_user_meta_data->>'full_name')::text,
    TRIM(COALESCE(raw_user_meta_data->>'firstName', '') || ' ' || COALESCE(raw_user_meta_data->>'lastName', ''))
  ),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Function to keep auth.users and public."User" in sync
CREATE OR REPLACE FUNCTION public.sync_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Try to get full_name first, otherwise combine firstName and lastName
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'lastName', ''))
  );
  
  INSERT INTO "User" (id, email, name, "createdAt")
  VALUES (NEW.id, NEW.email, NULLIF(user_name, ''), NEW.created_at)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), "User".name);
  RETURN NEW;
END;
$$;

-- Trigger to call sync function after a new auth user is created
DROP TRIGGER IF EXISTS sync_auth_user_insert ON auth.users;
CREATE TRIGGER sync_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user();
