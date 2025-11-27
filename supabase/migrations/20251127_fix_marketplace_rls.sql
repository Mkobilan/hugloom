-- Allow authenticated users to insert marketplace items
create policy "Users can insert marketplace items"
on marketplace_items for insert
with check ( auth.uid() = seller_id );

-- Allow users to update their own marketplace items
create policy "Users can update own marketplace items"
on marketplace_items for update
using ( auth.uid() = seller_id );

-- Allow users to delete their own marketplace items
create policy "Users can delete own marketplace items"
on marketplace_items for delete
using ( auth.uid() = seller_id );
