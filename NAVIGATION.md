# 공통 메뉴 관리

navigation-config.js의 menu와 routes가 일반 구청 홈페이지의 GNB, LNB, 사이트맵, 페이지 연결에 사용하는 공통 정의입니다.
페이지별 HTML의 LNB는 자동 생성한 초기 화면이며 board-links.js에서도 같은 정의로 갱신합니다.

하위 메뉴를 추가·이름 변경할 때:
1. navigation-config.js의 menu에 메뉴를 추가하고 routes에 페이지 파일을 연결합니다.
2. 저장소에서 node scripts/sync-navigation.cjs 를 실행합니다.
3. 변경된 파일을 함께 커밋합니다. 모든 관련 HTML의 초기 메뉴와 공통 메뉴 파일의 캐시 버전이 함께 갱신됩니다.

LNB 디자인은 lnb.css, 펼침·접힘 동작은 board-links.js에서 관리합니다. 페이지별 CSS에 LNB 규칙을 추가하지 않습니다.
글쓰기·미리보기는 원래 게시판을, 조직별 담당자 목록은 조직도를 현재 메뉴로 표시합니다.
열린구청장실은 별도 메뉴 체계를 유지합니다.
