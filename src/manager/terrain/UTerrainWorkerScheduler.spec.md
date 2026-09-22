# UTerrainWorkerScheduler 명세

> 상태: 구현 관찰 초안

## 목적과 책임

Worker별 실행 순서를 유지하면서 동일 타일의 대기 작업을 최신 세대·리비전으로 병합하고 Admission 한도 안에서 처리한다.

```spec
UTerrainWorkerScheduler
    enqueue(workerIndex, callback, opt):
        동일 tile slot에는 최신 generation과 revision 작업 하나만 유지한다.
        동일 generation의 대기 작업 갱신은 최초 Promise owner를 유지한다.
        새 generation은 revision이 낮아도 이전 generation 대기 작업을 교체한다.
        동일 generation과 revision이 Required Coverage로 승격되면 기존 background 작업을 교체한다.
        Worker별 live 대기 Queue는 Soft Limit 8, Hard Limit 16으로 제한한다.
```

## 공개 계약과 제약

- 실행 중인 작업은 강제 중단하지 않고 dispatch 전 최신성 검사로 결과 반영을 막는다.
- 대기 Queue의 동일 타일 작업은 세대별로 중복 보관하지 않는다.
- Soft·Hard limit 설정값은 live 대기 Queue 상한을 넘을 수 없다.

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
