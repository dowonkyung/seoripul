-- Install or UPGRADE in the existing shared Supabase SQL Editor. Run once for BOTH sites; existing banners are preserved.
begin;
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
commit;
