# 메인 배너·구청장 소식·슬로건 교체

GitHub의 `assets/` 폴더에 새 이미지(SVG·PNG·JPG·WebP)를 올린 뒤 아래 설정 파일을 편집하고 **Commit changes**로 저장합니다. 파일명과 대소문자를 정확히 맞추고 Pages 배포 후 새로고침하세요.

## 메인 상단 소개 배너

`banners.js`의 `window.SEORIPUL_BANNERS` 배열을 수정합니다. 권장 비율은 **844 × 440**입니다.

```js
{ src: 'assets/banners/my-intro.png', alt: '이미지에 적힌 내용', href: 'news.html' }
```

`src`는 이미지 경로, `alt`는 이미지 설명, `href`는 실제 이동할 주소입니다. 기존 `page`를 유지하면 해당 메뉴의 안내가 열립니다. 실제 링크로 연결할 때는 `page` 대신 `href`를 씁니다. 항목을 추가하거나 지우면 슬라이드 수가 자동으로 바뀝니다. 자동 전환은 5초입니다.

## 구청장 소식 배너

`site-content.js`의 `window.SEORIPUL_MAYOR.banners` 배열을 수정합니다. 권장 비율은 **529 × 300**입니다.

```js
banners: [
  { src: 'assets/mayor-news-01.jpg', alt: '구청장 현장 방문', href: 'news.html' },
  { src: 'assets/mayor-news-02.jpg', alt: '구민과의 대화', href: 'news.html' }
]
```

사진이 영역에 맞게 일부 잘릴 수 있으므로 중요한 인물·문구를 가장자리에 배치하지 마세요.

## 구청장 하단 슬로건(mayor-slogan)

같은 `site-content.js`에서 두 값을 바꿉니다. 현재 이미지 비율은 **1400 × 142**이며, 이 비율로 만들면 기존 배치가 유지됩니다.

```js
slogan: 'assets/my-mayor-slogan.svg',
sloganAlt: '슬로건에 적힌 문구',
```

구청장 사진은 `portrait`, 이름은 `name`, 인사말은 `greeting`에서 수정할 수 있습니다. `portrait`는 데스크톱용이며, 태블릿 이하에서는 기존 배경과 인물이 합쳐진 `assets/reference/mayor_bg_t.png` 등의 이미지를 사용합니다.

## 알림 목록 오른쪽 배너

`index.html`의 `notice-content` 안 `.slide` 영역에 있는 이미지의 `src`·`alt`와 감싸는 링크의 `href`를 바꿉니다. 실제 URL을 지정하면 해당 링크의 `data-page`는 지워야 준비 중 안내가 대신 열리지 않습니다. 권장 비율은 **408 × 266**입니다.
