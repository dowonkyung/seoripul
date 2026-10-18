insert into auth.users(id,email) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','admin@example.test');
insert into news_admins values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
create temporary table old_routes as select * from post_route_numbers where site in ('angangjin','geumseong');
insert into site_home_banners(site,slot,payload) values('angangjin','main','[]'),('geumseong','main','[]');
\i supabase/seoripul-setup.sql
\i supabase/seoripul-setup.sql
do $$ begin
if exists((select * from old_routes) except (select * from post_route_numbers where site in ('angangjin','geumseong'))) then raise exception 'Old routes changed';end if;
if (select count(*) from site_home_banners where site in ('angangjin','geumseong'))<>2 then raise exception 'Old banners changed';end if;
if not exists(select 1 from pg_policies where schemaname='storage' and policyname='news_files_read') then raise exception 'Old storage policy removed';end if;
end $$;
set request.jwt.claim.sub='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set role authenticated;
insert into seoripul_news_posts(id,title,department,status,author_id) values('11111111-1111-1111-1111-111111111111','테스트','공보관','published',auth.uid());
delete from seoripul_news_posts where id='11111111-1111-1111-1111-111111111111';
insert into seoripul_news_posts(id,title,department,status,author_id) values('22222222-2222-2222-2222-222222222222','두 번째','공보관','published',auth.uid());
select seoripul_save_organization_directory('구청장','[{"title":"서리풀구청장","rows":[{"position":"구청장","phone":"준비 중","duties":"구정 총괄"}]}]',0);
insert into seoripul_photo_posts(id,board_type,title,department,status,author_id) values('33333333-3333-3333-3333-333333333333','photo','사진 테스트','공보관','published',auth.uid());
insert into storage.objects(bucket_id,name) values('seoripul-photo-files',auth.uid()::text||'/33333333-3333-3333-3333-333333333333/example.png');
insert into seoripul_photo_assets(post_id,file_name,storage_path,mime,size,kind) values('33333333-3333-3333-3333-333333333333','example.png',auth.uid()::text||'/33333333-3333-3333-3333-333333333333/example.png','image/png',100,'inline');
select save_site_banner_group('seoripul','main','[]',0);
reset role;
set request.jwt.claim.sub='';
set role anon;
select seoripul_community_create('civil-board','민원 테스트','홍길동','minecraft','test-player','1234','<p>본문</p>','[]');
do $$ begin
if (select number from public_post_routes('seoripul') where board='news')<>2 then raise exception 'Deleted number reused';end if;
if (select count(*) from seoripul_photo_assets)<>1 then raise exception 'Published photos invisible';end if;
if (select count(*) from storage.objects where bucket_id='seoripul-photo-files')<>1 then raise exception 'Published file invisible';end if;
if (select count(*) from seoripul_organization_directory)<>1 then raise exception 'Directory invisible';end if;
begin perform * from seoripul_community_private;raise exception 'Private identity exposed';exception when insufficient_privilege then null;end;
begin insert into seoripul_news_posts(title,department,author_id) values('bad','bad','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');raise exception 'Anonymous official publishing allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin if (select count(*) from post_route_numbers where site='seoripul' and board='news')<>2 then raise exception 'Tombstone missing';end if;end $$;

