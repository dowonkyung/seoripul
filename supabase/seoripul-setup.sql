-- Run this entire file ONCE in the EXISTING shared Supabase SQL Editor.
-- Creates only seoripul_* content; shared accounts and old posts are preserved.
begin;
do $$ begin if to_regprocedure('public.is_news_admin()') is null then raise exception 'Use the existing shared Supabase project'; end if; end $$;
create table if not exists public.seoripul_news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  department text not null check (char_length(department) between 1 and 100),
  body_html text not null default '' check (octet_length(body_html)<=1048576),
  body_text text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  views integer not null default 0 check (views>=0)
);
create index if not exists seoripul_news_posts_published_date on public.seoripul_news_posts(status,created_at desc);
alter table public.seoripul_news_posts enable row level security;
grant select on public.seoripul_news_posts to anon, authenticated;
grant insert, update, delete on public.seoripul_news_posts to authenticated;
drop policy if exists news_posts_read on public.seoripul_news_posts;
drop policy if exists news_posts_insert on public.seoripul_news_posts;
drop policy if exists news_posts_update on public.seoripul_news_posts;
drop policy if exists news_posts_delete on public.seoripul_news_posts;
create policy news_posts_read on public.seoripul_news_posts for select to anon,authenticated using (status='published' or (select public.is_news_admin()));
create policy news_posts_insert on public.seoripul_news_posts for insert to authenticated with check ((select public.is_news_admin()) and author_id=(select auth.uid()));
create policy news_posts_update on public.seoripul_news_posts for update to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));
create policy news_posts_delete on public.seoripul_news_posts for delete to authenticated using ((select public.is_news_admin()));

create table if not exists public.seoripul_news_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.seoripul_news_posts(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime text not null default 'application/octet-stream',
  size bigint not null check (size>=0 and size<=20971520),
  kind text not null check (kind in ('attachment','inline','preview')),
  preview_path text,
  created_at timestamptz not null default now()
);
create index if not exists seoripul_news_assets_post on public.seoripul_news_assets(post_id);
alter table public.seoripul_news_assets enable row level security;
grant select on public.seoripul_news_assets to anon, authenticated;
grant insert, update, delete on public.seoripul_news_assets to authenticated;
drop policy if exists news_assets_read on public.seoripul_news_assets;
drop policy if exists news_assets_write on public.seoripul_news_assets;
create policy news_assets_read on public.seoripul_news_assets for select to anon,authenticated using (
  (select public.is_news_admin()) or exists(select 1 from public.seoripul_news_posts p where p.id=post_id and p.status='published')
);
create policy news_assets_write on public.seoripul_news_assets for all to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));

insert into storage.buckets(id,name,public,file_size_limit) values ('seoripul-news-files','seoripul-news-files',false,20971520)
on conflict (id) do update set public=false,file_size_limit=20971520;
drop policy if exists seoripul_news_files_read on storage.objects;
drop policy if exists seoripul_news_files_insert on storage.objects;
drop policy if exists seoripul_news_files_delete on storage.objects;
create policy seoripul_news_files_read on storage.objects for select to anon,authenticated using (
  bucket_id='seoripul-news-files' and ((select public.is_news_admin()) or exists (
    select 1 from public.seoripul_news_assets a join public.seoripul_news_posts p on p.id=a.post_id
    where a.storage_path=name and p.status='published'
  ))
);
create policy seoripul_news_files_insert on storage.objects for insert to authenticated with check (
  bucket_id='seoripul-news-files' and (select public.is_news_admin()) and split_part(name,'/',1)=(select auth.uid())::text
);
create policy seoripul_news_files_delete on storage.objects for delete to authenticated using (bucket_id='seoripul-news-files' and (select public.is_news_admin()));

create or replace function public.seoripul_record_news_view(post_uuid uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare result integer;
begin
  update public.seoripul_news_posts set views=views+1 where id=post_uuid and status='published' returning views into result;
  return result;
end;
$$;
revoke all on function public.seoripul_record_news_view(uuid) from public;
grant execute on function public.seoripul_record_news_view(uuid) to anon,authenticated;

-- After creating the admin account in Authentication > Users, run this separately:
-- insert into public.news_admins(user_id) values ('ADMIN-USER-UUID') on conflict do nothing;


-- Run after schema.sql. Existing news tables and files are not changed.

create table if not exists public.seoripul_notice_posts (
  id uuid primary key default gen_random_uuid(),
  board_type text not null check (board_type in ('notice','bid','legislation','general')),
  notice_kind text not null check (char_length(notice_kind) between 1 and 100),
  issue_name text not null default '' check (char_length(issue_name)<=200),
  notice_number text not null check (char_length(notice_number) between 1 and 200),
  period_start date,
  period_end date,
  check (period_start is null or period_end is null or period_start<=period_end),
  title text not null check (char_length(title) between 1 and 200),
  department text not null check (char_length(department) between 1 and 100),
  body_html text not null default '' check (octet_length(body_html)<=1048576),
  body_text text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  views integer not null default 0 check (views>=0)
);
create index if not exists seoripul_notice_posts_published_date on public.seoripul_notice_posts(status,created_at desc);
alter table public.seoripul_notice_posts enable row level security;
grant select on public.seoripul_notice_posts to anon, authenticated;
grant insert, update, delete on public.seoripul_notice_posts to authenticated;
drop policy if exists notice_posts_read on public.seoripul_notice_posts;
drop policy if exists notice_posts_insert on public.seoripul_notice_posts;
drop policy if exists notice_posts_update on public.seoripul_notice_posts;
drop policy if exists notice_posts_delete on public.seoripul_notice_posts;
create policy notice_posts_read on public.seoripul_notice_posts for select to anon,authenticated using (status='published' or (select public.is_news_admin()));
create policy notice_posts_insert on public.seoripul_notice_posts for insert to authenticated with check ((select public.is_news_admin()) and author_id=(select auth.uid()));
create policy notice_posts_update on public.seoripul_notice_posts for update to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));
create policy notice_posts_delete on public.seoripul_notice_posts for delete to authenticated using ((select public.is_news_admin()));

