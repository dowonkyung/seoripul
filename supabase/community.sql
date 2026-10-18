-- Run after schema.sql in the Supabase SQL Editor.
begin;
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.seoripul_community_posts (
 id uuid primary key default gen_random_uuid(),
 board_type text not null check(board_type in ('free','praise','civil-board')),
 title text not null check(char_length(title) between 1 and 200),
 author_mask text not null,
 body_html text not null check(octet_length(body_html)<=1048576),
 attachments jsonb not null default '[]',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists seoripul_community_posts_date on public.seoripul_community_posts(board_type,created_at desc);
create table if not exists public.seoripul_community_private (
 post_id uuid primary key references public.seoripul_community_posts(id) on delete cascade,
 author_name text not null, identity_kind text not null check(identity_kind in ('naver','minecraft')),
 identity_value text not null, pin_hash text not null,
 failed_attempts integer not null default 0, blocked_until timestamptz
);
create table if not exists public.seoripul_community_edit_tokens (
 token_hash bytea primary key, post_id uuid not null references public.seoripul_community_posts(id) on delete cascade,
 expires_at timestamptz not null
);
alter table public.seoripul_community_posts enable row level security;
alter table public.seoripul_community_private enable row level security;
alter table public.seoripul_community_edit_tokens enable row level security;
revoke all on public.seoripul_community_posts,public.seoripul_community_private,public.seoripul_community_edit_tokens from anon,authenticated;
grant select on public.seoripul_community_posts to anon,authenticated;
grant select(post_id,author_name,identity_kind,identity_value) on public.seoripul_community_private to authenticated;
drop policy if exists community_public_read on public.seoripul_community_posts;
create policy community_public_read on public.seoripul_community_posts for select to anon,authenticated using(true);
drop policy if exists community_admin_read on public.seoripul_community_private;
create policy community_admin_read on public.seoripul_community_private for select to authenticated using((select public.is_news_admin()));

create or replace function public.seoripul_community_validate(p_title text,p_body text,p_assets jsonb) returns void
language plpgsql set search_path='' as $$
declare a jsonb;
begin
 if char_length(btrim(coalesce(p_title,''))) not between 1 and 200 or char_length(btrim(coalesce(p_body,'')))=0 or octet_length(p_body)>1048576 then raise exception '제목과 본문을 확인해 주세요.'; end if;
 if p_assets is null or jsonb_typeof(p_assets)<>'array' then raise exception '첨부파일 형식이 올바르지 않습니다.';end if;
 if jsonb_array_length(p_assets)>10 or octet_length(p_assets::text)>7340032 then raise exception '첨부파일은 10개, 전체 5MB 이내로 등록해 주세요.';end if;
 for a in select value from jsonb_array_elements(p_assets) loop
  if jsonb_typeof(a)<>'object' or char_length(coalesce(a->>'name','')) not between 1 and 200 or coalesce(a->>'name','') !~* '\.(hwp|hwpx|pdf|png|jpg|jpeg|webp|gif|txt|doc|docx|xls|xlsx|ppt|pptx|zip)$' or coalesce(a->>'data','') !~ '^data:[a-zA-Z0-9.+/-]+;base64,[A-Za-z0-9+/]*={0,2}$' or char_length(a->>'data')>2796500 then raise exception '지원하지 않는 첨부파일이거나 파일당 2MB를 초과했습니다.';end if;
 end loop;
end $$;
revoke all on function public.seoripul_community_validate(text,text,jsonb) from public,anon,authenticated;

create or replace function public.seoripul_community_create(p_board text,p_title text,p_author text,p_identity_kind text,p_identity text,p_pin text,p_body text,p_assets jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 perform public.seoripul_community_validate(p_title,p_body,p_assets);
 if p_board not in ('free','praise','civil-board') or p_author is null or char_length(btrim(p_author)) not between 1 and 40 or p_identity_kind not in ('naver','minecraft') or p_identity is null or char_length(btrim(p_identity)) not between 1 and 100 or p_pin is null or p_pin !~ '^[0-9]{4}$' then raise exception '작성자명, 네이버 아이디 또는 마인크래프트 닉네임, 4자리 비밀번호를 확인해 주세요.';end if;
 insert into public.seoripul_community_posts(board_type,title,author_mask,body_html,attachments) values(p_board,btrim(p_title),left(btrim(p_author),1)||repeat('*',greatest(char_length(btrim(p_author))-1,0)),p_body,p_assets) returning id into new_id;
 insert into public.seoripul_community_private(post_id,author_name,identity_kind,identity_value,pin_hash) values(new_id,btrim(p_author),p_identity_kind,btrim(p_identity),extensions.crypt(p_pin,extensions.gen_salt('bf',10)));
 return new_id;
end $$;

create or replace function public.seoripul_community_unlock(p_id uuid,p_pin text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare secret public.seoripul_community_private; token text; attempts integer;
begin
 select * into secret from public.seoripul_community_private where post_id=p_id for update;
 if not found then return jsonb_build_object('ok',false,'error','게시글을 찾을 수 없습니다.');end if;
 if not public.is_news_admin() then
  if secret.blocked_until>now() then return jsonb_build_object('ok',false,'error','인증 시도가 많습니다. 15분 후 다시 시도해 주세요.');end if;
  if p_pin is null or p_pin !~ '^[0-9]{4}$' or extensions.crypt(p_pin,secret.pin_hash)<>secret.pin_hash then
   attempts=case when secret.blocked_until is not null and secret.blocked_until<=now() then 1 else secret.failed_attempts+1 end;
   update public.seoripul_community_private set failed_attempts=attempts,blocked_until=case when attempts>=5 then now()+interval '15 minutes' else null end where post_id=p_id;
   return jsonb_build_object('ok',false,'error','비밀번호가 일치하지 않습니다. 5회 실패하면 15분간 제한됩니다.');
  end if;
 end if;
 update public.seoripul_community_private set failed_attempts=0,blocked_until=null where post_id=p_id;
 delete from public.seoripul_community_edit_tokens where expires_at<now();
 token=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.seoripul_community_edit_tokens values(extensions.digest(token,'sha256'),p_id,now()+interval '30 minutes');
 return jsonb_build_object('ok',true,'token',token);
end $$;

create or replace function public.seoripul_community_save(p_id uuid,p_token text,p_title text,p_body text,p_assets jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Lock the post so token checks and modifications cannot race deletion.
 perform 1 from public.seoripul_community_posts where id=p_id for update;
 if not found then raise exception '게시글을 찾을 수 없습니다.';end if;
 if not public.is_news_admin() and not exists(select 1 from public.seoripul_community_edit_tokens where post_id=p_id and token_hash=extensions.digest(coalesce(p_token,''),'sha256') and expires_at>now()) then raise exception '비밀번호를 다시 확인해 주세요.';end if;
 perform public.seoripul_community_validate(p_title,p_body,p_assets);
 update public.seoripul_community_posts set title=btrim(p_title),body_html=p_body,attachments=p_assets,updated_at=now() where id=p_id;
end $$;
create or replace function public.seoripul_community_delete(p_id uuid,p_token text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.seoripul_community_posts where id=p_id for update;
 if not found then raise exception '게시글을 찾을 수 없습니다.';end if;
 if not public.is_news_admin() and not exists(select 1 from public.seoripul_community_edit_tokens where post_id=p_id and token_hash=extensions.digest(coalesce(p_token,''),'sha256') and expires_at>now()) then raise exception '비밀번호를 다시 확인해 주세요.';end if;
 delete from public.seoripul_community_posts where id=p_id;
end $$;
revoke all on function public.seoripul_community_create(text,text,text,text,text,text,text,jsonb),public.seoripul_community_unlock(uuid,text),public.seoripul_community_save(uuid,text,text,text,jsonb),public.seoripul_community_delete(uuid,text) from public;
grant execute on function public.seoripul_community_create(text,text,text,text,text,text,text,jsonb),public.seoripul_community_unlock(uuid,text),public.seoripul_community_save(uuid,text,text,text,jsonb),public.seoripul_community_delete(uuid,text) to anon,authenticated;
commit;
