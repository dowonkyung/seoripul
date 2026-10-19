-- Run once in the shared Supabase SQL Editor for all three sites.
begin;
create table if not exists public.site_share_settings(
 site text primary key check(site in ('angangjin','geumseong','seoripul')),
 title text not null check(char_length(btrim(title)) between 1 and 120),
 description text not null check(char_length(btrim(description)) between 1 and 500),
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),updated_by uuid references auth.users(id)
);
alter table public.site_share_settings enable row level security;
revoke all on public.site_share_settings from anon,authenticated;
grant select(site,title,description,version) on public.site_share_settings to anon,authenticated;
drop policy if exists site_share_settings_read on public.site_share_settings;
create policy site_share_settings_read on public.site_share_settings for select to anon,authenticated using(true);
create or replace function public.save_site_share_settings(p_site text,p_title text,p_description text,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $function$
declare current_version integer;
begin
 if not coalesce(public.is_news_admin(),false) then raise exception '관리자만 설정할 수 있습니다.' using errcode='42501'; end if;
 if p_site is null or p_site not in ('angangjin','geumseong','seoripul') or p_expected_version is null or p_expected_version<0 then raise exception '사이트와 설정 버전을 확인해 주세요.'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 or p_description is null or char_length(btrim(p_description)) not between 1 and 500 then raise exception '제목은 120자, 설명은 500자 이내로 입력해 주세요.'; end if;
 if p_expected_version=0 then
  insert into public.site_share_settings(site,title,description,updated_by) values(p_site,btrim(p_title),btrim(p_description),auth.uid()) on conflict do nothing returning version into current_version;
 else
  update public.site_share_settings set title=btrim(p_title),description=btrim(p_description),version=version+1,updated_at=now(),updated_by=auth.uid() where site=p_site and version=p_expected_version returning version into current_version;
 end if;
 if current_version is null then raise exception '다른 관리자가 먼저 변경했습니다.' using errcode='40001'; end if;
 return current_version;
end;
$function$;
revoke all on function public.save_site_share_settings(text,text,text,integer) from public,anon;
grant execute on function public.save_site_share_settings(text,text,text,integer) to authenticated;
commit;