create table if not exists public.seoripul_notice_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.seoripul_notice_posts(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime text not null default 'application/octet-stream',
  size bigint not null check (size>=0 and size<=20971520),
  kind text not null check (kind in ('attachment','inline','preview')),
  preview_path text,
  created_at timestamptz not null default now()
);
create index if not exists seoripul_notice_assets_post on public.seoripul_notice_assets(post_id);
alter table public.seoripul_notice_assets enable row level security;
grant select on public.seoripul_notice_assets to anon, authenticated;
grant insert, update, delete on public.seoripul_notice_assets to authenticated;
drop policy if exists notice_assets_read on public.seoripul_notice_assets;
drop policy if exists notice_assets_write on public.seoripul_notice_assets;
create policy notice_assets_read on public.seoripul_notice_assets for select to anon,authenticated using (
  (select public.is_news_admin()) or exists(select 1 from public.seoripul_notice_posts p where p.id=post_id and p.status='published')
);
create policy notice_assets_write on public.seoripul_notice_assets for all to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));

insert into storage.buckets(id,name,public,file_size_limit) values ('seoripul-notice-files','seoripul-notice-files',false,20971520)
on conflict (id) do update set public=false,file_size_limit=20971520;
drop policy if exists seoripul_notice_files_read on storage.objects;
drop policy if exists seoripul_notice_files_insert on storage.objects;
drop policy if exists seoripul_notice_files_delete on storage.objects;
create policy seoripul_notice_files_read on storage.objects for select to anon,authenticated using (
  bucket_id='seoripul-notice-files' and ((select public.is_news_admin()) or exists (
    select 1 from public.seoripul_notice_assets a join public.seoripul_notice_posts p on p.id=a.post_id
    where a.storage_path=name and p.status='published'
  ))
);
create policy seoripul_notice_files_insert on storage.objects for insert to authenticated with check (
  bucket_id='seoripul-notice-files' and (select public.is_news_admin()) and split_part(name,'/',1)=(select auth.uid())::text
);
create policy seoripul_notice_files_delete on storage.objects for delete to authenticated using (bucket_id='seoripul-notice-files' and (select public.is_news_admin()));

create or replace function public.seoripul_record_notice_view(post_uuid uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare result integer;
begin
  update public.seoripul_notice_posts set views=views+1 where id=post_uuid and status='published' returning views into result;
  return result;
end;
$$;
revoke all on function public.seoripul_record_notice_view(uuid) from public;
grant execute on function public.seoripul_record_notice_view(uuid) to anon,authenticated;


create index if not exists seoripul_notice_posts_board_date on public.seoripul_notice_posts(board_type,status,created_at desc);


-- Run after schema.sql. Existing news tables and files are not changed.

create table if not exists public.seoripul_publication_posts (
  id uuid primary key default gen_random_uuid(),
  board_type text not null check (board_type in ('gazette','press','briefing','facts','activity','media')),
  contact text not null default '' check (char_length(contact)<=100),
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
alter table public.seoripul_publication_posts drop constraint if exists publication_posts_board_type_check;
alter table public.seoripul_publication_posts add constraint publication_posts_board_type_check check (board_type in ('gazette','press','briefing','facts','activity','media'));
create index if not exists seoripul_publication_posts_published_date on public.seoripul_publication_posts(status,created_at desc);
alter table public.seoripul_publication_posts enable row level security;
grant select on public.seoripul_publication_posts to anon, authenticated;
grant insert, update, delete on public.seoripul_publication_posts to authenticated;
drop policy if exists publication_posts_read on public.seoripul_publication_posts;
drop policy if exists publication_posts_insert on public.seoripul_publication_posts;
drop policy if exists publication_posts_update on public.seoripul_publication_posts;
drop policy if exists publication_posts_delete on public.seoripul_publication_posts;
create policy publication_posts_read on public.seoripul_publication_posts for select to anon,authenticated using (status='published' or (select public.is_news_admin()));
create policy publication_posts_insert on public.seoripul_publication_posts for insert to authenticated with check ((select public.is_news_admin()) and author_id=(select auth.uid()));
create policy publication_posts_update on public.seoripul_publication_posts for update to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));
create policy publication_posts_delete on public.seoripul_publication_posts for delete to authenticated using ((select public.is_news_admin()));

