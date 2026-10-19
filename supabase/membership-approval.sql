-- Run once in the shared Supabase SQL Editor for both municipal sites.
begin;
alter table public.news_admins add column if not exists role text not null default 'admin';
alter table public.news_admins drop constraint if exists news_admins_role_check;
alter table public.news_admins add constraint news_admins_role_check check(role in ('admin','super_admin'));
revoke insert,update,delete on public.news_admins from anon,authenticated;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path='' as $function$
 select exists(
  select 1 from public.news_admins
  where user_id=(select auth.uid()) and role='super_admin'
 );
$function$;
revoke all on function public.is_super_admin() from public,anon;
grant execute on function public.is_super_admin() to authenticated;


create table if not exists public.membership_requests(
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 display_name text not null check(char_length(display_name) between 1 and 60),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null
);
alter table public.membership_requests enable row level security;
revoke all on public.membership_requests from anon,authenticated;
grant select on public.membership_requests to authenticated;
drop policy if exists membership_read on public.membership_requests;
create policy membership_read on public.membership_requests for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_super_admin()));
create or replace function public.create_membership_request()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.membership_requests(user_id,email,display_name)
 values(new.id,coalesce(new.email,''),coalesce(nullif(left(btrim(new.raw_user_meta_data->>'display_name'),60),''),'회원'));
 return new;
end $$;
revoke all on function public.create_membership_request() from public,anon,authenticated;
drop trigger if exists municipal_membership_created on auth.users;
create trigger municipal_membership_created after insert on auth.users
for each row execute function public.create_membership_request();
-- Existing administrators retain their access. Existing non-admin accounts await approval.
insert into public.membership_requests(user_id,email,display_name,status)
select u.id,coalesce(u.email,''),coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),60),''),'회원'),
case when exists(select 1 from public.news_admins a where a.user_id=u.id) then 'approved' else 'pending' end
from auth.users u on conflict(user_id) do nothing;
create or replace function public.sync_membership_email()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.membership_requests set email=coalesce(new.email,'') where user_id=new.id;
 return new;
end $$;
revoke all on function public.sync_membership_email() from public,anon,authenticated;
drop trigger if exists municipal_membership_email on auth.users;
create trigger municipal_membership_email after update of email on auth.users
for each row execute function public.sync_membership_email();
create or replace function public.membership_ready()
returns boolean language sql stable set search_path='' as $$ select true $$;
revoke all on function public.membership_ready() from public;
grant execute on function public.membership_ready() to anon,authenticated;
create or replace function public.is_approved_member()
returns boolean language sql stable security definer set search_path='' as $$
 select public.is_news_admin() or exists(
 select 1 from public.membership_requests where user_id=(select auth.uid()) and status='approved')
$$;
revoke all on function public.is_approved_member() from public;
grant execute on function public.is_approved_member() to authenticated;
create or replace function public.review_membership(p_user uuid,p_status text,p_expected text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.is_super_admin(),false) then raise exception '최고관리자만 가입 신청을 처리할 수 있습니다.' using errcode='42501'; end if;
 if p_status not in ('approved','rejected') or p_status is null then raise exception '잘못된 승인 상태입니다.';end if;
 if exists(select 1 from public.news_admins where user_id=p_user) then raise exception '관리자 계정은 가입 승인 대상이 아닙니다.';end if;
 update public.membership_requests set status=p_status,reviewed_at=now(),reviewed_by=auth.uid()
 where user_id=p_user and status=p_expected;
 if not found then raise exception '신청 상태가 변경됐습니다. 목록을 새로고침해 주세요.';end if;
end $$;
revoke all on function public.review_membership(uuid,text,text) from public,anon;
grant execute on function public.review_membership(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
