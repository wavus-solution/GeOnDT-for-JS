# CustomLand 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`CustomLand`는 사용자가 지정한 영역과 목표 높이를 보관하고, 선택된 `U3dHeightXYZLayer`의 원본 UMF 타일을 사용하여 편집 전·후 체적과 절토·성토량을 계산한다. 경사면 편집을 사용하면 별도의 경사 메시와 영역을 구성하며, 편집 영역에 대응하는 지형 텍스처도 합성할 수 있다.

### 1.2 책임 범위

- 편집 영역, 목표 고도, 경사면과 텍스처 상태를 소유한다.
- 편집 영역과 교차하는 EPSG:3857 타일 목록 및 표본 마스크를 만든다.
- UMF 원시 표본과 타일별 또는 레이어 전역 복원값으로 원본 고도를 계산한다.
- 실제 고도 표본과 NoData를 구분하여 체적·절토·성토 결과를 집계한다.
- 편집 지형이 포함된 지형 메시의 텍스처를 합성하고 처분 시 원본 상태를 복원한다.
- 책임 경계: 편집 지형의 입력 검증·레이어 선택·앱 등록은 `UAnalyCustomLand`가 담당하고, UMF 요청·압축 해제·버전 파싱·캐시는 `U3dHeightXYZLayer`가 담당한다.

### 1.3 주요 동작 방식

체적 요청 시 편집 다각형과 선택적인 경사 다각형을 생성하고 영역에 포함되는 타일을 구한다. 각 타일은 고도 레이어의 공용 페이로드 조회 흐름을 통해 원시 표본과 UMF 2.0 헤더를 함께 받는다. UMF 2.0은 타일 헤더의 `scale`, `offset`, `noData`, 격자 크기를 사용하고, 헤더가 없는 UMF 1.x는 생성 시 받은 레이어 전역 값을 사용한다. 마스크에 포함된 유효 표본만 높이로 복원하여 체적을 누적하고 모든 요청이 끝나면 결과와 deferred 상태를 완료한다.

### 1.4 주요 사용처와 연계 대상

- `UAnalyCustomLand`가 객체를 생성하고 앱의 편집 높이 목록과 공간 인덱스에 등록한다.
- `U3dHeightXYZLayer`가 분석에 필요한 원시 표본과 타일 헤더를 캐시 또는 원격 UMF에서 제공한다.
- `U3dHeightLayer`와 `UHeightUtil`이 등록된 편집 영역을 현재 지형 지오메트리에 반영한다.
- 이미지 레이어의 로드 이벤트가 `changeTexture()`를 호출하여 편집 영역 텍스처를 다시 합성한다.

## 2. 요구사항과 품질 기준

```spec
- UMF 1.x 타일은 기존 레이어 전역 scale과 offset을 사용하여 이전 토공량 계산 흐름을 유지한다.
- UMF 2.0 타일은 파일마다 선언된 scale, offset과 noData를 해당 타일에만 적용한다.
- NoData는 양자화 복원 전 원시 표본에서 엄격 비교하여 실제 해발 0m와 구분한다.
- 체적 순회에서는 별도 유효성 마스크나 전체 높이 배열을 만들지 않고 원시 표본을 즉시 판정·복원한다.
- 원본 UMF 요청은 고도 레이어의 활성 캐시와 분석용 LRU를 우선 재사용한다.
```

## 3. 정규 자연어 수도코드

