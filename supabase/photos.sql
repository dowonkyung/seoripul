-- Run after schema.sql. Existing news tables and files are not changed.
begin;
create table if not exists public.seoripul_photo_posts (
  id uuid primary key default gen_random_uuid(),
  board_type text not null check (board_type in ('photo')),
  shot_date text not null default '' check (char_length(shot_date)<=100),
  thumbnail_path text,
  summary text not null default '' check (char_length(summary)<=500),
  title text not null check (char_length(title) between 1 and 200),
  department text not null check (char_length(department) between 1 and 100),
  body_html text not null default '' check (octet_length(body_html)<=1048576),
  body_text text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  views integer not null default 0 check (views>=0)
);
-- Expand the category check on projects that already created these tables.
alter table public.seoripul_photo_posts drop constraint if exists photo_posts_board_type_check;
alter table public.seoripul_photo_posts add constraint photo_posts_board_type_check check (board_type in ('photo'));
create index if not exists seoripul_photo_posts_published_date on public.seoripul_photo_posts(status,created_at desc);
alter table public.seoripul_photo_posts enable row level security;
grant select on public.seoripul_photo_posts to anon, authenticated;
grant insert, update, delete on public.seoripul_photo_posts to authenticated;
drop policy if exists photo_posts_read on public.seoripul_photo_posts;
drop policy if exists photo_posts_insert on public.seoripul_photo_posts;
drop policy if exists photo_posts_update on public.seoripul_photo_posts;
drop policy if exists photo_posts_delete on public.seoripul_photo_posts;
create policy photo_posts_read on public.seoripul_photo_posts for select to anon,authenticated using (status='published' or (select public.is_news_admin()));
create policy photo_posts_insert on public.seoripul_photo_posts for insert to authenticated with check ((select public.is_news_admin()) and author_id=(select auth.uid()));
create policy photo_posts_update on public.seoripul_photo_posts for update to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));
create policy photo_posts_delete on public.seoripul_photo_posts for delete to authenticated using ((select public.is_news_admin()));

create table if not exists public.seoripul_photo_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.seoripul_photo_posts(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime text not null default 'application/octet-stream',
  size bigint not null check (size>=0 and size<=20971520),
  kind text not null check (kind in ('attachment','inline','preview','thumbnail')),
  preview_path text,
  created_at timestamptz not null default now()
);
create index if not exists seoripul_photo_assets_post on public.seoripul_photo_assets(post_id);
alter table public.seoripul_photo_assets enable row level security;
grant select on public.seoripul_photo_assets to anon, authenticated;
grant insert, update, delete on public.seoripul_photo_assets to authenticated;
drop policy if exists photo_assets_read on public.seoripul_photo_assets;
drop policy if exists photo_assets_write on public.seoripul_photo_assets;
create policy photo_assets_read on public.seoripul_photo_assets for select to anon,authenticated using (
  (select public.is_news_admin()) or exists(select 1 from public.seoripul_photo_posts p where p.id=post_id and p.status='published')
);
create policy photo_assets_write on public.seoripul_photo_assets for all to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));

insert into storage.buckets(id,name,public,file_size_limit) values ('seoripul-photo-files','seoripul-photo-files',false,20971520)
on conflict (id) do update set public=false,file_size_limit=20971520;
drop policy if exists seoripul_photo_files_read on storage.objects;
drop policy if exists seoripul_photo_files_insert on storage.objects;
drop policy if exists seoripul_photo_files_delete on storage.objects;
create policy seoripul_photo_files_read on storage.objects for select to anon,authenticated using (
  bucket_id='seoripul-photo-files' and ((select public.is_news_admin()) or exists (
    select 1 from public.seoripul_photo_assets a join public.seoripul_photo_posts p on p.id=a.post_id
    where a.storage_path=name and p.status='published'
  ))
);
create policy seoripul_photo_files_insert on storage.objects for insert to authenticated with check (
  bucket_id='seoripul-photo-files' and (select public.is_news_admin()) and split_part(name,'/',1)=(select auth.uid())::text
);
create policy seoripul_photo_files_delete on storage.objects for delete to authenticated using (bucket_id='seoripul-photo-files' and (select public.is_news_admin()));

create or replace function public.seoripul_record_photo_view(post_uuid uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare result integer;
begin
  update public.seoripul_photo_posts set views=views+1 where id=post_uuid and status='published' returning views into result;
  return result;
end;
$$;
revoke all on function public.seoripul_record_photo_view(uuid) from public;
grant execute on function public.seoripul_record_photo_view(uuid) to anon,authenticated;


create index if not exists seoripul_photo_posts_board_date on public.seoripul_photo_posts(board_type,status,created_at desc);
commit;
