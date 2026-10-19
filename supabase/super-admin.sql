-- Shared role upgrade for all three sites. Existing administrators remain ordinary administrators.
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

drop policy if exists membership_read on public.membership_requests;
create policy membership_read on public.membership_requests
 for select to authenticated using(
  user_id=(select auth.uid()) or (select public.is_super_admin())
 );

create or replace function public.review_membership(p_user uuid,p_status text,p_expected text)
returns void language plpgsql security definer set search_path='' as $function$
begin
 if not coalesce(public.is_super_admin(),false) then
  raise exception '최고관리자만 가입 신청을 처리할 수 있습니다.' using errcode='42501';
 end if;
 if p_status is null or p_status not in ('approved','rejected') then
  raise exception '잘못된 승인 상태입니다.';
 end if;
 if exists(select 1 from public.news_admins where user_id=p_user) then
  raise exception '관리자 계정은 가입 승인 대상이 아닙니다.';
 end if;
 update public.membership_requests
 set status=p_status,reviewed_at=now(),reviewed_by=auth.uid()
 where user_id=p_user and status=p_expected;
 if not found then
  raise exception '신청 상태가 변경됐습니다. 목록을 새로고침해 주세요.';
 end if;
end;
$function$;
revoke all on function public.review_membership(uuid,text,text) from public,anon;
grant execute on function public.review_membership(uuid,text,text) to authenticated;

notify pgrst,'reload schema';
commit;