# U3dLayerList 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dLayerList`는 등록된 레이어를 전체 목록과 종류별 목록으로 관리하고 이름·종류 조회, 가시성 전달, 타일 처분과 레이어 해제를 연결한다.

### 1.2 책임 범위

전체 목록의 정렬, 종류별 배열 연결, 중복 이름 판정, 그룹 자식의 재귀 제거와 갱신 시각 통지를 담당한다. 이름 검색·종류 및 클래스 필터·정렬 비교만 내부 모듈에 맡기고, 배열의 소유권과 상태 변경 및 공개 호출 연결은 일반 소스에서 관리한다. 실제 렌더링·타일·비동기 자원 해제는 각 레이어가 담당하며 이 객체는 반환된 Promise를 기다리지 않는다.

### 1.3 주요 동작 방식

생성 직후 목록 배열의 직접 push는 경고 함수로 대체한다. 등록은 인덱스 대입으로 수행하고 전체 목록만 렌더 순서로 정렬한다. 조회 API는 내부 배열의 동일 참조 또는 선택한 레이어를 담은 새 배열을 반환하며, 등록된 레이어 객체는 복제하지 않는다. 제거는 분류 목록에서 먼저 빼고 그룹 자식을 재귀 제거한 뒤 레이어 해제를 호출한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp`이 drawarg를 전달하여 생성하고 레이어 등록·제거·조회 API에 사용한다.
- `UDrawArg`가 앱을 통해 분류 목록과 타입별 조회를 연결한다.
- `U3dGroupLayer`의 자식 목록과 해제가 그룹 제거 경로에 연결된다.

## 2. 요구사항과 품질 기준

```spec
공개 API의 이름·인수·반환과 레이어 호출 순서를 보존한다.
목록 및 레이어 객체의 참조 공유, 외부 변경 반영, 오류 시 부분 상태와 비동기 완료 경계를 보존한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dLayerListCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        drawarg?: UDrawArg
            등록·제거·전체 해제 후 갱신 시각을 알릴 객체이며 소문자 키 그대로 읽는다. 선택 속성이지만 갱신 메서드 호출 전에 제공되어야 한다. [확인 Q-001]

U3dLayerListCO 타입 정의
    U3dLayerListCO_Content의 별칭이다.

U3dLayerListClassifiedLayersOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        imagelayers?, heightlayers?, modellayers?, vectorTilelayers?, userlayers?: Array<U3dLayer>
            분류별 내부 배열을 전달받는 선택 필드다. measure·terrain 필드는 이 옵션에 포함되지 않는다.

