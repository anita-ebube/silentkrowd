-- ============================================================================
-- 0013_gallery_images.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Gallery images table
-- ----------------------------------------------------------------------------

create table gallery_images (
  id         uuid primary key default gen_random_uuid(),
  src        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table gallery_images enable row level security;

-- Public read access
create policy "gallery_images_public_read"
  on gallery_images for select
  using (true);

-- Admin-only write access
create policy "gallery_images_admin_insert"
  on gallery_images for insert
  with check (is_admin());

create policy "gallery_images_admin_update"
  on gallery_images for update
  using (is_admin());

create policy "gallery_images_admin_delete"
  on gallery_images for delete
  using (is_admin());

-- Updated_at trigger
create or replace function update_gallery_images_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger gallery_images_updated_at
  before update on gallery_images
  for each row
  execute function update_gallery_images_updated_at();

-- ----------------------------------------------------------------------------
-- Storage bucket for gallery images
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

-- Public read (images served as <img src>)
create policy "gallery_images_storage_public_read"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

-- Admin-only write
create policy "gallery_images_storage_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'gallery-images' and is_admin());

create policy "gallery_images_storage_admin_update"
  on storage.objects for update
  using (bucket_id = 'gallery-images' and is_admin());

create policy "gallery_images_storage_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'gallery-images' and is_admin());
