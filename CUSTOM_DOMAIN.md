# Spaceship 도메인 연결

연결 주소: `https://seoripul.saevit.online/`

저장소 루트의 `CNAME` 파일에는 `seoripul.saevit.online`을 넣었습니다. DNS 설정은 별도로 완료해야 합니다.

1. GitHub 저장소의 **Settings → Pages → Custom domain**에 `seoripul.saevit.online`이 표시되는지 확인합니다. 비어 있으면 입력하고 **Save**합니다. `https://`나 경로를 붙이지 않습니다.
2. Spaceship의 **Advanced DNS → saevit.online → DNS records → Custom records**에서 아래 레코드를 추가하고 저장합니다.

| 항목 | 값 |
|---|---|
| Type | CNAME |
| Host / Name | seoripul |
| Value / Target | dowonkyung.github.io |
| TTL | 기본값 또는 Automatic |

대상에는 `https://`나 `/seoripul/`을 붙이지 않습니다. `@`나 `www`의 기존 레코드는 이번 하위 도메인 연결을 위해 변경할 필요가 없습니다. 같은 이름 `seoripul`에 기존 A·AAAA·CNAME 레코드가 있다면 중복 대신 올바른 레코드 하나로 정리합니다.

3. GitHub Pages의 DNS 검사 통과 후 **Enforce HTTPS**를 켭니다. DNS 반영과 인증서 준비는 최대 24시간 걸릴 수 있습니다.
4. 새 주소에서 홈페이지·새소식·본문 사진·첨부파일을 확인하고 관리자 계정으로 다시 로그인합니다. 로그인 세션과 이 기기 임시글은 주소별로 저장되므로, 이전 주소의 임시글은 이전 주소에서 확인합니다.
5. Supabase Authentication의 URL Configuration → Site URL도 `https://seoripul.saevit.online/`로 갱신합니다. 현재 이메일·비밀번호 로그인은 유지됩니다.

현재 사이트는 상대 경로로 파일을 참조하므로 도메인 전환을 위해 HTML의 링크를 일괄 변경하지 않아도 됩니다. 브랜치 배포에서 `CNAME` 파일을 유지하세요. GitHub Actions 배포로 변경한다면 Pages 설정에서 Custom domain을 직접 관리합니다.

공식 안내: [GitHub Pages 하위 도메인 연결](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain), [Spaceship DNS 관리](https://www.spaceship.com/knowledgebase/dns-alias-record/).
