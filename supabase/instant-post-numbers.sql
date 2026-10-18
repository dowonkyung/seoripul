-- Run once in the shared Supabase SQL Editor. Safe to rerun; numbers are never recycled.
begin;
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
