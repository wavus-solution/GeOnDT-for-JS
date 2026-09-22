# 예제 미리보기 만들기

Gallery 카드에 커서를 올리면 재생되는 미리보기 영상을 만드는 폴더입니다.

화면 녹화 원본(GIF·MP4 등)을 이 폴더에 두고 명령을 돌리면 `out/`에 WebM이 생깁니다.
같은 화면이라도 GIF는 수십 MB지만 WebM은 1MB 아래로 떨어져, 커서를 올릴 때 받아도 부담이 없습니다.

원본과 결과는 용량이 커서 저장소에 넣지 않습니다. 이 문서만 저장소에 남습니다.

## 쓰는 법

```bash
npm run 미리보기:GIF변환하기
```

이 폴더의 모든 원본을 변환합니다. 파일을 지정하면 그 하나만 변환합니다.

```bash
npm run 미리보기:GIF변환하기 -- selectModel.gif
```

변환할 수 있는 원본은 `.gif`, `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`입니다.

## 파일 이름 규칙

**원본 이름이 예제 이름과 같아야 합니다.** Gallery는 예제 이름으로 미리보기 주소를 만들기 때문입니다.

```
tutorial-official/preview/selectModel.gif      원본을 여기에 둡니다
tutorial-official/preview/out/selectModel.webm 명령이 여기에 만듭니다
```

## 올리는 곳

`out/`에 생긴 WebM만 미리보기 서버의 `thumbnails/edition/` 아래에 올립니다.

```
https://dt-data.mappick.co.kr/ServiceData/thumbnails/edition/selectModel.webm
```

카드에 처음 보이는 정지 이미지는 같은 위치의 `<예제이름>.png`입니다. 미리보기를 새로 만들 때
정지 이미지도 함께 올려 두어야 카드가 비어 보이지 않습니다.

서버가 바뀌면 `GEONDT_EXAMPLE_PREVIEW_BASE` 환경변수로 주소를 덮어씁니다.

## 옵션

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `--all` | — | 모든 파일 변환. 파일 이름을 적지 않으면 이미 적용됩니다. |
| `--width <숫자>` | `960` | 가로 크기. 세로는 비율대로 따라갑니다. |
| `--fps <숫자>` | `15` | 초당 프레임 |
| `--crf <숫자>` | `34` | 화질 기준값. 낮출수록 화질과 용량이 함께 올라갑니다. |
| `--start <초>` | — | 원본에서 잘라낼 시작 지점 |
| `--duration <초>` | — | 잘라낼 길이 |
| `--in <경로>` | `tutorial-official/preview` | 원본 폴더 |
| `--out <경로>` | `tutorial-official/preview/out` | 결과 폴더 |

기본값은 Gallery 카드 기준으로 잡았습니다. 카드는 커서를 올려도 370px 남짓으로 보여
가로 960px이면 고해상도 화면에도 충분하고, 화면 녹화는 15fps로도 부드럽습니다.

앞부분을 잘라내고 5초만 쓰고 싶다면 이렇게 씁니다.

```bash
npm run 미리보기:GIF변환하기 -- selectModel.gif --start 2 --duration 5
```

## 필요한 것

ffmpeg가 있어야 합니다. 저장소에 함께 받는 `ffmpeg-static`을 먼저 쓰고, 없으면 시스템에 설치된
ffmpeg를 찾습니다. 둘 다 없으면 이렇게 설치합니다.

```bash
npm i -D ffmpeg-static
```

## 결과 확인

변환이 끝나면 파일마다 줄어든 용량을 보여 줍니다.

```
[tutorial:preview] selectModel.gif -> selectModel.webm (34.93 MB → 381 KB, 98.9% 감소)
[tutorial:preview] 변환 완료 8개, 실패 0개
```

용량이 1MB를 크게 넘으면 `--duration`으로 길이를 줄이거나 `--crf` 값을 올려 보세요.
