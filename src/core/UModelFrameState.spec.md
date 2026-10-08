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
            U3dQuadTile — 자식과 완료 이력; 함수: {hasEndWork(), deleteEndWork(), setUpdateDate()}; 속성 읽기: {_childTiles, _rlevel, _drawArg}
            UDrawArg — 생성 대상 레벨; 함수: {getPassLevel()}
            U3dLayer — 완료 작업 캐시 확인; 함수: {getCache()}
        동작:
            pass 레벨 이상인 자식에 대해 getWork(child, force)를 호출한다.
            부모에 완료 기록이 있고 레이어 캐시가 남은 작업은 제외한다. 캐시가 없으면 해당 완료 기록을 삭제한 뒤 작업 목록에 추가한다.
            totalCount에 목록 길이, force에 전달값을 기록하고 부모의 갱신 시각을 설정한다.

    override addDispose(targetTile: U3dQuadTile) -> void
        의존:
            defined — 사분면 자식 존재 검사; 함수: {defined()}
            U3dQuadTile — 자식 폐기와 부모 대기 기록 정리; 함수: {dispose(), clearWaitWork(), clearEndWork()}; 속성 쓰기: {_disposeCause, _processed, _workState, _northWestChild, _northEastChild, _southWestChild, _southEastChild}
            UDEF — 폐기 사유와 작업 상태; 속성 읽기: {TILES_DISPOSE_TYPE, PROCESS}
        동작:
            defined(targetTile._northWestChild)이면 북서 자식을 PARENTCULLED 사유로 폐기하고 _northWestChild를 undefined로 바꾼다.
            defined(targetTile._northEastChild)이면 북동 자식을 PARENTCULLED 사유로 폐기하고 _northEastChild를 undefined로 바꾼다.
            defined(targetTile._southWestChild)이면 남서 자식을 PARENTCULLED 사유로 폐기하고 _southWestChild를 undefined로 바꾼다.
            defined(targetTile._southEastChild)이면 남동 자식을 PARENTCULLED 사유로 폐기하고 _southEastChild를 undefined로 바꾼다.
            부모의 대기·완료 기록을 비우고 _workState를 삭제하며 _processed를 NONE으로 바꾼다.

    override doWork(force: boolean, workInfo: Map, forceBox?: Box3) -> void
        의존:
            U3dQuadTile — 자식 준비와 대기 등록; 함수: {isWait(), isInitialized(), createMesh(), setLastUpdateDate(), setWaitWork()}; 속성 읽기·쓰기: {_processed, _worked, _workState, _waitWork, _endWork, _childTiles, _disposed}
            U3dLayer — 완료 캐시의 장면 반영; 함수: {getVisible(), getTileFromScene(), addTileFromScene()}
            U3dQuadTileTask — 작업 상태 연결과 종결 수신; 함수: {setInfo(), finally()}; 속성 읽기: {scope, item}
            U3dQuadTileProcess — 모델 작업 등록; 함수: {enqueueWork()}
            UDrawArg — 자식 등록; 함수: {addTile()}
            U3dQuadSet — 모델 완료 이벤트; 함수: {dispatchEvent()}
            UDEF — 진행 상태; 속성 읽기: {PROCESS}
            U3dEvent — 모델 이벤트 종류; 속성 읽기: {TILE}
        동작:
            작업 목록이 비고 부모 대기도 없으면 표시 레이어의 완료 타일 중 장면에 없는 것을 부착하고 부모 최종 갱신 시각과 자식 MODEL_LOADED 이벤트를 반영한다. 목록이 비면 반환한다.
            부모가 LOADING이고 이전 _workState가 있으면 preWorks·totalCount·workedCount를 이전 상태와 합치고 기존 대기 작업의 workState 참조도 새 Map으로 바꾼다. 그 외에는 부모 _processed와 자식 _worked를 LOADING으로 설정한다.
            부모 _workState를 새 Map으로 바꾼다. 초기화되지 않은 자식은 createMesh(null, tile._drawArg)로 준비하고 모든 자식을 addTile로 등록한다.
            각 작업에 workState와 finally 콜백을 연결하고 부모 setWaitWork 후 모델 처리기에 enqueueWork한다.
            finally 콜백은 부모 폐기·결과 없음·결과 자식 폐기이면 반환한다. 그 외에는 결과 레이어가 있을 때 타일을 부착하고 forceBox가 정의되어 있으면 FORCE_MODEL_LOADED를 발생시킨 뒤 종결을 집계한다.

    override finishWork(tile: U3dQuadTile, obj: U3dQuadTileTask, force: boolean) -> void
        의존:
            U3dQuadTileTask — 작업 상태 조회와 참조 정리; 함수: {getInfo(), dispose()}; 속성 읽기: {name}
            U3dQuadTile — 완료·대기 이력과 자식 완료; 함수: {setEndWork(), deleteWaitWork(), dispatchEvent(), setLastUpdateDate()}; 속성 읽기·쓰기: {_workState, _processed, _worked, _childTiles}
            UDrawArg — 완료 자식 등록; 함수: {addTile()}
            U3dQuadSet — 모델 완료 이벤트; 함수: {dispatchEvent()}
            UDEF — 완료 상태; 속성 읽기: {PROCESS}
            U3dEvent — 로드 이벤트 종류; 속성 읽기: {TILE}
        동작:
            결과의 workState를 얻고 작업을 dispose한 뒤 부모 완료 기록에 넣고 같은 이름의 대기 기록을 제거한다.
            workedCount가 falsy이면 1, 그 외에는 1 증가시켜 Map에 저장한다.
            workedCount와 totalCount가 같으면 부모 _workState를 삭제하고 부모와 자식을 END로 바꾼다. 각 자식을 addTile로 등록하고 TILE.LOAD와 TILE.MODEL_LOADED를 발생시킨 뒤 부모 최종 갱신 시각을 설정한다.
            force는 이 함수에서 사용하지 않는다.

    override setVisibleTile() -> void
        동작: 모델 프레임 상태는 이 함수에서 표시 전환을 수행하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