create table if not exists public.seoripul_publication_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.seoripul_publication_posts(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime text not null default 'application/octet-stream',
  size bigint not null check (size>=0 and size<=20971520),
  kind text not null check (kind in ('attachment','inline','preview','thumbnail')),
  preview_path text,
  created_at timestamptz not null default now()
);
create index if not exists seoripul_publication_assets_post on public.seoripul_publication_assets(post_id);
alter table public.seoripul_publication_assets enable row level security;
grant select on public.seoripul_publication_assets to anon, authenticated;
grant insert, update, delete on public.seoripul_publication_assets to authenticated;
drop policy if exists publication_assets_read on public.seoripul_publication_assets;
drop policy if exists publication_assets_write on public.seoripul_publication_assets;
create policy publication_assets_read on public.seoripul_publication_assets for select to anon,authenticated using (
  (select public.is_news_admin()) or exists(select 1 from public.seoripul_publication_posts p where p.id=post_id and p.status='published')
);
create policy publication_assets_write on public.seoripul_publication_assets for all to authenticated using ((select public.is_news_admin())) with check ((select public.is_news_admin()));

insert into storage.buckets(id,name,public,file_size_limit) values ('seoripul-publication-files','seoripul-publication-files',false,20971520)
on conflict (id) do update set public=false,file_size_limit=20971520;
drop policy if exists seoripul_publication_files_read on storage.objects;
drop policy if exists seoripul_publication_files_insert on storage.objects;
drop policy if exists seoripul_publication_files_delete on storage.objects;
create policy seoripul_publication_files_read on storage.objects for select to anon,authenticated using (
  bucket_id='seoripul-publication-files' and ((select public.is_news_admin()) or exists (
    select 1 from public.seoripul_publication_assets a join public.seoripul_publication_posts p on p.id=a.post_id
    where a.storage_path=name and p.status='published'
  ))
);
create policy seoripul_publication_files_insert on storage.objects for insert to authenticated with check (
  bucket_id='seoripul-publication-files' and (select public.is_news_admin()) and split_part(name,'/',1)=(select auth.uid())::text
);
create policy seoripul_publication_files_delete on storage.objects for delete to authenticated using (bucket_id='seoripul-publication-files' and (select public.is_news_admin()));

