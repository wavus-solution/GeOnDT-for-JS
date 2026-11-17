# Yield 명세

> 상태: 구현 관찰 초안

- 연결 소스: `union3d/util/Yield.js`

## 목적과 책임

브라우저 입력 대기 상태와 프레임 경계에 맞춰 메인 스레드 작업권을 안전하게 양보한다.

```spec
Yield(): 입력이 대기 중이면 다음 작업으로 양보하고, 대기 입력이 없으면 즉시 완료한다.
forceYield(): 항상 다음 작업으로 양보한다.
yieldForRendering(): 병행 요청이 한 화면 갱신을 공유하고 그 뒤의 작업에서 재개한다.
```

## 공개 계약과 제약

- `navigator.scheduling.isInputPending()`이 존재하는 환경과 없는 환경 모두 Promise를 정상 완료해야 한다.
- `yieldForRendering()`은 숨겨진 문서·Worker에서는 `forceYield()`를 사용한다. 화면 갱신이 중단되면 50ms 대체 타이머로 진행하며, 완료·실패 뒤 공유 대기를 비우고 예약한 타이머·화면 갱신을 정리한다.
- PBF 변환·WFS 피처 준비·지형 payload 수집은 기존 예산을 유지하면서 `yieldForRendering()`을 `forceYield`라는 지역 이름으로 호출한다. 공개 결과·큐 순서·취소 후 현재성 확인은 유지한다.

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
