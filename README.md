# 금성도 서리풀구청

안강진구청의 최신 디자인과 기능을 복제한 독립 사이트입니다. 도메인: https://seoripul.saevit.online

## 최초 연결

1. 기존 두 사이트가 사용하는 Supabase 프로젝트의 SQL Editor에서 [supabase/seoripul-setup.sql](supabase/seoripul-setup.sql) 전체를 실행합니다. 새 프로젝트는 만들지 않습니다. 기존 회원·관리자 계정을 공유하며, 게시글·사진·담당자 목록은 서리풀구 전용으로 새로 생성합니다. 기존 두 사이트의 게시물은 복사하지 않습니다.
2. GitHub 저장소 Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save를 선택합니다.
3. Spaceship의 saevit.online DNS에 CNAME, Host=seoripul, Value=dowonkyung.github.io 를 추가합니다. 같은 Host의 A/AAAA/CNAME 중복 레코드가 있으면 함께 사용하지 않습니다.
4. Pages → Custom domain에 seoripul.saevit.online 을 저장하고, DNS 검사·인증서 발급 완료 후 Enforce HTTPS를 켭니다.
5. 회원가입 이메일 확인을 사용하면 Supabase Authentication → URL Configuration → Redirect URLs에 https://seoripul.saevit.online/** 를 추가합니다. 기존 두 사이트 URL은 유지합니다.

## 임시 정보 교체

- 로고/파비콘: assets/seoripul-logo.svg, assets/seoripul-hor.svg, assets/favicon.svg
- 열린구청장실 로고: assets/mayors/office-seoripul.svg
- 구청장 이름·프로필·인사말: mayor-office-config.js / 메인 소개: site-content.js
- 기본색은 기존 파랑·빨강을 임시 사용합니다. 상징색은 symbols-config.js와 CSS에서 확정 후 교체합니다.
- 청사 주소·전화번호·지도·연혁·상징·노래 등은 준비 중으로 두었습니다. site-config.json은 현황 기록용이며 자동으로 모든 화면을 바꾸는 설정 파일은 아닙니다.
- 배너는 메인 하단의 배너 관리에서, 회원 승인도 같은 영역에서 기존 관리자 계정으로 관리합니다.

## 데이터 분리

- 콘텐츠: seoripul_* 테이블/RPC, seoripul-news-files / seoripul-notice-files / seoripul-publication-files / seoripul-photo-files 비공개 버킷
- 공통: news_admins, 회원가입 승인, site_home_banners(site=seoripul), 숫자 주소 매핑(site=seoripul)
- 사진 입력 DOM ID는 photo-files 그대로 유지합니다. 저장 버킷 이름과 DOM ID를 일괄 치환하지 마세요.
- 게시글 번호는 서버에서 발급하며 삭제된 번호는 재사용하지 않습니다. 5분 주기의 share-previews 워크플로가 정적 공유 카드도 갱신합니다.

로컬 및 CI 검증 방법은 scripts/validate-site.cjs와 .github/workflows/validate.yml을 참고하세요.
