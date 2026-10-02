# 내 PC에서 지도 띄우기

[GeOnDT 소개](../README.md)

**예제를 하나 선택하고 실행하면, 브라우저에서 지도를 움직여 볼 수 있습니다.** 기본 제공되는 **`localhost` 도메인 라이선스**를 사용합니다. 처음 실행할 때 설정 파일을 수정하거나 라이선스를 따로 요청할 필요는 없습니다.

## 1. 예제를 선택하세요

| 하고 싶은 일 | 선택할 예제 |
|---|---|
| JavaScript로 간단하게 시작하기 | **[esm](../starters/esm/)** — 앱 빌드 없이 브라우저에서 실행 |
| TypeScript로 개발하기 | **[typescript-vite](../starters/typescript-vite/)** — 타입 검사와 앱 빌드 제공 |

두 예제의 지도 기능은 같습니다. 라이선스 로드, 제품 초기화, 지도 생성·해제와 기본 오류 표시가 준비되어 있습니다.

## 2. 선택한 예제를 실행하세요

**준비:** Node.js 22.12 이상과 npm을 설치하고, 아카이브 전체를 다운로드해 압축을 푸세요. `README.md`·`dist`·`starters`가 보이는 폴더에서 터미널을 엽니다.

아래에서 **선택한 예제의 명령만** 실행하세요.

**JavaScript를 선택했다면**

```sh
cd starters/esm
npm run setup
npm start
```

**TypeScript를 선택했다면**

```sh
cd starters/typescript-vite
npm run setup
npm ci
npm run dev
```

