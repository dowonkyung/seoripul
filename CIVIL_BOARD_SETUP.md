# 민원게시판과 관리자 답변 설정

1. 기존 자유게시판 설정(supabase/community.sql)이 되어 있다면 Supabase SQL Editor에서 supabase/civil-board.sql 전체를 실행합니다.
2. 처음 설정한다면 supabase/schema.sql, supabase/community.sql, supabase/civil-board.sql 순서로 실행합니다.
3. civil-board.html에서 로그인 없이 글을 등록할 수 있습니다. 작성자명, 네이버 아이디 또는 마인크래프트 닉네임, 4자리 비밀번호를 입력합니다. 아이디는 관리자에게만 공개됩니다.
4. 관리자로 로그인하여 민원 게시글을 열면 담당 부서와 답변 내용을 작성할 수 있습니다. 관리자는 답변을 수정·삭제할 수도 있습니다. 답변은 모든 방문자에게 공개됩니다.
5. 글 수정·삭제와 비밀번호 확인은 기존 자유게시판 방식입니다. 게시글 삭제 시 답변도 삭제됩니다.

신고 안내는 civil.html의 기존 안내 내용을 사용합니다. 민원게시판은 civil-board.html입니다.
SQL은 기존 게시글을 보존하며 다시 실행할 수 있습니다.
