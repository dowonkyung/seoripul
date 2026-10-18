# 구의 상징 수정 안내

**symbols-config.js**에서 이미지 경로와 소개 문구를 수정합니다. HTML이나 디자인 코드를 바꿀 필요가 없습니다.

- mark: 구마크. 현재 구마크·상단 로고를 사용합니다. signatures에서 각 조합의 label(이름), image(이미지 파일 경로)를 바꾸세요. image가 비어 있으면 준비 중 카드가 표시됩니다.
- brand: 도시브랜드. image와 description, details를 바꿀 수 있습니다. 구 상징 색체는 mark.colors의 이름·HEX·RGB에서 수정합니다. typefaces는 지정서체 소개입니다.
- character: 구캐릭터. 임시 이미지를 전용 이미지로 바꾸고 이름·설명을 입력하세요.
- slogan: 구정구호. 메인화면에서 사용 중인 assets/slogan.png를 연결했습니다. image 경로로 다른 파일을 지정할 수 있습니다.
- downloads: [{label:'AI 다운로드',href:'assets/symbols/mark.ai'},{label:'PDF 다운로드',href:'assets/symbols/mark.pdf'}]처럼 실제로 업로드한 파일을 연결하세요. 비어 있는 배열 []이면 버튼을 표시하지 않습니다.
- 새 이미지를 assets/symbols/ 폴더에 올리고 파일명을 포함한 경로를 입력하세요. 배경이 투명한 PNG 또는 SVG를 권장합니다. 실제로 등록한 파일만 다운로드 버튼으로 연결됩니다.

원본의 이미지·설명 배치, 조합 이미지 격자, 색채·서체 영역, 페이지 목차를 따릅니다. CI표준화규정집 및 표는 제외했습니다. 전용 자료가 없는 항목은 임시 이미지와 준비 중 문구입니다.

게시판 주소는 기존 news.html?id=UUID 형태로 복원했습니다. 이전에 숫자 번호 SQL을 실행했다면 public_id 열을 지울 필요는 없으며 현재 화면에서는 사용하지 않습니다.
