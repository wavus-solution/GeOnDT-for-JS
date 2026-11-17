# UModelFrameState 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

모델 타일 자식들의 레이어 작업을 부모 단위로 모아 실행하고 완료 상태를 연결한다.

### 1.2 책임 범위

모델 작업 생성·등록과 부모별 완료 집계, 자식 폐기와 모델 로드 이벤트를 담당한다.

### 1.3 주요 동작 방식

기존 대기 작업은 유지하며 추가 작업을 같은 작업 상태로 합친다. 모든 작업이 종결되면 자식 완료 상태와 이벤트를 반영한다.

### 1.4 주요 사용처와 연계 대상

U3dQuadModelTile.update가 갱신과 폐기를 요청하고 U3dQuadTileProcess가 개별 모델 작업을 실행한다.

## 3. 정규 자연어 수도코드

```spec
UModelFrameState extends UFrameState 클래스 정의
    의존: UFrameState — 프레임 상태 기반; 상속: {UFrameState}

    _modelProcess: U3dQuadTileProcess
        모델 메인 작업을 생성·등록하는 처리기다.

    constructor(opt: object)
        의존: UFrameState — 공통 프레임 상태 초기화; 생성자: {constructor()}
        동작: 기반 생성자에 opt를 전달하고 opt.modelProcess를 모델 처리기로 저장한다.

    override dispose() -> void
        의존: UFrameState — 공통 참조 정리; 함수: {dispose()}
        동작: 기반 폐기를 실행하고 모델 처리기 참조를 undefined로 지운다.

    override addUpdate(tile: U3dQuadTile, force: boolean, forceBox?: Box3) -> void
        동작:
            tile, 빈 works 배열, workedCount 0, totalCount 0을 가진 Map을 만든다.
            작업을 수집하고 forceBox를 전달하여 실행한다.

    override setWork(force: boolean, workInfo: Map) -> void
        의존:
            U3dQuadTileProcess — 자식별 작업 생성; 함수: {getWork()}
            U3dQuadTile — 자식과 완료 이력; 함수: {hasEndWork(), deleteEndWork(), setUpdateDate()}; 속성 읽기: {_childTiles, _rlevel, _drawArg, _disposed}
            UDrawArg — 생성 대상 레벨; 함수: {getPassLevel()}
            U3dLayer — 완료 작업 캐시 확인; 함수: {getCache()}
        동작:
            폐기된 자식은 건너뛰고 살아 있는 자식 중 pass 레벨 이상인 경우에만 getWork(child, force)를 호출한다.
            부모에 완료 기록이 있고 레이어 캐시가 남은 작업은 제외한다. 캐시가 없으면 해당 완료 기록을 삭제한 뒤 작업 목록에 추가한다.
            totalCount에 목록 길이, force에 전달값을 기록하고 부모의 갱신 시각을 설정한다.

    override addDispose(targetTile: U3dQuadTile) -> void
        의존:
            defined — 사분면 자식 존재 검사; 함수: {defined()}
            U3dQuadTile — 이전 자식 폐기와 작업 소유 상태 분리; 함수: {dispose()}; 속성 읽기·쓰기: {_waitWork, _endWork, _processed, _workState, _childTiles, _northWestChild, _northEastChild, _southWestChild, _southEastChild}; 속성 쓰기: {_disposeCause}
            U3dQuadTileTask — 이전 대기 작업 취소와 참조 해제; 함수: {dispose()}; 속성 읽기: {ready}
            UErrorCollector — 독립 정리와 오류 보존; 생성자: {new UErrorCollector()}; 함수: {attempt(), finish()}
            UDEF — 폐기 사유와 작업 상태; 속성 읽기: {TILES_DISPOSE_TYPE, PROCESS}
        동작:
            부모 _workState를 삭제하고 _processed를 NONE으로 바꾼다. 네 사분면 자식이 모두 없고 대기·완료 기록도 비었으면 새 배열이나 Map을 만들지 않고 반환한다.
            이전 네 자식과 대기·완료 Map을 지역 참조로 포착한다. 외부 알림 전에 부모 사분면 참조를 모두 undefined로, _childTiles를 새 빈 배열로, 대기·완료 기록을 새 Map으로 바꿔 새 검색이 이전 정리 목록에 포함되지 않게 한다.
            포착한 이전 자식만 PARENTCULLED 사유로 폐기한다. 하나의 폐기가 실패해도 다른 이전 자식을 계속 정리한다. 자식의 해제 알림이 실행 중 요청을 취소하도록 작업 reject보다 먼저 자식을 폐기한다.
            남은 이전 대기 작업의 ready.reject와 dispose를 각각 시도하고 이전 Map을 비운다. 이전 완료 작업의 dispose도 각각 시도한 뒤 이전 Map을 비운다. 이 알림에서 등록한 새 자식·작업·회차 상태는 수정하지 않는다.
            모든 정리가 끝나면 수집한 실패를 전달한다. 하나이면 원래 오류, 여러 개이면 정리 순서의 오류들을 errors에 담아 전달한다.

    override doWork(force: boolean, workInfo: Map, forceBox?: Box3) -> void
        의존:
            U3dQuadTile — 자식 준비와 대기 등록; 함수: {isWait(), isInitialized(), createMesh(), setLastUpdateDate(), setWaitWork(), getWaitWork()}; 속성 읽기·쓰기: {_processed, _worked, _workState, _waitWork, _endWork, _childTiles, _disposed}
            U3dLayer — 완료 캐시의 장면 반영; 함수: {getVisible(), getTileFromScene(), addTileFromScene()}
            U3dQuadTileTask — 작업 상태 연결과 종결 수신; 함수: {setInfo()}; 속성 읽기: {name, scope, item, ready}
            U3dQuadTileProcess — 모델 작업 등록; 함수: {enqueueWork()}
            UDrawArg — 자식 등록; 함수: {addTile()}
            U3dQuadSet — 모델 완료 이벤트; 함수: {dispatchEvent()}
            UDEF — 진행 상태; 속성 읽기: {PROCESS}
            U3dEvent — 모델 이벤트 종류; 속성 읽기: {TILE}
        동작:
            작업 목록이 비고 부모 대기도 없으면 현재 workInfo를 부모 _workState에 보관해 이번 통지를 식별한다. 살아 있는 완료 타일 중 표시 레이어의 장면에 없는 것을 부착하고 부모 최종 갱신 시각과 살아 있는 자식의 MODEL_LOADED 이벤트를 반영한다. 부착·알림 뒤 부모 폐기 또는 _workState 변경을 확인하여 중첩 검색 이후에는 이전 통지를 중단한다. finally에서 _workState가 이번 workInfo와 같은 경우에만 삭제한다. 목록이 비면 반환한다.
            부모가 LOADING이고 이전 _workState가 있으면 preWorks·totalCount·workedCount를 이전 상태와 합치고 기존 대기 작업의 workState 참조도 새 Map으로 바꾼다. 그 외에는 부모 _processed와 살아 있는 자식의 _worked를 LOADING으로 설정한다.
            부모 _workState를 새 Map으로 바꾼다. 살아 있는 자식만 준비하며 초기화되지 않은 자식은 createMesh(null, tile._drawArg)로 준비하고 addTile로 등록한다.
            각 작업에 workState와 ready의 성공·실패 콜백을 연결하고 부모 setWaitWork 후 모델 처리기에 enqueueWork한다.
            완료 콜백은 보관한 작업을 사용하며 부모가 폐기되었거나 같은 이름의 부모 대기 작업이 결과 객체와 다르면 반환한다. try에서 결과 자식이 살아 있고 레이어가 있으면 타일을 부착한 뒤 부모 폐기와 대기 작업의 동일성을 다시 확인한다. 결과 자식이 살아 있고 forceBox가 정의되어 있으면 FORCE_MODEL_LOADED를 발생시킨다. finally에서는 부모가 결과 작업을 계속 소유할 때만 자식의 폐기 여부와 관계없이 종결을 집계한다. 외부 부착·알림 오류가 발생해도 소유 중인 작업의 대기 목록을 정리하고 콜백 오류는 체인 끝의 catch에서 기록한다.

    override finishWork(tile: U3dQuadTile, obj: U3dQuadTileTask, force: boolean) -> void
        의존:
            U3dQuadTileTask — 작업 상태 조회와 참조 정리; 함수: {getInfo(), dispose()}; 속성 읽기: {name, item}
            U3dQuadTile — 완료·대기 이력과 자식 완료; 함수: {setEndWork(), deleteWaitWork(), dispatchEvent(), setLastUpdateDate()}; 속성 읽기·쓰기: {_workState, _processed, _worked, _childTiles}; 속성 읽기: {_disposed}
            UDrawArg — 완료 자식 등록; 함수: {addTile()}
            U3dQuadSet — 모델 완료 이벤트; 함수: {dispatchEvent()}
            UDEF — 완료 상태; 속성 읽기: {PROCESS}
            U3dEvent — 로드 이벤트 종류; 속성 읽기: {TILE}
        동작:
            결과의 workState를 얻고 작업을 dispose한다. 결과 자식이 살아 있을 때만 부모 완료 기록에 넣고 같은 이름의 대기 기록은 자식 폐기 여부와 관계없이 제거한다.
            workedCount가 falsy이면 1, 그 외에는 1 증가시켜 Map에 저장한다.
            workedCount와 totalCount가 같으면 부모와 살아 있는 모든 자식의 상태를 알림 전에 END로 바꾼다. 부모 _workState는 이번 workInfo를 유지한다. 별도 순회에서 살아 있는 자식을 addTile로 등록한 뒤 TILE.LOAD를 발생시키고 부모 폐기 또는 _workState 변경 시 반환한다. 자식만 폐기되면 해당 자식의 후속 알림을 건너뛴다. TILE.MODEL_LOADED 뒤에도 같은 검사를 적용하며 이번 회차가 유지되면 최종 갱신 시각을 설정한다. finally에서 부모 _workState가 이번 workInfo와 같은 경우에만 삭제하여 중첩 검색의 새 상태를 보존하고 예외·조기 반환에도 이번 참조를 정리한다.
            force는 이 함수에서 사용하지 않는다.

    override setVisibleTile() -> void
        동작: 모델 프레임 상태는 이 함수에서 표시 전환을 수행하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
