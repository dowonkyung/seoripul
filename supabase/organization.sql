-- Run after schema.sql. Directory information is public; only existing admins may edit.
begin;
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
commit;
