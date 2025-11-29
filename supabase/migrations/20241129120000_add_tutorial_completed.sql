-- Add tutorial_completed field to profiles table
alter table public.profiles
add column if not exists tutorial_completed boolean default false;