```spec
CustomLand 클래스 정의
    textureDefaultUrl: string = "default"
        기본 편집 텍스처를 식별하는 값

    static textureCache: Map<string, {texture, count}>
        URL별 공유 텍스처와 참조 수 저장소

    tiles: Array<DemTile>
        체적 분석에 사용할 파싱 완료 타일 목록

    constructor(options: CustomLandCO)
        역할: 편집 영역, 높이, 경사면, 분석과 텍스처 상태를 초기화한다.
        처리 기준:
            heightScale과 heightOffset은 UMF 1.x fallback으로 보관한다.
            경사면 편집이면 입력 외곽선으로 경사 메시를 만든다.
            텍스처를 사용하면 URL별 공유 캐시를 우선 사용하고 없으면 비동기로 로드한다.
        의존:
            deferred — 체적과 텍스처 준비 완료 상태 생성; 함수: {deferred()}
            THREE — 경사 메시와 텍스처 상태 구성; 생성자: {new Shape(), new ExtrudeGeometry(), new MeshBasicMaterial(), new Mesh(), new Box3()}
            UTextureLoader — 편집 텍스처 요청; 생성자: {new UTextureLoader()}; 함수: {load()}
        동작:
            입력 또는 기본값으로 공개 상태와 분석 누적값을 초기화한다.
            필요한 경우 경사 메시와 공유 텍스처를 준비하고 이미지 레이어 로드 이벤트에 텍스처 갱신을 등록한다.

    getInclineZValue(x: number, y: number, z: number) -> number
        역할: 경사 메시의 지정 평면 위치에 대응하는 편집 후 높이를 반환한다.
        처리 기준:
            x 또는 y가 없으면 UDEF.TERRAIN_NO_DATA를 반환한다.
            경사 메시가 없거나 교차점이 없으면 입력 z를 반환한다.
        의존:
            UMathEngine — EPSG:3857 위치 스케일 계산; 정적 함수: {getRealScaleAtGoogle()}
            THREE.Raycaster — 경사 메시 하향 교차점 조회; 함수: {set(), intersectObject()}
            UDEF — 클라이언트 NoData 식별; 상수: {TERRAIN_NO_DATA}
        동작: 목표 고도 위에서 아래 방향으로 경사 메시를 조회하고 교차 거리를 높이로 변환하여 반환한다.

    getResolutionMask() -> Map<DemTile, DemMask> | undefined
        역할: 고정 미터 해상도 표본점으로 편집 영역과 경사 영역의 타일별 마스크를 만든다.
        처리 기준:
            fixedResolution 또는 편집 다각형이 없으면 undefined를 반환한다.
            타일이 없거나 편집 영역 밖인 표본은 결과에 포함하지 않는다.
        의존:
            UMathEngine — 실제 거리와 타일 인덱스 계산; 정적 함수: {getMeterDistanceByGooglePoints(), getIndexXY()}
            JSTS — 표본점 생성과 다각형 포함 판정; 함수: {createPoint(), contains()}
        동작:
            편집 영역을 고정 해상도로 순회하여 원본 마스크를 타일별로 묶는다.
            경사 편집이면 타일 격자를 순회하여 원본 영역 밖의 경사 표본과 월드 좌표를 추가한다.

    getTileMask(tile: DemTile) -> DemMask
        역할: 한 DEM 타일의 각 셀 중심이 원본 또는 경사 편집 영역에 포함되는지 기록한다.
        의존:
            JSTS — 셀 중심점 생성과 다각형 포함 판정; 함수: {createPoint(), contains()}
            UDrawArg — EPSG:3857 좌표의 월드 좌표 변환; 함수: {getGoogleToWorld()}
        동작: tile.width와 tile.height 범위를 순회하여 원본 인덱스와 선택적인 경사 인덱스를 분리해 반환한다.

    onLoadManager(end?: Function, progressFunc?: Function) -> void
        역할: 준비된 타일의 체적을 계산하고 분석 결과와 deferred를 완료한다.
        처리 기준:
            고정 해상도 마스크 생성에 실패하면 deferred를 거절한다.
            유효 표본이 하나도 없으면 평균·최소·최대 높이를 UDEF.TERRAIN_NO_DATA로 기록한다.
        의존:
            UDEF — 유효 표본이 없는 결과 식별; 상수: {TERRAIN_NO_DATA}
            deferred 객체 — 분석 성공·실패 완료; 콜백: {resolve(), reject()}
        동작:
            고정 해상도 또는 타일 원래 해상도에 맞는 마스크를 구해 일반·경사 체적을 누적한다.
            누적 결과를 객체 속성에 저장하고 진행·완료 callback을 실행한 뒤 객체를 resolve한다.

    상태 조회 책임 그룹
        역할: 현재 편집 지형의 식별자와 설정 상태를 반환한다.

        isDisposed() -> boolean
            동작: 처분 여부를 반환한다.

        isUseTexture() -> boolean
            동작: 텍스처 사용 여부를 반환한다.

        getId() -> string
            동작: 사용자 편집 지형 ID를 반환한다.

        getUid() -> string
            동작: 객체 고유 ID를 반환한다.

        getCenter() -> WorldPositionVector3
            동작: 편집 영역 중심을 반환한다.

        getName() -> string
            동작: 편집 지형 이름을 반환한다.

        getHeight() -> number
            동작: 목표 편집 높이를 반환한다.

        getInclineRate() -> number
            동작: 경사율을 반환한다.

        getInclineBox() -> Box3 | undefined
            동작: 경사 편집 영역을 반환한다.

        getInclineEdit() -> boolean
            동작: 경사면 편집 사용 여부를 반환한다.

        isInsideIncline() -> boolean
            동작: 내부 경사면 모드 여부를 반환한다.

        getBox() -> UBox3 | undefined
            동작: 원본 편집 영역을 반환한다.

    dispose() -> void
        역할: 경사 메시, 텍스처 이벤트와 공유 텍스처 참조를 정리한다.
        의존:
            UDEF — Object3D와 텍스처 자원 처분; 함수: {disposeObject3D()}
            U3dEvent — 이미지 로드 이벤트 식별; 상수: {IMAGE.LOADED}
        동작:
            경사 메시를 장면에서 제거하고 지오메트리를 처분한다.
            이미지 레이어 이벤트와 합성 텍스처를 복원하고 마지막 공유 참조이면 원본 텍스처도 처분한다.
            데이터 레이어 연결을 끊고 처분 상태를 기록한 뒤 앱 갱신을 요청한다.

    clone() -> undefined
        동작: 현재 구현은 값을 반환하거나 복제 상태를 만들지 않는다.

    getParameter() -> CustomLandCO
        역할: 재생성에 필요한 공개 편집 설정을 반환한다.
        동작: ID, 이름, 높이, 경사 설정, 반환 대상 외곽선과 텍스처 설정을 객체로 만들어 반환한다.

    getVertex() -> Array<GeoPositionVector3>
        처리 기준: 내부 경사면 모드이고 원본 좌표가 있으면 원본 좌표를 반환한다.
        동작: 경사면 모드에 맞는 지리 외곽선 좌표를 반환한다.

    setParameter(parameter: CustomLandCO) -> void
        역할: 저장된 편집 설정을 현재 객체에 반영한다.
        의존:
            defaultValue — 누락 입력에 기본값 적용; 함수: {defaultValue()}
            Guid — 누락 ID 생성; 함수: {Guid()}
        동작: ID, 이름, 높이, 좌표, 경사와 텍스처 설정을 입력 또는 기본값으로 교체한다.

    setLandHeight(height: number) -> void
        역할: 목표 높이를 변경하고 교차 지형 타일의 재적용을 요청한다.
        동작: 높이와 편집 박스 중심을 갱신하고 앱에 해당 범위의 고도 레이어 갱신을 요청한다.

    getVolume(progressFunc?: Function) -> Promise<CustomLand>
        역할: 원본 DEM을 준비하고 편집 전·후 토공량 분석 완료 Promise를 반환한다.
        처리 기준:
            데이터 URL이 있고 아직 완료되지 않은 경우에만 분석을 시작한다.
            경사 편집이면 원본과 경사 다각형을 각각 준비한다.
        동작:
            JSTS 분석 다각형을 만들고 고도 타일 로딩을 시작한다.
            객체의 기존 deferred Promise를 반환한다.

    getDifference() -> number
        동작: 원본 체적에서 평탄 편집 후 체적을 뺀 값을 반환한다.

    getInclineDifference() -> number
        동작: 경사 편집이면 원본 경사 영역 체적에서 경사 편집 후 체적을 뺀 값을 반환하고 아니면 0을 반환한다.

    changeTexture(object: Mesh | UMesh) -> void
        처리 기준: 처분된 객체이거나 편집 영역과 교차하지 않으면 변경하지 않는다.
        동작: 입력에서 실제 메시를 구하고 편집 영역에 포함되면 합성 이미지 생성에 위임한다.

    removeTexture(object: Mesh | UMesh, layer: U3dLayer) -> void
        역할: 편집 영역 메시의 합성 텍스처를 처분하고 원본 맵을 복원한다.
        의존: U3dEvent — 이미지 재처리 알림; 상수: {IMAGE.LOADED}
        동작: 메시가 편집 영역에 포함되고 원본 맵을 보유하면 현재 맵을 처분한 뒤 원본을 복원하고 이미지 로드 이벤트를 전달한다.

    isInclude(geometry: UPlaneBufferGeometry) -> boolean
        역할: 지형 지오메트리가 현재 원본 또는 경사 편집 영역과 교차하는지 판정한다.
        동작: 등록된 커스텀 박스 또는 지오메트리 바운딩 박스와 현재 편집 박스의 XY 교차 여부를 반환한다.

    _changeImage(mesh: Mesh) -> void
        역할: 지형 메시의 기존 이미지 중 편집 영역에 사용자 텍스처를 합성한다.
        의존:
            Web API — canvas 생성과 2D 합성; 함수: {document.createElement(), drawImage()}
            UCanvasTexture — 합성 결과 텍스처 생성; 생성자: {new UCanvasTexture()}
            UDEF — 텍스처 품질 설정; 함수: {setTextureImprovement(), noResizeTexture()}
        동작:
            타일 범위에 편집 외곽선 경로를 만들고 사용자 이미지를 기존 지형 이미지 위에 합성한다.
            기존 재질 맵을 원본으로 보존하고 합성한 캔버스 텍스처로 교체한다.

    _loadDem(baseUrl: string, start?: Function, end?: Function, progress?: Function, progressFunc?: Function) -> void
        역할: 편집 범위의 DEM 타일 페이로드를 고도 레이어에서 병렬로 준비한다.
        처리 기준:
            baseUrl은 호환 시그니처로만 유지하고 URL·프록시·압축·버전 처리는 dataLayer에 위임한다.
            dataLayer가 공용 타일 페이로드 계약을 제공하지 않으면 deferred를 거절한다.
            타일이 없으면 즉시 완료 계산으로 진행한다.
            한 타일이라도 요청·파싱·격자 검증에 실패하면 부분 체적을 만들지 않고 전체 분석을 거절한다.
        의존:
            THREE.LoadingManager — 타일 요청 개수와 완료 callback 관리; 생성자: {new LoadingManager()}; 함수: {itemStart(), itemError(), itemEnd()}
            U3dHeightXYZLayer — 캐시 우선 타일 데이터·헤더 조회; 함수: {_getHeightTilePayload()}
        동작:
            분석 타일 목록을 만들고 LoadingManager callback을 등록한다.
            각 논리 타일에 dataLayer 요청을 시작하고 성공하면 페이로드를 타일 상태로 변환한다.
            전체 요청이 정리되면 실패 타일 존재 여부에 따라 deferred를 거절하거나 체적 계산에 위임한다.

    _onStartManager(start?: Function, url: string, loaded: number, total: number) -> void
        동작: 이전 타일과 체적 상태를 초기화하고 loading 상태를 기록한 뒤 start callback을 실행한다.

    _onProgressManager(progress?: Function, url: string, loaded: number, total: number) -> void
        동작: 현재 파일 수 진행 문구를 만들고 progress callback이 있으면 실행한다.

    _onErrorManager(url: string) -> void
        동작: 상태를 end로 기록하고 실패한 요청 식별자를 경고한다.

    _onLoad(tile: DemTile, payload: U3dHeightTilePayload) -> void
        역할: 고도 레이어 페이로드를 체적 분석용 타일 상태로 확정한다.
        처리 기준:
            UMF 2.0 헤더가 있으면 그 타일의 scale, offset, noData, width와 height를 사용한다.
            헤더가 없으면 UMF 1.x 레이어 전역 복원값과 격자 크기를 사용한다.
            격자 크기는 양의 정수이고 표본 수와 정확히 일치해야 한다.
        동작:
            원시 표본과 타일 전용 복원 정보를 기록한다.
            셀 해상도와 면적을 계산하고 타일 목록과 인덱스 Map에 등록한다.

    _onProgress(e: ProgressEvent) -> void
        동작: 현재 구현은 진행 이벤트로 상태를 변경하지 않는다.

    _onError(e: ErrorEvent | string) -> void
        동작: 고도 데이터 로드 오류를 경고한다.

    _onAbort(e: ProgressEvent | string) -> void
        동작: 고도 데이터 로드 취소를 경고한다.

    _getTiles() -> Array<DemTile>
        역할: 원본 또는 경사 편집 박스와 교차하는 dataLevel의 타일 목록을 만든다.
        의존:
            UMathEngine — EPSG:3857 위치의 타일 인덱스 계산; 정적 함수: {getIndexXY()}
            UMercator — 타일 인덱스의 EPSG:3857 경계 계산; 함수: {TileBounds()}
        동작: 편집 박스 최소·최대 타일 인덱스 범위를 순회하여 논리 x, y, z, 반전 y와 경계를 가진 항목을 반환한다.

    #calculateVolume(tile: DemTile, mask: DemMask, areaPerCell: number, result?: VolumeResult) -> VolumeResult
        역할: 원본 편집 영역의 유효 표본으로 체적과 높이 통계를 누적한다.
        처리 기준:
            원시 표본이 tile.noData와 엄격히 같거나 복원 높이가 유한수가 아니면 건너뛴다.
            복원 높이는 rawHeight * tile.heightScale + tile.heightOffset으로 계산한다.
        동작: 마스크 인덱스의 유효 높이마다 원본·편집 체적, 절토·성토, 개수와 높이 통계를 누적하여 반환한다.

    #calculateInclineVolume(tile: DemTile, mask: DemMask, areaPerCell: number, result: VolumeResult) -> VolumeResult
        역할: 경사 편집 영역의 유효 표본으로 경사 체적과 절토·성토량을 누적한다.
        처리 기준:
            경사 편집이 아니거나 경사 마스크가 없으면 기존 결과를 반환한다.
            NoData, 비유한 복원 높이와 유효하지 않은 경사 높이는 건너뛴다.
            실제 해발 0m 경사 높이는 유효한 표본으로 계산한다.
        동작: 각 경사 표본의 원본 높이와 경사 메시 높이를 비교하여 경사 절토·성토량을 누적하고 편집 후 체적을 확정한다.
```

## 4. 공통 처리 기준과 제약

```spec
- DemTile.data는 양자화를 풀기 전 원시 표본을 유지하며 체적 순회 안에서 필요한 표본만 즉시 복원한다.
- DemTile의 scale, offset과 noData는 같은 타일 페이로드의 헤더와 원자적으로 대응해야 한다.
- UMF 1.x에는 타일 헤더가 없으므로 CustomLand 생성 옵션의 레이어 전역 scale과 offset이 fallback이다.
- size는 기존 참조 호환용 X축 표본 수이고 새 격자 순회와 인덱싱은 width와 height를 사용한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
