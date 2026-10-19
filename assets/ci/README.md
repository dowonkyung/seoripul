# CI 이미지와 AI 파일

이 폴더에 아래 파일을 올리면 자동으로 적용됩니다.

- symbol-mark.png: 첫 번째 ci-image-box에 표시할 이미지 한 장
- logotype.png: ci-logotype-box에 표시할 이미지 한 장
- ci.ai: 하단 CI 자료 내려받기 버튼에서 바로 다운로드할 파일 한 개

다른 파일명·확장자를 쓰려면 저장소 루트 symbols-config.js의 ci.symbolImage, ci.logotypeImage, ci.aiFile 값을 수정하세요. SVG, JPG, WebP 등 이미지도 지정할 수 있습니다.

파일이 없으면 이미지 박스는 비어 있으며 다운로드 버튼은 비활성화됩니다. GitHub의 자동 갱신·배포가 끝나면 반영됩니다.
