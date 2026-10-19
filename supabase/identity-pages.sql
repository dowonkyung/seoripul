-- Shared setup: run once for all three sites in the existing Supabase SQL Editor.
begin;
create table if not exists public.site_identity_pages(
 site text not null check(site in ('angangjin','geumseong','seoripul')),
 page text not null check(page in ('ci','policy')),
 version integer not null default 0 check(version>=0),
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 primary key(site,page)
);
alter table public.site_identity_pages enable row level security;
revoke all on public.site_identity_pages from anon,authenticated;
grant select(site,page,version,payload) on public.site_identity_pages to anon,authenticated;
drop policy if exists identity_pages_read on public.site_identity_pages;
create policy identity_pages_read on public.site_identity_pages for select to anon,authenticated using(true);
create or replace function public.save_site_identity_page(p_site text,p_page text,p_payload jsonb,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare asset_key text; asset_value text; color jsonb; current_version integer;
begin
 if not coalesce(public.is_news_admin(),false) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_site is null or p_site not in ('angangjin','geumseong','seoripul') or p_page is null or p_page not in ('ci','policy') or p_expected_version is null or p_expected_version<0 then raise exception 'Invalid page or version'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_payload->'description') is distinct from 'string' or length(p_payload->>'description')>20000 then raise exception 'Invalid description'; end if;
 if jsonb_typeof(p_payload->'colors') is distinct from 'array' then raise exception 'Invalid colors'; end if;
 if jsonb_array_length(p_payload->'colors')>10 then raise exception 'Maximum 10 colors'; end if;
 for color in select value from jsonb_array_elements(p_payload->'colors') loop
  if jsonb_typeof(color->'name') is distinct from 'string' or length(color->>'name') not between 1 and 100 or coalesce(color->>'hex','') !~ '^#[a-fA-F0-9]{6}$' then raise exception 'Invalid color'; end if;
 end loop;
 if jsonb_typeof(p_payload->'aiName') is distinct from 'string' or length(p_payload->>'aiName')>255 or (p_payload->>'aiName') ~ E'[\\r\\n/\\\\]' then raise exception 'Invalid filename'; end if;
 foreach asset_key in array case when p_page='ci' then array['symbolImage','logotypeImage','aiFile'] else array['image','aiFile'] end loop
  if jsonb_typeof(p_payload->asset_key) is distinct from 'string' then raise exception 'Invalid asset'; end if;
  asset_value:=p_payload->>asset_key;
  if asset_value='' then continue; end if;
  if asset_value like 'assets/%' then
   if asset_value !~ '^assets/[a-zA-Z0-9_./-]+$' or position('..' in asset_value)>0 then raise exception 'Invalid static path'; end if;
  else
   if asset_value !~ ('^'||p_site||'/'||p_page||'/[0-9a-f-]{36}\.'||case when asset_key='aiFile' then 'ai' else '(png|jpg|webp|svg)' end||'$') then raise exception 'Invalid uploaded path'; end if;
   if not exists(select 1 from storage.objects where bucket_id='site-identity-files' and name=asset_value) then raise exception 'Uploaded file not found'; end if;
  end if;
 end loop;
 insert into public.site_identity_pages(site,page) values(p_site,p_page) on conflict(site,page) do nothing;
 select version into current_version from public.site_identity_pages where site=p_site and page=p_page for update;
 if current_version<>p_expected_version then raise exception 'Page version conflict' using errcode='40001'; end if;
 update public.site_identity_pages set payload=p_payload,version=version+1,updated_at=now(),updated_by=auth.uid() where site=p_site and page=p_page returning version into current_version;
 return current_version;
end;
$$;
revoke all on function public.save_site_identity_page(text,text,jsonb,integer) from public,anon;
grant execute on function public.save_site_identity_page(text,text,jsonb,integer) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-identity-files','site-identity-files',true,31457280,array['image/png','image/jpeg','image/webp','image/svg+xml','application/octet-stream'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists identity_files_read on storage.objects;
create policy identity_files_read on storage.objects for select to anon,authenticated using(bucket_id='site-identity-files');
drop policy if exists identity_files_insert on storage.objects;
create policy identity_files_insert on storage.objects for insert to authenticated with check(bucket_id='site-identity-files' and public.is_news_admin() and name ~ '^(angangjin|geumseong|seoripul)/(ci|policy)/[0-9a-f-]{36}\.(png|jpg|webp|svg|ai)$');
drop policy if exists identity_files_delete on storage.objects;
create policy identity_files_delete on storage.objects for delete to authenticated using(bucket_id='site-identity-files' and public.is_news_admin() and not exists(select 1 from public.site_identity_pages p cross join lateral jsonb_each_text(p.payload) v where v.key in ('symbolImage','logotypeImage','image','aiFile') and v.value=storage.objects.name));
commit;