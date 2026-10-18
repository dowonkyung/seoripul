# 푸터 배너 이미지와 링크 바꾸기

홈페이지·새소식 목록·게시글·글쓰기의 두 배너는 `footer-config.js` 한 파일에서 함께 변경합니다.

1. GitHub 저장소의 `assets/` 폴더를 열고 **Add file → Upload files**로 새 SVG·PNG·JPG·WebP 이미지를 올립니다.
2. `footer-config.js`를 열고 연필 아이콘으로 편집합니다. 첫 항목은 국가상징, 두 번째는 접근성 안내입니다.
3. `image`에는 올린 이미지 경로, `href`에는 이동할 주소, `alt`에는 이미지 설명을 적습니다. `newTab: true`면 새 창, `false`면 현재 창으로 열립니다.

```js
window.SEORIPUL_FOOTER_BADGES = [
  { image: 'assets/my-symbols.svg', href: 'https://example.com/symbols', alt: '국가상징 알아보기', newTab: true },
  { image: 'assets/my-accessibility.png', href: 'accessibility.html', alt: '접근성 이용 안내', newTab: false }
];
```

`example.com`은 예시이므로 실제 주소로 바꾸세요. `accessibility.html`처럼 저장소 안의 파일을 연결할 수도 있습니다. 이동할 파일 역시 저장소에 있어야 합니다. 파일명은 대소문자까지 일치시켜 주세요.

**Commit changes**로 저장하고 Pages 배포가 끝나면 새로고침합니다. 이미지는 기존 배너 영역에 비율을 유지해 들어갑니다. `href: ''`로 비우면 기존 준비 중 안내를 유지합니다. HTML을 페이지마다 수정할 필요는 없습니다.
