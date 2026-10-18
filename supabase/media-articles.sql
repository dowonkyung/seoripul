-- Run after publications.sql; preserves all existing posts and permissions.
begin;
alter table public.seoripul_publication_posts drop constraint if exists publication_posts_board_type_check;
alter table public.seoripul_publication_posts add constraint publication_posts_board_type_check check(board_type in ('gazette','press','briefing','facts','activity','media'));
commit;
