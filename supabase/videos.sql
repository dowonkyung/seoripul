-- Run after schema.sql. Reuses the existing administrator check.
begin;
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
commit;