U3dLayerList 클래스 정의

    _listmap: Array<U3dLayer> = 빈 배열
        등록된 전체 목록이며 addLayer에서 이 배열만 정렬한다.

    _imagelayers, _heightlayers, _modellayers, _vectorTilelayers, _userlayers, _measurelayers, _terrainlayers: Array<U3dLayer> = 빈 배열
        종류별로 등록 순서를 유지하는 별도의 배열이다. 원본 배열 참조가 노출되므로 외부 변경이 후속 처리에 반영된다.

    _drawArg: UDrawArg
        opt.drawarg를 검증 없이 보관하며 선택 입력 부재 시 runtime 값은 undefined이다. [확인 Q-001]

    getListMap: () -> Array<U3dLayer>
        생성자에서 인스턴스에 등록하는 함수다. 호출 시 this와 무관하게 생성 당시 소유자의 현재 _listmap을 반환하므로 분리 호출과 disposeAll 뒤에도 같은 소유자를 조회한다.

    constructor(opt: U3dLayerListCO = {})
        동작:
            전체 목록과 일곱 분류 목록을 각각 새 빈 배열로 만들고 각 배열의 push를 경고 함수로 대체한다. 인덱스 대입·splice 등 다른 변경까지 차단하지 않는다. [확인 Q-004]
            opt.drawarg를 _drawArg에 보관하고 소유자를 캡처한 getListMap 함수를 인스턴스에 등록한다. 옵션 키 정규화나 drawarg 존재 검사는 하지 않는다. [확인 Q-001]

    getName() -> Array<string>
        의존: U3dLayer — 등록된 레이어 이름 조회; 함수: {getName()}
        동작: 전체 목록 순서대로 각 레이어의 getName 결과를 새 배열에 담아 반환한다.

    checkIsExistListMap(name: string) -> boolean
        의존: U3dLayer — 중복 후보의 이름 조회; 함수: {getName()}
        동작: 전체 목록에서 getName 결과가 name과 엄격히 같은 첫 레이어가 있으면 true를 반환하고 끝까지 없으면 false를 반환한다.

    disposeModelTile(tile: U3dQuadTile, opt?: Partial<{deletefunc: Function}>) -> boolean
        의존:
            U3dLayer — 모델 타일 처분과 레벨 범위 조회; 함수: {disposeTile()}; 속성 읽기: {_minlevel, _maxlevel}
            U3dQuadTile — 실제 타일 레벨 조회; 속성 읽기: {_rlevel}
        동작:
            모델 분류 배열을 조회한다.
            각 레이어의 최소 레벨 이상이고 최대 레벨 이하인 tile만 opt와 함께 disposeTile에 전달한다.
            호출 결과를 집계하거나 비동기 완료를 기다리지 않고 정상 종료하면 false를 반환한다.

    disposeTileNoModel(tile: U3dQuadTile, opt?: Partial<{deletefunc: Function}>) -> boolean
        의존:
            U3dLayer — 모델 판정과 타일 처분; 함수: {disposeTile()}; 속성 읽기: {_type}
            UDEF — 제외할 종류; 상수: {LAYER_TYPE.MODEL}
        동작: 전체 목록에서 _type이 MODEL인 항목만 건너뛰고 나머지의 disposeTile에 tile과 opt를 전달한 뒤 false를 반환한다.

    disposeTile(tile: U3dQuadTile, opt?: Partial<{deletefunc: Function}>) -> boolean
        의존:
            U3dQuadTile — 해당 타일의 실행 컨텍스트 조회; 속성 읽기: {_drawArg}
            UDrawArg — 모델 정지 여부 판정; 함수: {getStopModel()}
            U3dLayer — 타일 처분; 함수: {disposeTile()}
        동작:
            기본 처리 대상을 전체 목록으로 선택한다.
            tile의 drawArg.getStopModel 결과가 truthy이면 getInstanceLayers 결과를 사용한다. 기본 구현은 같은 전체 배열을 반환하므로 MODEL을 제외하지 않는다. [확인 Q-002]
            선택 목록 순서대로 tile과 opt를 각 disposeTile에 전달하고 false를 반환한다. 비동기 반환을 기다리지 않는다.

    render() -> void
        의존: U3dLayer — 렌더 호출 연결; 함수: {render()}
        동작: 전체 목록 순서대로 render 멤버가 truthy인 레이어를 인수 없이 멤버 호출한다. 함수 타입 검사는 하지 않으며 발생한 오류는 전달한다.

    showLayer(name: string, visible: boolean) -> U3dLayer | undefined
        의존: U3dLayer — 가시성 전달; 함수: {show()}
        동작:
            이름으로 레이어를 찾는다.
            결과가 있으면 show에 visible을 전달하고, 조회된 레이어 또는 undefined를 반환한다.

    show(name: string, visible: boolean) -> U3dLayer | undefined
        동작: showLayer에 두 인수를 전달하고 그 결과를 반환한다.

    classifyLayerList(layer: U3dLayer) -> Array<U3dLayer> | undefined
        의존:
            U3dLayer — 분류할 종류 조회; 속성 읽기: {_type}
            UDEF — 분류 종류; 상수: {LAYER_TYPE.IMAGE, LAYER_TYPE.HEIGHT, LAYER_TYPE.VECTORTILE, LAYER_TYPE.MODEL, LAYER_TYPE.USER, LAYER_TYPE.MEASURE, LAYER_TYPE.TERRAIN}
            defined — 종류 존재 여부 판정; 함수: {defined()}
        동작:
            layer._type이 null·undefined이면 undefined를 반환한다.
            IMAGE·HEIGHT·VECTORTILE·MODEL·USER·MEASURE·TERRAIN은 각각 해당 분류 배열의 동일 참조를 반환한다.
            GROUP을 포함하여 그 밖의 종류는 undefined를 반환한다.

    addLayer(layer: U3dLayer) -> boolean
        의존:
            defined — 목록·기존 레이어 존재 여부 판정; 함수: {defined()}
            U3dLayer — 등록 이름 조회; 함수: {getName()}
            __GWarn__ — 중복 이름 경고; 함수: {__GWarn__()}
            UDrawArg — 변경 통지; 함수: {setUpdateDate()}
        동작:
            전체 목록이 null·undefined이면 false를 반환한다.
            layer.getName 결과로 기존 레이어를 조회하고 결과가 정의되어 있으면 경고 9612225를 출력하고 false를 반환한다. 조회는 기존 레이어의 _name 필드와 비교한다.
            전체 목록 끝에 인덱스로 layer를 대입한다. 목록 길이가 1보다 크면 렌더 순서 비교 함수를 sort에 전달하여 공유 전체 배열을 제자리 정렬한다. 비교 함수가 레이어를 수정하거나 분류 배열을 정렬하지는 않는다.
            해당 분류 배열이 있으면 그 끝에 인덱스로 layer를 대입한다. 분류 배열은 정렬하지 않는다.
            drawArg의 갱신 시각을 변경하고 true를 반환한다. 중간 오류가 발생해도 먼저 변경한 목록을 되돌리지 않는다. [확인 Q-001]

    removeLayer(name: string | U3dLayer) -> boolean
        의존:
            defined — 이름 조회 멤버 존재 여부 판정; 함수: {defined()}
            U3dLayer — 이름 조회와 레이어 해제; 함수: {getName(), dispose()}
            U3dGroupLayer — 그룹과 그 하위 타입 판정, 자식 목록 조회; 함수: {getChildren()}
            UDrawArg — 변경 통지; 함수: {setUpdateDate()}
        동작:
            name이 Object의 인스턴스이고 getName이 정의되어 있으면 인수 없이 호출해 name을 대체한다. 함수 여부는 따로 검사하지 않는다.
            전체 목록에서 falsy 항목을 건너뛰고 getName 결과가 name과 엄격히 같은 첫 레이어를 찾는다.
            레이어의 현재 종류에 대응하는 분류 배열에서 getName이 같은 첫 항목을 splice로 제거한다.
            레이어가 U3dGroupLayer 또는 그 하위 타입이면 getChildren의 반환 배열을 순회하며 각 자식을 재귀 제거한다.
            대상 레이어의 dispose를 호출하고 비동기 완료를 기다리지 않은 채 재귀 제거 전의 전체 목록 index에서 한 항목을 splice한 뒤 탐색을 끝낸다. 중간 오류는 그대로 전달하고 부분 변경을 되돌리지 않는다. [확인 Q-003]
            그룹의 getChildren 배열은 이 목록 관리자가 비우지 않으므로 그룹 dispose가 같은 자식의 dispose를 다시 호출할 수 있다. [확인 Q-005]
            일치 항목이 없어도 drawArg 갱신 시각을 변경하고 정상 종료하면 true를 반환한다.

    getLayer(name?: string) -> U3dLayer | undefined
        동작: 전체 배열과 name을 이름 검색에 전달하고 첫 일치 레이어 또는 undefined를 그대로 반환한다. 배열과 레이어를 변경하지 않는다.

    getInstanceLayer(name: string) -> U3dLayer | undefined
        동작: getLayer에 name을 전달하고 그 결과를 반환한다.

    getLayerByName(name?: string) -> U3dLayer | undefined
        동작: getLayer에 name을 전달하고 그 결과를 반환한다.

    findLayer(name: string) -> U3dLayer | undefined
        동작: getLayer에 name을 전달하고 그 결과를 반환한다.

    getLayers(type?: string) -> Array<U3dLayer>
        의존: defined — 종류 인수 존재 여부 판정; 함수: {defined()}
        동작:
            type이 null·undefined이면 전체 배열 자체를 반환한다.
            그 외에는 전체 배열과 type을 동적 종류 필터에 전달하고 일치하는 원본 레이어를 담은 새 배열을 반환한다.

    getMap() -> Array<U3dLayer>
        동작: 현재 _listmap 배열의 동일 참조를 반환한다.

    getInstanceLayers() -> Array<U3dLayer>
        동작: 현재 _listmap 배열의 동일 참조를 반환하며 모델을 제외하지 않는다. [확인 Q-002]

    getInstanceUserLayers() -> Array<U3dLayer>
        동작: 현재 _userlayers 배열의 동일 참조를 반환한다.

    getInstanceMeasureLayers() -> Array<U3dLayer>
        동작: 현재 _measurelayers 배열의 동일 참조를 반환한다.

    getInstanceTerrainLayers() -> Array<U3dLayer>
        동작: 현재 _terrainlayers 배열의 동일 참조를 반환한다.

    getInstanceModelLayers() -> Array<U3dLayer>
        동작: 현재 _modellayers 배열의 동일 참조를 반환한다.

    getInstanceVectorTileLayers() -> Array<U3dLayer>
        동작: 현재 _vectorTilelayers 배열의 동일 참조를 반환한다.

    getInstanceHeightLayers() -> Array<U3dLayer>
        동작: 현재 _heightlayers 배열의 동일 참조를 반환한다.

    getInstanceImageLayers() -> Array<U3dLayer>
        동작: 현재 _imagelayers 배열의 동일 참조를 반환한다.

    getInstanceClassifiedLayers(option?: U3dLayerListClassifiedLayersOption) -> U3dLayerListClassifiedLayersOption
        의존: defined — 옵션 객체 존재 여부 판정; 함수: {defined()}
        동작:
            option이 null·undefined이면 새 객체를 만들고 그 외에는 전달 객체를 그대로 사용한다.
            imagelayers·heightlayers·modellayers·vectorTilelayers·userlayers에 각각 내부 분류 배열의 동일 참조를 순서대로 대입한다. 기존 다른 속성은 유지하고 measure·terrain은 추가하지 않는다.
            수정한 option 자체를 반환한다.

    getInstanceLayersNoModel() -> Array<U3dLayer>
        의존:
            U3dLayer — 분류 필드 조회; 속성 읽기: {_type}
            UDEF — 선택 종류; 상수: {LAYER_TYPE.MODEL}
        동작: 전체 배열에서 _type이 MODEL과 다른 레이어를 원래 순서대로 선택한 새 배열을 반환한다. 레이어 객체는 복제하지 않는다.

    getInstanceModelAndGroupLayers() -> Array<U3dLayer>
        의존:
            U3dLayer — 분류 필드 조회; 속성 읽기: {_type}
            UDEF — 선택 종류; 상수: {LAYER_TYPE.MODEL, LAYER_TYPE.GROUP}
        동작: 전체 배열에서 _type이 MODEL 또는 GROUP인 레이어를 원래 순서대로 선택한 새 배열을 반환한다. 레이어 객체는 복제하지 않는다.

    getInstanceModelAndTerrainLayers() -> Array<U3dLayer>
        의존:
            U3dLayer — 분류 필드 조회; 속성 읽기: {_type}
            UDEF — 선택 종류; 상수: {LAYER_TYPE.MODEL, LAYER_TYPE.TERRAIN}
        동작: 전체 배열에서 _type이 MODEL 또는 TERRAIN인 레이어를 원래 순서대로 선택한 새 배열을 반환한다. 레이어 객체는 복제하지 않는다.

    getInstanceImageAndUserLayers() -> Array<U3dLayer>
        의존:
            U3dLayer — 분류 필드 조회; 속성 읽기: {_type}
            UDEF — 선택 종류; 상수: {LAYER_TYPE.IMAGE, LAYER_TYPE.USER}
        동작: 전체 배열에서 _type이 IMAGE 또는 USER인 레이어를 원래 순서대로 선택한 새 배열을 반환한다. 레이어 객체는 복제하지 않는다.

    getInstanceLoadingLayers() -> Array<U3dLayer>
        의존:
            U3dLayer — 분류 필드 조회; 속성 읽기: {_type}
            UDEF — 선택 종류; 상수: {LAYER_TYPE.IMAGE, LAYER_TYPE.HEIGHT, LAYER_TYPE.MODEL, LAYER_TYPE.VECTORTILE, LAYER_TYPE.USER}
        동작: 전체 배열에서 _type이 IMAGE·HEIGHT·MODEL·VECTORTILE·USER 중 하나인 레이어를 원래 순서대로 선택한 새 배열을 반환한다. 레이어 객체는 복제하지 않는다.
    getInstanceComponentLayers() -> Array<U3dLayer>
        동작: 전체 배열과 "U3dComponentLayer"를 클래스 종류 필터에 전달하고 일치하는 레이어의 새 배열을 반환한다. 선택 정책은 이 공개 메서드에서 정한다.

    getInstanceMultipleComponentLayers() -> Array<U3dLayer>
        동작: 전체 배열과 "U3dMultipleComponentLayer"를 클래스 종류 필터에 전달하고 일치하는 레이어의 새 배열을 반환한다. 선택 정책은 이 공개 메서드에서 정한다.

    getInstanceVideoLayers() -> Array<U3dLayer>
        동작: 전체 배열과 "video"를 클래스 종류 필터에 전달하고 일치하는 레이어의 새 배열을 반환한다. 선택 정책은 이 공개 메서드에서 정한다.

    getInstanceAnimationLayers() -> Array<U3dLayer>
        동작: 전체 배열과 "animation"을 클래스 종류 필터에 전달하고 일치하는 레이어의 새 배열을 반환한다. 선택 정책은 이 공개 메서드에서 정한다.

    getInstanceByClassType(classType: string) -> Array<U3dLayer>
        동작: 전체 배열과 classType을 클래스 종류 필터에 전달하고 일치하는 원본 레이어를 담은 새 배열을 반환한다.

    getInstanceTypeLayers(array: Array<string>) -> Array<U3dLayer>
        동작: 전체 배열과 array를 복수 종류 필터에 전달하고 일치하는 원본 레이어의 새 배열을 반환한다. 전체 배열과 검색 조건은 변경하지 않는다.

    getImageLayers() -> Array<U3dLayer>
        의존: UDEF — 조회 종류; 상수: {LAYER_TYPE.IMAGE}
        동작: getLayers에 IMAGE를 전달하고 반환된 배열을 그대로 반환한다.

    getModelLayers() -> Array<U3dLayer>
        의존: UDEF — 조회 종류; 상수: {LAYER_TYPE.MODEL}
        동작: getLayers에 MODEL를 전달하고 반환된 배열을 그대로 반환한다.

    getHeightLayers() -> Array<U3dLayer>
        의존: UDEF — 조회 종류; 상수: {LAYER_TYPE.HEIGHT}
        동작: getLayers에 HEIGHT를 전달하고 반환된 배열을 그대로 반환한다.

    getUserLayers() -> Array<U3dLayer>
        의존: UDEF — 조회 종류; 상수: {LAYER_TYPE.USER}
        동작: getLayers에 USER를 전달하고 반환된 배열을 그대로 반환한다.

    disposeAll() -> void
        의존:
            defined — 전체 목록 존재 여부 판정; 함수: {defined()}
            U3dLayer — 레이어 해제; 함수: {dispose()}
            UDrawArg — 변경 통지; 함수: {setUpdateDate()}
        동작:
            전체 목록이 null·undefined이면 즉시 종료한다.
            전체 목록 순서대로 각 레이어의 dispose를 호출하고 비동기 완료를 기다리지 않는다. 동기 오류가 발생하면 뒤의 배열 교체와 시각 갱신도 수행하지 않는다.
            전체 목록과 일곱 분류 배열을 각각 새 빈 배열로 교체한다. 기존 배열 참조는 비우지 않으며 새 배열의 push는 경고 함수로 다시 대체하지 않는다. [확인 Q-004]
            drawArg의 갱신 시각을 변경한다. [확인 Q-001]

nonePush(..._items: Array<unknown>) -> any
    의존:
        __GInfo__ — 잘못된 직접 등록 보고; 함수: {__GInfo__()}
        __GStack__ — 호출 스택 보고; 함수: {__GStack__()}
    동작: 전달 항목은 사용하지 않고 U3dLayerList의 경고 1710684와 호출 스택을 순서대로 출력한다. 배열을 변경하지 않으며 runtime 반환값은 undefined이다. [확인 Q-004]
```

## 4. 공통 처리 기준과 제약

```spec
등록·분류 배열 자체를 반환하는 API와 필터 결과의 새 배열은 구분한다. 두 경우 모두 레이어 객체는 공유하고 외부에서 변경한 이름·종류·순서는 후속 호출에 반영된다.
분류 목록은 등록·제거 시에만 조정하며 외부에서 레이어 종류나 전체 배열을 변경해도 자동 재분류하지 않는다.
등록 직후 전체 목록은 정렬하지만 분류 목록은 등록 순서다. _renderOrder를 나중에 바꿔도 다음 정렬 전까지 순서가 자동 변경되지는 않는다.
해제 API는 자식의 비동기 완료를 기다리지 않는다. dispose 반환값과 Promise의 실패는 이 객체에서 취합·복구하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
