-- Run after schema.sql. Existing news tables and files are not changed.
begin;
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
commit;
