# Superior Highlighter

Obsidian 읽기 보기에서 선택한 부분을 정확하게 하이라이트합니다. 앞뒤 문맥으로 위치를 확인하고 `==🔴텍스트==` 같은 기본 하이라이트 형식으로 저장합니다.

[GitHub 저장소](https://github.com/owjxyz/Obsidian-Highlighter) · [Obsidian 커뮤니티 등록 페이지](https://community.obsidian.md/plugins/superior-highlighter) · 개발자 [WooJIN OH (owjxyz)](https://github.com/owjxyz)

[KOREAN](README.ko.md) · [ENGLISH](README.md)

## 주요 기능

- **정확한 선택 범위.** 문장·목록·표 셀의 일부만 강조하고, 선택 밖의 텍스트와 색상은 유지합니다.
- **기본 하이라이트 색상.** 툴바나 단축키로 여섯 가지 색상을 적용합니다. 각주 팝업 안에서도 사용할 수 있습니다.
- **하이라이트 관리.** 현재 노트의 탐색기에서 검색·색상 변경·제거·병합·기존 HTML 강조 변환·마지막 작업 되돌리기를 제공합니다.

## 설치와 사용

1. **설정 → 커뮤니티 플러그인 → 탐색**에서 **Superior Highlighter**를 검색해 설치하고 활성화합니다.
2. **읽기 보기**에서 텍스트를 선택하고 툴바의 기능을 누릅니다.
3. 단축키는 **설정 → 단축키 → Superior Highlighter**에서 지정합니다.

수동 설치: [최신 배포](https://github.com/owjxyz/Obsidian-Highlighter/releases/latest)의 `main.js`, `manifest.json`, `styles.css`를 `<vault>/.obsidian/plugins/superior-highlighter/`에 넣고 플러그인을 활성화합니다.

<details>
<summary>터미널 설치와 업데이트</summary>

Python 3.9 이상이 필요합니다. Obsidian을 종료하고 대상 보관함 폴더에서 실행합니다.

**macOS**

```sh
curl -fsSL https://raw.githubusercontent.com/owjxyz/Obsidian-Highlighter/main/install.py | python3 -
```

**Windows PowerShell**

```powershell
curl.exe -fsSL https://raw.githubusercontent.com/owjxyz/Obsidian-Highlighter/main/install.py | py -3 -
```

PowerShell 5.1의 `curl`은 다른 명령어의 별칭이므로 `curl.exe`를 사용합니다. `py`가 없으면 Python 3.9 이상에서 `python -`로 바꿉니다. 다른 보관함에 적용하려면 `python3 -` 또는 `py -3 -` 뒤에 경로를 따옴표로 감싸 추가합니다. 예: `python3 - "/Users/you/Obsidian Vault"` 또는 `py -3 - "C:\Users\you\Obsidian Vault"`.

설치 프로그램은 최신 정식 배포의 체크섬을 검증하고 변경할 파일을 백업합니다. 기존 설정은 보존하며, Reader Highlighter Tags 설정을 이전하고 해당 플러그인을 비활성화하되 파일은 남깁니다. 단축키는 바꾸지 않습니다. 개인 단축키 설정은 [Obsidian Vault Init](https://github.com/owjxyz/Obsidian-Vault-Init)에서 적용할 수 있습니다. 업데이트할 때는 다시 실행합니다. 시험 배포는 제외하며, 조회·검증에 실패하면 보관함을 변경하지 않습니다.

</details>

## 알아두기

- **단축키 토글:** 같은 색이면 선택 범위를 포함한 기존 하이라이트 전체를 해제하고, 다른 색이면 선택 부분의 색만 바꿉니다. 일반 하이라이트 토글은 색상과 관계없이 기존 강조를 해제합니다. 툴바의 색상·제거 버튼은 선택 부분에만 적용됩니다. 여러 줄·셀에서는 각 줄·셀에 이 규칙을 적용합니다.
- **선택 제한:** 링크 표시명이나 인라인 코드는 화면에 보이는 텍스트 전체를 선택합니다. 임베드를 가로질러 선택할 때는 한 노트 안에 머물러야 합니다. 위치가 불분명하거나 원문이 바뀌었거나 표시 문법을 해석할 수 없으면 수정하지 않습니다.
- **스마트 문단 선택**을 켜면 문단 전체를 선택합니다. 기본값은 꺼짐입니다.
- **이전 노트:** 저장된 태그·각주·인용문은 유지합니다. 태그 관리, 각주 주석 생성, 인용 복사, 전체 보관함 연구 보기, 내보내기, PDF 지원, 읽기 위치 추적 기능은 제외했으며, 지원하는 하이라이트 설정만 불러옵니다.

## 데이터 접근

선택한 텍스트가 속한 노트와 임베드 원본을 읽고 수정합니다. 보관함 전체 검사나 PDF 처리는 하지 않습니다. 탐색기의 **Copy**는 선택 항목만 클립보드에 쓰며 기존 클립보드는 읽지 않습니다. 노트 본문·파일 경로·클립보드 내용을 서버로 전송하지 않습니다.

<details>
<summary>개발과 배포 검증</summary>

Node.js와 Python이 필요합니다.

```sh
npm ci
npm test
npm run typecheck
npm run build
python3 test_metadata.py
python3 test_install.py
```

Windows에서는 `python3` 대신 `py -3` 또는 `python`을 사용합니다.

GitHub Actions는 main 브랜치 변경과 버전 태그를 빌드·검사하고, 저장소의 체크섬을 확인한 뒤 `main.js`, `manifest.json`, `styles.css`의 빌드 출처를 증명합니다. 태그는 릴리즈 초안을 준비하며, 공개는 별도로 진행합니다. 브랜치에서 수동 실행하면 빌드와 출처 증명만 수행합니다.

배포 파일은 `gh attestation verify main.js --repo owjxyz/Obsidian-Highlighter`로 검증할 수 있습니다(`manifest.json`, `styles.css`도 동일). 릴리즈에는 이 세 파일만 첨부합니다. 터미널 설치 프로그램은 GitHub Releases API의 SHA-256 값으로 다운로드를 검증하며, `SHA256SUMS`는 CI 검증용으로 저장소에만 유지합니다. 이 자동화는 기존 릴리즈를 변경하지 않습니다.

</details>

## 라이선스

[MIT](LICENSE). DuckTapeKiller의 [Reader Highlighter Tags](https://github.com/DuckTapeKiller/obsidian-reader-highlighter-tags)를 바탕으로 만든 독립 개선판이며, WooJIN OH (owjxyz)가 관리합니다.
