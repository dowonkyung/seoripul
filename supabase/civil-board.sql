-- Run after supabase/community.sql. Safe to run again; existing posts are preserved.
begin;
alter table public.seoripul_community_posts drop constraint if exists community_posts_board_type_check;
alter table public.seoripul_community_posts add constraint community_posts_board_type_check check(board_type in ('free','praise','civil-board'));
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


create table if not exists public.seoripul_civil_replies(
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.seoripul_community_posts(id) on delete cascade,
 department text not null check(char_length(btrim(department)) between 1 and 100),
 body text not null check(char_length(btrim(body)) between 1 and 10000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists seoripul_civil_replies_post_date on public.seoripul_civil_replies(post_id,created_at,id);
alter table public.seoripul_civil_replies enable row level security;
revoke all on public.seoripul_civil_replies from anon,authenticated;
grant select on public.seoripul_civil_replies to anon,authenticated;
drop policy if exists civil_replies_read on public.seoripul_civil_replies;
create policy civil_replies_read on public.seoripul_civil_replies for select to anon,authenticated
 using(exists(select 1 from public.seoripul_community_posts p where p.id=post_id and p.board_type='civil-board'));
create or replace function public.seoripul_civil_reply_save(p_post_id uuid,p_reply_id uuid,p_department text,p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare saved_id uuid;
begin
 if auth.uid() is null or not coalesce(public.is_news_admin(),false) then raise exception '관리자만 답변을 작성할 수 있습니다.';end if;
 perform 1 from public.seoripul_community_posts where id=p_post_id and board_type='civil-board' for update;
 if not found then raise exception '민원 게시글을 찾을 수 없습니다.';end if;
 if p_department is null or char_length(btrim(p_department)) not between 1 and 100 or p_body is null or char_length(btrim(p_body)) not between 1 and 10000 then raise exception '담당 부서와 답변 내용을 확인해 주세요.';end if;
 if p_reply_id is null then
  insert into public.seoripul_civil_replies(post_id,department,body) values(p_post_id,btrim(p_department),btrim(p_body)) returning id into saved_id;
 else
  update public.seoripul_civil_replies set department=btrim(p_department),body=btrim(p_body),updated_at=now() where id=p_reply_id and post_id=p_post_id returning id into saved_id;
  if not found then raise exception '답변을 찾을 수 없습니다.';end if;
 end if;
 return saved_id;
end $$;
create or replace function public.seoripul_civil_reply_delete(p_post_id uuid,p_reply_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(public.is_news_admin(),false) then raise exception '관리자만 답변을 삭제할 수 있습니다.';end if;
 perform 1 from public.seoripul_community_posts where id=p_post_id and board_type='civil-board' for update;
 if not found then raise exception '민원 게시글을 찾을 수 없습니다.';end if;
 delete from public.seoripul_civil_replies where id=p_reply_id and post_id=p_post_id;
 if not found then raise exception '답변을 찾을 수 없습니다.';end if;
end $$;
revoke all on function public.seoripul_civil_reply_save(uuid,uuid,text,text),public.seoripul_civil_reply_delete(uuid,uuid) from public,anon,authenticated;
grant execute on function public.seoripul_civil_reply_save(uuid,uuid,text,text),public.seoripul_civil_reply_delete(uuid,uuid) to authenticated;
commit;