**브라우저에서 [http://localhost:5173/](http://localhost:5173/)을 여세요.** 배경지도가 표시되면 마우스로 이동·확대해 보세요. 화면의 **지도 해제 → 지도 생성** 버튼으로 다시 만들 수도 있습니다.

> 다음에 다시 실행할 때는 예제 폴더에서 **`npm start`**(JavaScript) 또는 **`npm run dev`**(TypeScript)만 실행하세요. 준비·설치는 처음 한 번이면 됩니다. 서버 종료는 터미널에서 `Ctrl+C`입니다.

## 3. 원하는 부분부터 바꿔 보세요

아래 경로는 선택한 예제 폴더를 기준으로 합니다. JavaScript는 `.js`, TypeScript는 `.ts` 파일을 수정하세요.

| 바꾸고 싶은 것 | 열어 볼 파일 | 수정할 부분 |
|---|---|---|
| 처음 보이는 위치·배경지도 | `src/settings.js` 또는 `src/settings.ts` | `home`: 초기 위치, `imageryUrl`: 배경지도 주소 |
| 지도에 연결할 기능·이벤트 | `src/main.js` 또는 `src/main.ts` | 지도 생성 이후의 기능 코드 |
| 버튼·화면 배치·지도 크기 | `index.html`, `style.css` | HTML과 스타일 |

기능을 추가할 때는 **[공식 예제](../doc/tutorial-official/index.html)**에서 사용 코드를 찾고, **[API 문서](../doc/api/index.html)**에서 옵션과 메서드를 확인하세요. 기존 서비스에 적용한다면 현재 프로젝트에 필요한 초기화·타입·리소스 연결 코드를 참고하면 됩니다.

## 필요할 때 펼쳐 보세요

<details>
<summary><strong>실행이 안 되거나 지도가 보이지 않아요</strong></summary>

| 보이는 상황 | 확인할 내용 |
|---|---|
| `node`·`npm` 명령을 찾지 못함 | Node.js 설치 후 터미널을 다시 열고 `node --version`으로 22.12 이상인지 확인하세요. |
| `static/geondt가 이미 있습니다` | 이미 준비된 예제입니다. 다시 준비할 필요가 없다면 `npm start` 또는 `npm run dev`로 실행하세요. 제품 교체나 복사 실패 복구는 아래 **제품 배포본 바꾸기**를 참고하세요. |
| 5173 포트를 사용할 수 없음 | 다른 예제나 개발 서버가 실행 중이면 먼저 종료하세요. |
| 라이선스 인증 실패 | 주소가 **`localhost`**인지 확인하세요. `127.0.0.1`이나 PC의 IP는 별도 접속 주소입니다. 개발자 도구의 Console에서 아래 인증 로그를 확인하세요. |
| 제품 초기화 실패 | 화면·Console의 오류와 Network의 실패 요청을 확인하세요. `static/geondt`에 제품과 `GeOnDT.config.js`가 있는지 확인하세요. |
| 배경지도만 보이지 않음 | 기본 배경지도는 VWorld 영상지도입니다. 인터넷 연결과 Network의 타일 요청을 확인하세요. |

정상 인증 시 Console에 다음 메시지가 표시됩니다.

```text
GeOnDT for JS 라이센스 인증완료.
```

라이선스 인증과 지도 데이터 로드는 별도 단계입니다. 예제는 기본 오류를 화면과 Console에 표시합니다. 설정을 고쳤다면 페이지를 새로고침하세요. `index.html`을 더블클릭하지 말고 위의 개발 서버 주소로 접속하세요.

</details>

<details>
<summary><strong>새로 생긴 static·node_modules·build 폴더는 무엇인가요?</strong></summary>

**다운로드할 때는 없는 폴더입니다.** 다음 명령을 실행하면 선택한 예제 폴더 안에 만들어집니다.

| 폴더 | 만드는 명령 | 들어 있는 내용 |
|---|---|---|
| `static` | `npm run setup` | 실행에 사용할 제품 복사본(`geondt`)과 라이선스(`license.js`) |
| `node_modules` | `npm ci` — TypeScript 예제 | TypeScript·Vite 등 개발 도구 |
| `build` | `npm run build` — TypeScript 예제 | 서버에 올릴 앱과 제품 파일 |

제품 원본은 아카이브의 `dist`에, 기본 라이선스는 `starters/license.js`에 한 번씩 제공됩니다. `setup`은 선택한 예제에 실행용 복사본을 만들고, 복사본의 `GeOnDT.config.js`에 예제용 경로를 설정합니다. 원본 파일은 바뀌지 않습니다.

예제의 `.gitignore`는 이 세 폴더를 Git 추적에서 제외합니다. 일반 JavaScript 예제는 의존성 설치와 앱 빌드 단계가 없어 `static`만 생성됩니다.

</details>

<details>
<summary><strong>타입을 검사하고 서비스에 배포하고 싶어요</strong></summary>

**TypeScript / Vite**

예제 폴더에서 실행하세요.

```sh
npm run build
npm run preview
```

`build`는 **타입 검사 후 앱을 빌드**합니다. [http://localhost:4173/](http://localhost:4173/)에서 빌드 결과를 확인하고, 서버에는 **`build` 폴더 안의 내용물 전체**를 올리세요. 타입만 검사하려면 `npm run typecheck`를 사용하세요. `npm run dev`는 타입 검사를 수행하지 않습니다.

Vite는 고객 앱을 빌드하고, GeOnDT는 `static/geondt`의 파일을 그대로 복사합니다. 제품 JS·타입·worker·리소스를 같은 배포본으로 유지하세요. TypeScript는 `static/geondt/GeOnDT.modules.d.ts`와 그 선언이 참조하는 `types`를 사용합니다.

**일반 JavaScript / ES 모듈**

앱 빌드 없이 아래 파일을 HTTP 서버의 서비스 폴더에 배치하세요. `static`은 **폴더 안의 내용물**을 옮깁니다.

```text
서비스 폴더/
├─ index.html
├─ style.css
├─ src/
├─ license.js    ← static/license.js
└─ geondt/       ← static/geondt 전체
```

**두 예제 공통:** 서비스 도메인에 맞는 라이선스를 적용하세요. 하위 경로에 배치한다면 `/my-service/`처럼 끝에 `/`를 붙이거나 `/my-service/index.html`로 접속하세요. 서버는 JS·WASM 요청에 해당 파일과 올바른 Content-Type을 반환해야 합니다. 별도 SPA 라우팅은 예제에 포함되어 있지 않습니다.

</details>

<details>
<summary><strong>서비스 도메인이나 제품 경로를 바꾸고 싶어요</strong></summary>

**라이선스 교체:** `localhost` 외의 개발·운영 도메인은 [라이선스 요청 페이지](https://3d-wiki.geon.kr/?page_id=153)에 해당 도메인을 전달해 발급받으세요. 예제의 **`static/license.js`를 교체**하면 됩니다. TypeScript 예제는 교체 후 다시 빌드해 배포하세요.

기본 경로를 바꾸는 경우에만 아래 설정을 수정하세요.

| 변경하려는 경로 | 설정 위치 |
|---|---|
| 라이선스·제품 모듈 URL | `src/settings.js` 또는 `src/settings.ts`의 `licenseUrl`·`moduleUrl` |
| 제품의 worker·resource·wasm 기준 URL | `static/geondt/GeOnDT.config.js`의 `baseUrl` |

기본 `baseUrl`은 `GeOnDT.config.js`가 있는 폴더를 가리킵니다. 별도 서버에 제품 리소스를 배치하면 그 디렉터리 URL로 설정하고 교차 출처 요청 조건도 확인하세요. 설정 파일은 제품 초기화에 필요합니다.

</details>

<details>
<summary><strong>예제를 별도 프로젝트로 옮기거나 제품 배포본을 바꾸고 싶어요</strong></summary>

`setup`까지 마친 예제는 **생성된 `static`을 포함해** 폴더 전체를 원하는 작업 위치로 옮겨 사용할 수 있습니다. 아직 준비하지 않았거나 다른 배포본을 사용하려면 예제 폴더에서 경로를 지정하세요.

```sh
npm run setup -- --sdk "D:/delivery/dist" --license "D:/delivery/license.js"
```

**이미 `static/geondt`가 있다면:** 수정한 설정을 백업하고 **해당 예제의 `static/geondt`만** 삭제한 뒤 준비 명령을 다시 실행하세요. 복사 도중 실패해 폴더가 일부만 생성된 경우도 같습니다. 준비 후 필요한 설정을 다시 적용하세요.

기존 `static/license.js`는 유지됩니다. 라이선스도 바꾸려면 이 파일을 직접 교체하세요. TypeScript 예제는 제품 교체 후 타입 검사와 빌드로 호환성을 확인하세요.

</details>

AI에게 기능 구현을 맡긴다면 [AI 작업자를 위한 개발 지침](development-guide.md)을 함께 전달하세요.
