# 심벌마크(CI)와 구정방침

- ci.html: 심벌 이미지, 설명, 로고타입, 색상기준, CI 다운로드
- policy.html: 구정방침 준비 중 안내
- 기존 symbols.html은 ci.html로 연결됩니다. 기존 구호 바로가기는 policy.html로 연결됩니다.
- CI 이미지·설명·색상은 symbols-config.js의 mark 항목에서 수정합니다. RGB 값은 HEX 색상으로 계산합니다.
- 로고타입의 국문·영문 표기는 scripts/build-ci-pages.cjs에서 설정합니다.
- node scripts/sync-navigation.cjs를 실행하면 CI 본문과 모든 페이지의 메뉴가 함께 갱신됩니다. GitHub 자동 갱신 작업도 이 명령을 사용합니다.
- 기존 상징 페이지의 도시브랜드·캐릭터·구호 영역은 새 페이지에 표시하지 않습니다.
