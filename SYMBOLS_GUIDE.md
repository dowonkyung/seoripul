# 심벌마크(CI) 이미지 교체

두 이미지 박스는 각각 업로드한 이미지 한 장만 표시합니다. 이미지 내부의 배치·글자는 업로드할 파일 안에 넣어 주세요.

1. assets/ci/symbol-mark.png 를 업로드합니다. 첫 번째 ci-image-box에 들어갑니다.
2. assets/ci/logotype.png 를 업로드합니다. 로고타입 ci-logotype-box에 들어갑니다.
3. assets/ci/ci.ai 를 업로드합니다. CI 자료 내려받기 버튼이 이 파일을 직접 다운로드합니다.

파일명이나 확장자를 바꾸려면 symbols-config.js 맨 위의 ci 항목에서 symbolImage, logotypeImage, aiFile 경로를 수정하세요. SVG/JPG 등 다른 이미지도 사용할 수 있습니다.

설명·색상은 symbols-config.js의 mark 항목을 사용합니다. 자동 갱신 작업이 scripts/sync-navigation.cjs를 실행하면 CI 본문이 재생성됩니다. 로컬에서도 같은 명령으로 갱신할 수 있습니다.

파일이 없는 동안 이미지 박스는 비워두고 AI 다운로드 버튼은 비활성화합니다. 다운로드 선택창은 사용하지 않습니다. 방침 페이지는 계속 준비 중으로 표시합니다.


## 구정방침

`symbols-config.js`의 `policy`에서 이미지(`image`), 설명(`description`), 단일 AI 다운로드 파일(`aiFile`)을 지정합니다. 기본 경로는 `assets/policy/policy.png`와 `assets/policy/policy.ai`입니다. 설명 줄바꿈은 `\n`을 사용합니다. 파일을 업로드하면 자동 생성 작업이 페이지에 반영합니다.
