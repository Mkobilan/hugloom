-- Add new columns to marketplace_items
alter table public.marketplace_items 
add column if not exists condition text,
add column if not exists delivery_options jsonb default '[]'::jsonb;

-- Create storage bucket for marketplace images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('marketplace-images', 'marketplace-images', true)
on conflict (id) do nothing;

-- Allow public access to marketplace images
create policy "Marketplace images are publicly accessible"
on storage.objects for select
using ( bucket_id = 'marketplace-images' );

-- Allow authenticated users to upload marketplace images
create policy "Users can upload marketplace images"
on storage.objects for insert
with check ( bucket_id = 'marketplace-images' and auth.role() = 'authenticated' );

-- Allow users to update their own marketplace images
create policy "Users can update own marketplace images"
on storage.objects for update
using ( bucket_id = 'marketplace-images' and auth.uid() = owner );

-- Allow users to delete their own marketplace images
create policy "Users can delete own marketplace images"
on storage.objects for delete
using ( bucket_id = 'marketplace-images' and auth.uid() = owner );
