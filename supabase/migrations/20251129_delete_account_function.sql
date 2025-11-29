-- Create function to allow users to delete their own account
-- This will cascade delete all related data due to ON DELETE CASCADE constraints

create or replace function public.delete_own_account()
returns void as $$
begin
  -- Verify user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete the user from auth.users
  -- This will cascade to profiles and all related tables
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.delete_own_account() to authenticated;
