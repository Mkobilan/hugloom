-- Add onboarding fields to profiles table
alter table public.profiles
add column if not exists onboarding_completed boolean default false,
add column if not exists role text,
add column if not exists location text,
add column if not exists interests jsonb;
