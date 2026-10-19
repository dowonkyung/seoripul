-- Run once in the existing shared Supabase SQL Editor for all three sites.
begin;
create table if not exists public.site_office_pages(
 site text not null check(site in ('angangjin','geumseong','seoripul')),
 page text not null check(page in ('greeting','profile','inaugural')),
 version integer not null default 0 check(version>=0),
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),updated_by uuid references auth.users(id),
 primary key(site,page)
);
alter table public.site_office_pages enable row level security;
revoke all on public.site_office_pages from anon,authenticated;
grant select(site,page,version,payload) on public.site_office_pages to anon,authenticated;
drop policy if exists office_pages_read on public.site_office_pages;
create policy office_pages_read on public.site_office_pages for select to anon,authenticated using(true);
create or replace function public.save_site_office_page(p_site text,p_page text,p_payload jsonb,p_expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare field_name text; max_length integer; portrait_path text; current_version integer; required_fields text[];
begin
 if not coalesce(public.is_news_admin(),false) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_site is null or p_site not in ('angangjin','geumseong','seoripul') or p_page is null or p_page not in ('greeting','profile','inaugural') or p_expected_version is null or p_expected_version<0 then raise exception 'Invalid page or version'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid page data'; end if;
 required_fields:=case when p_page='profile' then array['title','education','career'] else array['title','subtitle','body','date','signature'] end;
 foreach field_name in array required_fields loop
  max_length:=case when field_name='title' then 300 when field_name='subtitle' then 1000 when field_name in ('date','signature') then 100 when field_name='body' then 40000 else 20000 end;
  if jsonb_typeof(p_payload->field_name) is distinct from 'string' or length(p_payload->>field_name)>max_length then raise exception 'Invalid field: %',field_name; end if;
 end loop;
 if p_page='inaugural' then
  if p_payload ? 'portrait' then raise exception 'Inaugural page has no portrait'; end if;
 else
  if jsonb_typeof(p_payload->'portrait') is distinct from 'string' then raise exception 'Invalid portrait'; end if;
  portrait_path:=p_payload->>'portrait';
  if portrait_path<>'' then
   if portrait_path like 'assets/%' then
    if portrait_path !~ '^assets/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|webp|svg)$' or position('..' in portrait_path)>0 then raise exception 'Invalid static portrait path'; end if;
   else
    if portrait_path !~ ('^'||p_site||'/'||p_page||'/[0-9a-f-]{36}\.(png|jpg|webp|svg)$') then raise exception 'Invalid uploaded portrait path'; end if;
    if not exists(select 1 from storage.objects where bucket_id='site-office-files' and name=portrait_path) then raise exception 'Portrait not found'; end if;
   end if;
  end if;
 end if;
 insert into public.site_office_pages(site,page) values(p_site,p_page) on conflict(site,page) do nothing;
 select version into current_version from public.site_office_pages where site=p_site and page=p_page for update;
 if current_version<>p_expected_version then raise exception 'Page version conflict' using errcode='40001'; end if;
 update public.site_office_pages set payload=p_payload,version=version+1,updated_at=now(),updated_by=auth.uid() where site=p_site and page=p_page returning version into current_version;
 return current_version;
end;
$$;
revoke all on function public.save_site_office_page(text,text,jsonb,integer) from public,anon;
grant execute on function public.save_site_office_page(text,text,jsonb,integer) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-office-files','site-office-files',true,10485760,array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists office_files_read on storage.objects;
create policy office_files_read on storage.objects for select to anon,authenticated using(bucket_id='site-office-files');
drop policy if exists office_files_insert on storage.objects;
create policy office_files_insert on storage.objects for insert to authenticated with check(bucket_id='site-office-files' and public.is_news_admin() and name ~ '^(angangjin|geumseong|seoripul)/(greeting|profile)/[0-9a-f-]{36}\.(png|jpg|webp|svg)$');
drop policy if exists office_files_delete on storage.objects;
create policy office_files_delete on storage.objects for delete to authenticated using(bucket_id='site-office-files' and public.is_news_admin() and not exists(select 1 from public.site_office_pages p where p.payload->>'portrait'=storage.objects.name));
commit;