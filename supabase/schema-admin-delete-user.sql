-- QuickBuild: full user deletion for admins
-- Run this once in the Supabase SQL editor, after schema-admin-users.sql.
--
-- The app only has an anon key (see src/lib/supabase/server.ts), so it can't
-- call Supabase's admin API (auth.admin.deleteUser) directly, which normally
-- needs a service-role key. Instead this defines a SECURITY DEFINER function
-- that deletes straight from auth.users — the function runs with the
-- privileges of the postgres role that created it (in the SQL editor), which
-- can write to the auth schema, the same trick public.is_admin() and the
-- other admin_* functions already use to avoid needing a service-role key
-- anywhere in app code.

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select email into target_email from public.profiles where id = target_user_id;

  if target_email is null then
    raise exception 'user not found';
  end if;

  if target_email = (auth.jwt() ->> 'email') then
    raise exception 'cannot delete your own account';
  end if;

  -- Not strictly required (deleting the auth.users row below cascades to
  -- profiles/builds/shared_builds via their FKs), but admins is keyed on
  -- email rather than id, so it wouldn't be cleaned up by that cascade.
  delete from public.admins where email = target_email;

  -- profiles.id and builds.user_id both have "on delete cascade" back to
  -- auth.users, so this one delete clears the account and their saved
  -- builds. (shared_builds isn't tied to a user at all — those snapshots
  -- are anonymous by design and are unaffected either way.)
  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;