create or replace function public.seoripul_record_publication_view(post_uuid uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare result integer;
begin
  update public.seoripul_publication_posts set views=views+1 where id=post_uuid and status='published' returning views into result;
  return result;
end;
$$;
revoke all on function public.seoripul_record_publication_view(uuid) from public;
grant execute on function public.seoripul_record_publication_view(uuid) to anon,authenticated;


create index if not exists seoripul_publication_posts_board_date on public.seoripul_publication_posts(board_type,status,created_at desc);


-- Run after schema.sql. Existing news tables and files are not changed.

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


-- Run after schema.sql. Reuses the existing administrator check.

create table if not exists public.seoripul_video_posts (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 1 and 200),
 youtube_id text not null check(youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
 published_on date not null,
 views integer not null default 0 check(views>=0),
 created_at timestamptz not null default now()
);
create index if not exists seoripul_video_posts_date on public.seoripul_video_posts(published_on desc,created_at desc);
alter table public.seoripul_video_posts enable row level security;
grant select on public.seoripul_video_posts to anon,authenticated;
grant insert,update,delete on public.seoripul_video_posts to authenticated;
drop policy if exists video_posts_read on public.seoripul_video_posts;
create policy video_posts_read on public.seoripul_video_posts for select to anon,authenticated using(true);
drop policy if exists video_posts_write on public.seoripul_video_posts;
create policy video_posts_write on public.seoripul_video_posts for all to authenticated using((select public.is_news_admin())) with check((select public.is_news_admin()));
create or replace function public.seoripul_record_video_view(post_uuid uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare result integer;
begin
 update public.seoripul_video_posts set views=views+1 where id=post_uuid returning views into result;
 return result;
end;
$$;
revoke all on function public.seoripul_record_video_view(uuid) from public;
grant execute on function public.seoripul_record_video_view(uuid) to anon,authenticated;


-- Run after schema.sql in the Supabase SQL Editor.

create extension if not exists pgcrypto with schema extensions;
create table if not exists public.seoripul_community_posts (
 id uuid primary key default gen_random_uuid(),
 board_type text not null check(board_type in ('free','praise','civil-board')),
 title text not null check(char_length(title) between 1 and 200),
 author_mask text not null,
 body_html text not null check(octet_length(body_html)<=1048576),
 attachments jsonb not null default '[]',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists seoripul_community_posts_date on public.seoripul_community_posts(board_type,created_at desc);
create table if not exists public.seoripul_community_private (
 post_id uuid primary key references public.seoripul_community_posts(id) on delete cascade,
 author_name text not null, identity_kind text not null check(identity_kind in ('naver','minecraft')),
 identity_value text not null, pin_hash text not null,
 failed_attempts integer not null default 0, blocked_until timestamptz
);
create table if not exists public.seoripul_community_edit_tokens (
 token_hash bytea primary key, post_id uuid not null references public.seoripul_community_posts(id) on delete cascade,
 expires_at timestamptz not null
);
alter table public.seoripul_community_posts enable row level security;
alter table public.seoripul_community_private enable row level security;
alter table public.seoripul_community_edit_tokens enable row level security;
revoke all on public.seoripul_community_posts,public.seoripul_community_private,public.seoripul_community_edit_tokens from anon,authenticated;
grant select on public.seoripul_community_posts to anon,authenticated;
grant select(post_id,author_name,identity_kind,identity_value) on public.seoripul_community_private to authenticated;
drop policy if exists community_public_read on public.seoripul_community_posts;
create policy community_public_read on public.seoripul_community_posts for select to anon,authenticated using(true);
drop policy if exists community_admin_read on public.seoripul_community_private;
create policy community_admin_read on public.seoripul_community_private for select to authenticated using((select public.is_news_admin()));

create or replace function public.seoripul_community_validate(p_title text,p_body text,p_assets jsonb) returns void
language plpgsql set search_path='' as $$
declare a jsonb;
begin
 if char_length(btrim(coalesce(p_title,''))) not between 1 and 200 or char_length(btrim(coalesce(p_body,'')))=0 or octet_length(p_body)>1048576 then raise exception '제목과 본문을 확인해 주세요.'; end if;
 if p_assets is null or jsonb_typeof(p_assets)<>'array' then raise exception '첨부파일 형식이 올바르지 않습니다.';end if;
 if jsonb_array_length(p_assets)>10 or octet_length(p_assets::text)>7340032 then raise exception '첨부파일은 10개, 전체 5MB 이내로 등록해 주세요.';end if;
 for a in select value from jsonb_array_elements(p_assets) loop
  if jsonb_typeof(a)<>'object' or char_length(coalesce(a->>'name','')) not between 1 and 200 or coalesce(a->>'name','') !~* '\.(hwp|hwpx|pdf|png|jpg|jpeg|webp|gif|txt|doc|docx|xls|xlsx|ppt|pptx|zip)$' or coalesce(a->>'data','') !~ '^data:[a-zA-Z0-9.+/-]+;base64,[A-Za-z0-9+/]*={0,2}$' or char_length(a->>'data')>2796500 then raise exception '지원하지 않는 첨부파일이거나 파일당 2MB를 초과했습니다.';end if;
 end loop;
end $$;
revoke all on function public.seoripul_community_validate(text,text,jsonb) from public,anon,authenticated;

create or replace function public.seoripul_community_create(p_board text,p_title text,p_author text,p_identity_kind text,p_identity text,p_pin text,p_body text,p_assets jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 perform public.seoripul_community_validate(p_title,p_body,p_assets);
 if p_board not in ('free','praise','civil-board') or p_author is null or char_length(btrim(p_author)) not between 1 and 40 or p_identity_kind not in ('naver','minecraft') or p_identity is null or char_length(btrim(p_identity)) not between 1 and 100 or p_pin is null or p_pin !~ '^[0-9]{4}$' then raise exception '작성자명, 네이버 아이디 또는 마인크래프트 닉네임, 4자리 비밀번호를 확인해 주세요.';end if;
 insert into public.seoripul_community_posts(board_type,title,author_mask,body_html,attachments) values(p_board,btrim(p_title),left(btrim(p_author),1)||repeat('*',greatest(char_length(btrim(p_author))-1,0)),p_body,p_assets) returning id into new_id;
 insert into public.seoripul_community_private(post_id,author_name,identity_kind,identity_value,pin_hash) values(new_id,btrim(p_author),p_identity_kind,btrim(p_identity),extensions.crypt(p_pin,extensions.gen_salt('bf',10)));
 return new_id;
end $$;

create or replace function public.seoripul_community_unlock(p_id uuid,p_pin text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare secret public.seoripul_community_private; token text; attempts integer;
begin
 select * into secret from public.seoripul_community_private where post_id=p_id for update;
 if not found then return jsonb_build_object('ok',false,'error','게시글을 찾을 수 없습니다.');end if;
 if not public.is_news_admin() then
  if secret.blocked_until>now() then return jsonb_build_object('ok',false,'error','인증 시도가 많습니다. 15분 후 다시 시도해 주세요.');end if;
  if p_pin is null or p_pin !~ '^[0-9]{4}$' or extensions.crypt(p_pin,secret.pin_hash)<>secret.pin_hash then
   attempts=case when secret.blocked_until is not null and secret.blocked_until<=now() then 1 else secret.failed_attempts+1 end;
   update public.seoripul_community_private set failed_attempts=attempts,blocked_until=case when attempts>=5 then now()+interval '15 minutes' else null end where post_id=p_id;
   return jsonb_build_object('ok',false,'error','비밀번호가 일치하지 않습니다. 5회 실패하면 15분간 제한됩니다.');
  end if;
 end if;
 update public.seoripul_community_private set failed_attempts=0,blocked_until=null where post_id=p_id;
 delete from public.seoripul_community_edit_tokens where expires_at<now();
 token=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.seoripul_community_edit_tokens values(extensions.digest(token,'sha256'),p_id,now()+interval '30 minutes');
 return jsonb_build_object('ok',true,'token',token);
end $$;

create or replace function public.seoripul_community_save(p_id uuid,p_token text,p_title text,p_body text,p_assets jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Lock the post so token checks and modifications cannot race deletion.
 perform 1 from public.seoripul_community_posts where id=p_id for update;
 if not found then raise exception '게시글을 찾을 수 없습니다.';end if;
 if not public.is_news_admin() and not exists(select 1 from public.seoripul_community_edit_tokens where post_id=p_id and token_hash=extensions.digest(coalesce(p_token,''),'sha256') and expires_at>now()) then raise exception '비밀번호를 다시 확인해 주세요.';end if;
 perform public.seoripul_community_validate(p_title,p_body,p_assets);
 update public.seoripul_community_posts set title=btrim(p_title),body_html=p_body,attachments=p_assets,updated_at=now() where id=p_id;
end $$;
create or replace function public.seoripul_community_delete(p_id uuid,p_token text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.seoripul_community_posts where id=p_id for update;
 if not found then raise exception '게시글을 찾을 수 없습니다.';end if;
 if not public.is_news_admin() and not exists(select 1 from public.seoripul_community_edit_tokens where post_id=p_id and token_hash=extensions.digest(coalesce(p_token,''),'sha256') and expires_at>now()) then raise exception '비밀번호를 다시 확인해 주세요.';end if;
 delete from public.seoripul_community_posts where id=p_id;
end $$;
revoke all on function public.seoripul_community_create(text,text,text,text,text,text,text,jsonb),public.seoripul_community_unlock(uuid,text),public.seoripul_community_save(uuid,text,text,text,jsonb),public.seoripul_community_delete(uuid,text) from public;
grant execute on function public.seoripul_community_create(text,text,text,text,text,text,text,jsonb),public.seoripul_community_unlock(uuid,text),public.seoripul_community_save(uuid,text,text,text,jsonb),public.seoripul_community_delete(uuid,text) to anon,authenticated;


-- Run after supabase/community.sql. Safe to run again; existing posts are preserved.

alter table public.seoripul_community_posts drop constraint if exists community_posts_board_type_check;
alter table public.seoripul_community_posts add constraint community_posts_board_type_check check(board_type in ('free','praise','civil-board'));
create or replace function public.seoripul_community_create(p_board text,p_title text,p_author text,p_identity_kind text,p_identity text,p_pin text,p_body text,p_assets jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 perform public.seoripul_community_validate(p_title,p_body,p_assets);
 if p_board not in ('free','praise','civil-board') or p_author is null or char_length(btrim(p_author)) not between 1 and 40 or p_identity_kind not in ('naver','minecraft') or p_identity is null or char_length(btrim(p_identity)) not between 1 and 100 or p_pin is null or p_pin !~ '^[0-9]{4}$' then raise exception '작성자명, 네이버 아이디 또는 마인크래프트 닉네임, 4자리 비밀번호를 확인해 주세요.';end if;
 insert into public.seoripul_community_posts(board_type,title,author_mask,body_html,attachments) values(p_board,btrim(p_title),left(btrim(p_author),1)||repeat('*',greatest(char_length(btrim(p_author))-1,0)),p_body,p_assets) returning id into new_id;
 insert into public.seoripul_community_private(post_id,author_name,identity_kind,identity_value,pin_hash) values(new_id,btrim(p_author),p_identity_kind,btrim(p_identity),extensions.crypt(p_pin,extensions.gen_salt('bf',10)));
 return new_id;
end $$;


create table if not exists public.seoripul_civil_replies(
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.seoripul_community_posts(id) on delete cascade,
 department text not null check(char_length(btrim(department)) between 1 and 100),
 body text not null check(char_length(btrim(body)) between 1 and 10000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists seoripul_civil_replies_post_date on public.seoripul_civil_replies(post_id,created_at,id);
alter table public.seoripul_civil_replies enable row level security;
revoke all on public.seoripul_civil_replies from anon,authenticated;
grant select on public.seoripul_civil_replies to anon,authenticated;
drop policy if exists civil_replies_read on public.seoripul_civil_replies;
create policy civil_replies_read on public.seoripul_civil_replies for select to anon,authenticated
 using(exists(select 1 from public.seoripul_community_posts p where p.id=post_id and p.board_type='civil-board'));
create or replace function public.seoripul_civil_reply_save(p_post_id uuid,p_reply_id uuid,p_department text,p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare saved_id uuid;
begin
 if auth.uid() is null or not coalesce(public.is_news_admin(),false) then raise exception '관리자만 답변을 작성할 수 있습니다.';end if;
 perform 1 from public.seoripul_community_posts where id=p_post_id and board_type='civil-board' for update;
 if not found then raise exception '민원 게시글을 찾을 수 없습니다.';end if;
 if p_department is null or char_length(btrim(p_department)) not between 1 and 100 or p_body is null or char_length(btrim(p_body)) not between 1 and 10000 then raise exception '담당 부서와 답변 내용을 확인해 주세요.';end if;
 if p_reply_id is null then
  insert into public.seoripul_civil_replies(post_id,department,body) values(p_post_id,btrim(p_department),btrim(p_body)) returning id into saved_id;
 else
  update public.seoripul_civil_replies set department=btrim(p_department),body=btrim(p_body),updated_at=now() where id=p_reply_id and post_id=p_post_id returning id into saved_id;
  if not found then raise exception '답변을 찾을 수 없습니다.';end if;
 end if;
 return saved_id;
end $$;
create or replace function public.seoripul_civil_reply_delete(p_post_id uuid,p_reply_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(public.is_news_admin(),false) then raise exception '관리자만 답변을 삭제할 수 있습니다.';end if;
 perform 1 from public.seoripul_community_posts where id=p_post_id and board_type='civil-board' for update;
 if not found then raise exception '민원 게시글을 찾을 수 없습니다.';end if;
 delete from public.seoripul_civil_replies where id=p_reply_id and post_id=p_post_id;
 if not found then raise exception '답변을 찾을 수 없습니다.';end if;
end $$;
revoke all on function public.seoripul_civil_reply_save(uuid,uuid,text,text),public.seoripul_civil_reply_delete(uuid,uuid) from public,anon,authenticated;
grant execute on function public.seoripul_civil_reply_save(uuid,uuid,text,text),public.seoripul_civil_reply_delete(uuid,uuid) to authenticated;


-- Run after schema.sql. Directory information is public; only existing admins may edit.

create table if not exists public.seoripul_organization_directory (
 department text primary key check(char_length(department) between 1 and 100),
 sections jsonb not null default '[]' check(jsonb_typeof(sections)='array'),
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now()
);
alter table public.seoripul_organization_directory enable row level security;
revoke all on public.seoripul_organization_directory from anon,authenticated;
grant select on public.seoripul_organization_directory to anon,authenticated;
drop policy if exists organization_directory_read on public.seoripul_organization_directory;
create policy organization_directory_read on public.seoripul_organization_directory for select to anon,authenticated using(true);

create or replace function public.seoripul_save_organization_directory(p_department text,p_sections jsonb,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare section jsonb; member jsonb; total integer=0; result integer;
begin
 if not public.is_news_admin() then raise exception '관리자만 편집할 수 있습니다.';end if;
 if p_department is null or char_length(btrim(p_department)) not between 1 and 100 or p_department='경애하는 도원경수령님' then raise exception '올바른 조직을 선택해 주세요.';end if;
 if p_sections is null or jsonb_typeof(p_sections)<>'array' or octet_length(p_sections::text)>2097152 then raise exception '목록 형식 또는 용량을 확인해 주세요.';end if;
 if jsonb_array_length(p_sections)>50 then raise exception '표 묶음은 50개까지 등록할 수 있습니다.';end if;
 for section in select value from jsonb_array_elements(p_sections) loop
  if jsonb_typeof(section)<>'object' or jsonb_typeof(section->'title') is distinct from 'string' or char_length(btrim(coalesce(section->>'title',''))) not between 1 and 100 or jsonb_typeof(section->'rows') is distinct from 'array' then raise exception '부서·팀 제목과 행 목록을 확인해 주세요.';end if;
  total=total+jsonb_array_length(section->'rows');
  if total>500 then raise exception '한 조직에 500행까지 등록할 수 있습니다.';end if;
  for member in select value from jsonb_array_elements(section->'rows') loop
   if jsonb_typeof(member)<>'object' or jsonb_typeof(member->'position') is distinct from 'string' or char_length(btrim(coalesce(member->>'position',''))) not between 1 and 100 or jsonb_typeof(member->'phone') is distinct from 'string' or char_length(member->>'phone')>100 or jsonb_typeof(member->'duties') is distinct from 'string' or char_length(member->>'duties')>3000 then raise exception '직위(100자), 전화번호(100자), 담당업무(3000자)를 확인해 주세요.';end if;
  end loop;
 end loop;
 if p_expected_version=0 then
  insert into public.seoripul_organization_directory(department,sections) values(p_department,p_sections) on conflict do nothing returning version into result;
 else
  update public.seoripul_organization_directory set sections=p_sections,version=version+1,updated_at=now() where department=p_department and version=p_expected_version returning version into result;
 end if;
 if result is null then raise exception '다른 관리자가 목록을 변경했습니다. 새로고침 후 다시 편집해 주세요.';end if;
 return result;
end $$;
revoke all on function public.seoripul_save_organization_directory(text,jsonb,integer) from public,anon;
grant execute on function public.seoripul_save_organization_directory(text,jsonb,integer) to authenticated;


-- Install or UPGRADE in the existing shared Supabase SQL Editor. Run once for BOTH sites; existing banners are preserved.

create table if not exists public.site_home_banners(
 site text primary key check(site in ('angangjin','geumseong','seoripul')),
 version integer not null default 0 check(version>=0),
 payload jsonb not null default '[]'::jsonb check(jsonb_typeof(payload)='array' and jsonb_array_length(payload)<=30),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.site_home_banners drop constraint if exists site_home_banners_site_check;
alter table public.site_home_banners add constraint site_home_banners_site_check check(site in ('angangjin','geumseong','seoripul'));
-- Upgrade the existing main-only table without deleting any saved banners.
alter table public.site_home_banners add column if not exists slot text not null default 'main';
alter table public.site_home_banners drop constraint if exists site_home_banners_pkey;
alter table public.site_home_banners add primary key(site,slot);
alter table public.site_home_banners drop constraint if exists home_banner_slot_check;
alter table public.site_home_banners add constraint home_banner_slot_check check(slot in ('main','mayor','notice','office'));
alter table public.site_home_banners enable row level security;
revoke all on public.site_home_banners from anon,authenticated;
grant select(site,slot,version,payload) on public.site_home_banners to anon,authenticated;
drop policy if exists home_banners_read on public.site_home_banners;
create policy home_banners_read on public.site_home_banners for select to anon,authenticated using(true);
create or replace function public.save_site_banner_group(p_site text,p_slot text,p_payload jsonb,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare item jsonb; normalized jsonb:='[]'::jsonb; current_version integer; storage_name text; image_src text; description text; target text;
begin
 if not public.is_news_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_site is null or p_site not in ('angangjin','geumseong','seoripul') or p_slot is null or p_slot not in ('main','mayor','notice','office') or p_expected_version is null or p_expected_version<0 then raise exception 'Invalid site or version'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'array' then raise exception 'Invalid banner list'; end if;
 if jsonb_array_length(p_payload)>30 then raise exception 'Maximum 30 banners'; end if;
 for item in select value from jsonb_array_elements(p_payload) loop
  storage_name:=coalesce(item->>'storage_path','');image_src:=coalesce(item->>'src','');description:=btrim(coalesce(item->>'alt',''));target:=btrim(coalesce(item->>'href',''));
  if length(description) not between 1 and 300 or length(target)>1000 or length(coalesce(item->>'page',''))>100 or length(coalesce(item->>'position','center'))>50 then raise exception 'Invalid description or link length'; end if;
  if storage_name<>'' then
   if storage_name !~ ('^'||p_site||'/[0-9a-f-]{36}\.(png|jpg|webp|gif)$') then raise exception 'Invalid image path'; end if;
   if not exists(select 1 from storage.objects where bucket_id='site-banners' and name=storage_name) then raise exception 'Image not found'; end if;
   image_src:='';
  elsif image_src !~ '^assets/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|webp|gif|svg)$' or position('..' in image_src)>0 then raise exception 'Invalid static image path';
  end if;
  if target<>'' and not (target ~* '^https?://[^[:space:]]+$' or (target ~* '^/?[a-z0-9][a-z0-9._~/?&=#%+-]*$' and position('..' in target)=0)) then raise exception 'Invalid target URL'; end if;
  normalized:=normalized||jsonb_build_array(jsonb_build_object('storage_path',storage_name,'src',image_src,'alt',description,'href',target,'page',coalesce(item->>'page',''),'position',coalesce(item->>'position','center')));
 end loop;
 insert into public.site_home_banners(site,slot) values(p_site,p_slot) on conflict(site,slot) do nothing;
 select version into current_version from public.site_home_banners where site=p_site and slot=p_slot for update;
 if current_version<>p_expected_version then raise exception 'Banner version conflict' using errcode='40001'; end if;
 update public.site_home_banners set payload=normalized,version=version+1,updated_at=now(),updated_by=auth.uid() where site=p_site and slot=p_slot returning version into current_version;
 return current_version;
end;
$$;
revoke all on function public.save_site_banner_group(text,text,jsonb,integer) from public,anon;
grant execute on function public.save_site_banner_group(text,text,jsonb,integer) to authenticated;
-- Retain the old endpoint for any already-open main-page editor.
create or replace function public.save_site_home_banners(p_site text,p_payload jsonb,p_expected_version integer) returns integer
language sql security invoker set search_path='' as $$
 select public.save_site_banner_group(p_site,'main',p_payload,p_expected_version);
$$;
revoke all on function public.save_site_home_banners(text,jsonb,integer) from public,anon;
grant execute on function public.save_site_home_banners(text,jsonb,integer) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-banners','site-banners',true,10485760,array['image/png','image/jpeg','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists home_banner_images_read on storage.objects;
create policy home_banner_images_read on storage.objects for select to anon,authenticated using(bucket_id='site-banners');
drop policy if exists home_banner_images_insert on storage.objects;
create policy home_banner_images_insert on storage.objects for insert to authenticated with check(bucket_id='site-banners' and (storage.foldername(name))[1] in ('angangjin','geumseong','seoripul') and public.is_news_admin());
drop policy if exists home_banner_images_delete on storage.objects;
create policy home_banner_images_delete on storage.objects for delete to authenticated using(bucket_id='site-banners' and public.is_news_admin() and not exists(select 1 from public.site_home_banners b cross join lateral jsonb_array_elements(b.payload) p where p->>'storage_path'=name));


-- Run once in the shared Supabase SQL Editor. Safe to rerun; numbers are never recycled.

create table if not exists public.post_route_counters (
 site text not null, board text not null, next_number bigint not null default 1 check(next_number>0),
 primary key(site,board)
);
create table if not exists public.post_route_numbers (
 site text not null, board text not null, post_id uuid not null, number bigint not null check(number>0),
 source_table text, active boolean not null default false,
 primary key(site,board,post_id), unique(site,board,number)
);
alter table public.post_route_counters enable row level security;
alter table public.post_route_numbers enable row level security;
revoke all on public.post_route_counters, public.post_route_numbers from anon, authenticated;
create or replace function public.assign_post_route(p_site text,p_board text,p_id uuid,p_table text,p_active boolean)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare n bigint;
begin
 insert into public.post_route_counters(site,board) values(p_site,p_board) on conflict do nothing;
 perform 1 from public.post_route_counters where site=p_site and board=p_board for update;
 select number into n from public.post_route_numbers where site=p_site and board=p_board and post_id=p_id;
 if n is null and p_active then
  update public.post_route_counters set next_number=next_number+1 where site=p_site and board=p_board returning next_number-1 into n;
  insert into public.post_route_numbers(site,board,post_id,number,source_table,active) values(p_site,p_board,p_id,n,p_table,true);
 elsif n is not null then
  update public.post_route_numbers set active=p_active,source_table=p_table where site=p_site and board=p_board and post_id=p_id;
 end if;
end $$;
revoke all on function public.assign_post_route(text,text,uuid,text,boolean) from public,anon,authenticated;
create or replace function public.post_route_trigger()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare rowdata jsonb; b text;
begin
 rowdata:=case when TG_OP='DELETE' then to_jsonb(OLD) else to_jsonb(NEW) end;
 b:=coalesce(nullif(TG_ARGV[1],''),rowdata->>'board_type');
 if TG_OP='UPDATE' and OLD.id<>NEW.id then raise exception 'Post identifiers cannot change'; end if;
 if TG_OP='UPDATE' and (to_jsonb(OLD)->>'board_type') is distinct from (rowdata->>'board_type') then
  perform public.assign_post_route(TG_ARGV[0],to_jsonb(OLD)->>'board_type',OLD.id,TG_TABLE_NAME,false);
 end if;
 perform public.assign_post_route(TG_ARGV[0],b,(rowdata->>'id')::uuid,TG_TABLE_NAME,
 TG_OP<>'DELETE' and coalesce(rowdata->>'status','published')='published');
 if TG_OP='DELETE' then return OLD; else return NEW; end if;
end $$;
revoke all on function public.post_route_trigger() from public,anon,authenticated;

do $$ declare t text; b text; r record; begin
foreach t in array array['news_posts','notice_posts','publication_posts','photo_posts','community_posts','video_posts'] loop
execute format('lock table public.%I in share row exclusive mode','seoripul_'||t);
b:=case t when 'news_posts' then 'news' when 'photo_posts' then 'photo' when 'video_posts' then 'video' else '' end;
execute format('drop trigger if exists post_route_number on public.%I','seoripul_'||t);
execute format('create trigger post_route_number after insert or update or delete on public.%I for each row execute function public.post_route_trigger(%L,%L)','seoripul_'||t,'seoripul',b);
for r in execute format('select to_jsonb(p) as j from public.%I p order by created_at,id','seoripul_'||t) loop
perform public.assign_post_route('seoripul',coalesce(nullif(b,''),r.j->>'board_type'),(r.j->>'id')::uuid,'seoripul_'||t,coalesce(r.j->>'status','published')='published');
end loop; end loop; end $$;
-- This public function exposes only identifiers of published posts, never private author information.
create or replace function public.public_post_routes(p_site text)
returns table(board text,post_id uuid,number bigint)
language sql stable security definer set search_path=pg_catalog,public
as $$ select n.board,n.post_id,n.number from public.post_route_numbers n
where n.site=p_site and n.active order by n.board,n.number $$;
revoke all on function public.public_post_routes(text) from public;
grant execute on function public.public_post_routes(text) to anon,authenticated;
notify pgrst,'reload schema';

commit;
