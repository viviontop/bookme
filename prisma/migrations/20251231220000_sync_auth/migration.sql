-- Backfill existing auth.users into app "User" table
INSERT INTO "User" (id, email, name, "createdAt")
SELECT id, email, (user_metadata->>'full_name')::text, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Function to keep auth.users and public."User" in sync
CREATE OR REPLACE FUNCTION public.sync_auth_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "User" (id, email, name, "createdAt")
  VALUES (NEW.id, NEW.email, NEW.user_metadata->>'full_name', NEW.created_at)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, "User".name);
  RETURN NEW;
END;
$$;

-- Trigger to call sync function after a new auth user is created
DROP TRIGGER IF EXISTS sync_auth_user_insert ON auth.users;
CREATE TRIGGER sync_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user();
