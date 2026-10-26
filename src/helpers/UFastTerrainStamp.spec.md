# UFastTerrainStamp 명세

> 상태: 구현 관찰 초안

## 1. 개요

Helper의 원래 지형 교차 다각형과 경계선을 한 footprint snapshot으로 공유 Fast 도장 관리자에 전달한다. 입력 좌표·색의 사본을 보관하고 실제 변경에만 revision을 증가시킨다. 좌표 변경 세대 geometryRevision은 별도로 관리하여 색·표시 변경만으로 GPU mask를 다시 만들지 않는다. 일반 UTerrainStamp registry에 등록하지 않는다.

## 2. 요구사항과 품질 기준

```spec
색상·투명도·같은 앱의 Fast 도장 간 순서·CSS pixel 또는 world 단위 선폭을 보존한다.
renderOrder는 같은 공유 Fast 관리자의 도장만 정렬하며 일반 UTerrainStamp와 행 단위로 섞어 정렬하지 않는다.
이미지·mask 등 fast 경로에서 지원하지 않는 옵션은 경고 후 무시한다.
호환 polygon·polyline 입력은 최대 16점이다. Helper footprint는 도형·점 개수를 자르지 않고 원래 지형 교차 형상과 닫힘 정보를 보존한다.
polygon·polyline의 getParam 결과는 일반 UTerrainStamp의 복원 입력으로 사용할 수 있어야 한다. footprint는 같은 단일 도장 형식으로 직렬화할 수 없어 getParam이 명시적으로 실패하며 Helper.save가 현재 소유 snapshot을 저장한다.
footprint는 Helper의 원래 지형 교차점을 사용한다. 경계선은 입력 선분 그대로이며 열린 선을 임의로 닫거나 다각형의 공유 내부 변을 경계선으로 추가하지 않는다.
마지막 관리자 해제의 GPU 자원 소유권은 Helper가 제공한 retire에 넘길 수 있어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
UFastTerrainStamp 클래스 정의
    static OPT_KEYS: Array<string>
        생성 시 정규화할 도형·단색 표현·저장 호환 옵션과 무시할 확장 옵션 이름
    처리 기준: Gradient는 채움에만 적용하고 선 색·불투명도를 유지한다.
    #state: UFastTerrainStampRenderState
    #scratchColor: Color = 새 색
        의존: Color — 색 비교용 임시 값; 생성자: {new Color()}
    #app: U3dApp | undefined
    #manager: UFastTerrainStampManager | undefined
    #retire: UFastTerrainStampRetire | undefined
    #maxStampsPerTile: number = 128
    _disposed: boolean = false

    constructor(opt: UFastTerrainStampCO = {})
        의존: normalizeOptionKeys — 생성 옵션 이름 정규화; 함수: {normalizeOptionKeys()}
        동작:
            가장 먼저 new.target을 기준으로 옵션 이름을 정규화한다.
            빈 도장 상태를 만든 뒤 입력을 반영한다.
            생성만으로 앱에 연결하지 않는다.

    static _getManager(app: U3dApp) -> UFastTerrainStampManager | undefined
        의존: UFastTerrainStampManager — 앱별 기존 관리자 조회; 함수: {_get()}
        동작: 새 관리자를 만들지 않고 해당 앱의 기존 빠른 도장 관리자를 반환한다.

    static _withHelperBatch(stamps: Array<UFastTerrainStamp>, callback: function, retire: UFastTerrainStampRetire | undefined, onError: function | undefined) -> T
        인터페이스: callback은 동기 함수이며 전달받은 include로 같은 배치에 새 FastStamp를 추가할 수 있다.
        동작:
            배치마다 이전 sink를 보관하는 Map을 만든다.
            include는 FastStamp 인스턴스이며 이 배치에 아직 포함하지 않은 도장의 이전 sink를 기록하고 retire를 연결한다.
            전달된 도장을 include한 뒤 callback을 실행하고 그 반환값을 그대로 반환한다.
            callback의 정상·예외 종료와 관계없이 finally에서 포함된 모든 도장의 이전 sink를 복원한다.
            fast에는 지연 registry commit이 없으므로 onError를 호출하지 않으며 callback 오류는 그대로 전달한다.

    setApp(app: U3dApp | undefined) -> this
        의존: UFastTerrainStampManager — 공유 관리자 등록·제거; 함수: {_getOrCreate(), _addStamp(), _removeStamp()}
        동작:
            해제된 도장이거나 같은 앱이면 현재 도장을 반환한다.
            현재 앱과 관리자 참조를 비운 뒤 이전 관리자에서 현재 sink를 전달하여 제거한다.
            새 앱이 있으면 공유 관리자를 얻어 참조를 저장하고 자신을 등록한다.
                등록이 실패하면 참조를 다시 비우고 해당 관리자에서 제거한 뒤 오류를 던진다.
            도형과 표현을 보존하고 현재 도장을 반환한다.

    getApp() -> U3dApp | undefined
        동작: 연결된 앱 참조를 반환한다.

    update(opt: UFastTerrainStampCO = {}) -> boolean
        의존: UFastTerrainStampManager — 변경 예약; 함수: {_markDirty()}
        동작:
            해제 상태이면 false를 반환한다.
            _disposed가 false일 때 이전 revision을 기억하고 도형까지 포함한 옵션을 적용한다.
            maxStampsPerTile이 전달되면 저장 호환 값으로 보관한다.
            revision이 변했을 때만 연결된 관리자를 dirty 처리하고 도형 유효 여부를 반환한다.
            같은 유효 도형을 다시 전달해도 true이며 값이 같으면 dirty가 늘지 않는다.

    setStyle(style: UFastTerrainStampCO = {}) -> this
        의존: UFastTerrainStampManager — 변경 예약; 함수: {_markDirty()}
        동작:
            해제 상태이면 현재 도장을 반환한다.
            _disposed가 false일 때 points와 type을 무시하고 표현 옵션을 적용한다.
            전달된 maxStampsPerTile을 저장하고 revision이 변했을 때만 관리자를 dirty 처리한다.
            현재 도장을 반환한다.

    _getRenderState() -> UFastTerrainStampRenderState
        동작: 도장이 소유하는 현재 상태의 읽기 전용 참조를 반환한다. 호출자는 객체와 내부 값을 변경하지 않는다.

    _setFootprint(terrain: UFastTerrainStampFootprintInput, style: UFastTerrainStampFootprintStyle) -> boolean
        역할: Helper가 계산한 world 지형 교차 도형와 독립 채움·외곽선 표현을 저장한다.
        의존: UFastTerrainStampManager — 실제 변경 예약; 함수: {_markDirty()}
        동작:
            해제되었으면 false를 반환한다.
            _disposed가 false일 때 현재 revision을 기록한 뒤 지형 교차점 입력 검증과 소유 사본 반영을 위임한다.
            revision이 달라졌을 때만 관리자를 dirty 처리하고 유효한 입력의 반영 여부를 반환한다.

    setPoints(points: Array<WorldPosition>) -> this | undefined
        동작: 점 갱신이 유효하면 현재 도장, 유효하지 않으면 undefined를 반환한다.

    getPoints() -> Array<Vector3>
        동작: 각 점을 복제한 독립 배열을 반환한다.

    setColor(color: ColorLike) -> this
        동작: 단색 변경을 위임하고 현재 도장을 반환한다.
    getColor() -> Color
        동작: 현재 색의 사본을 반환한다.

    setOpacity(opacity: number) -> this
        동작: 불투명도 변경을 위임하고 현재 도장을 반환한다.
    getOpacity() -> number
        동작: 현재 불투명도를 반환한다.

    setVisible(visible: boolean) -> this
        동작: 표시 요청 변경을 위임하고 현재 도장을 반환한다.
    getVisible() -> boolean
        동작: 표시 요청 상태를 반환한다.

    setMaxStampsPerTile(value: number) -> this
        동작: 해제 전이면 저장 호환 값을 보관하고 현재 도장을 반환한다. fast의 행 수는 이 값으로 자르지 않는다.
    getMaxStampsPerTile() -> number
        동작: 저장 호환 값을 반환한다.

    setRenderOrder(renderOrder: number) -> this
        인터페이스: 같은 앱의 Fast 도장 사이 합성 순서이며 높은 값이 위에 표시된다. 일반 UTerrainStamp나 영상 레이어 사이 순서를 바꾸지 않는다.
        동작: 합성 순서 변경을 위임하고 현재 도장을 반환한다.
    getRenderOrder() -> number
        동작: 같은 앱의 Fast 도장 사이에서 사용하는 현재 합성 순서를 반환한다.

    setGradientColor(gradientColor: ColorLike | undefined) -> this
        동작: 두 번째 채움 색의 설정 또는 undefined 해제를 위임하고 현재 도장을 반환한다.
    getGradientColor() -> Color | undefined
        동작: 두 번째 색의 사본을 반환하며 비활성이면 undefined이다.
    setGradientDirection(gradientDirection: 'vertical' | 'horizontal') -> this
        동작: vertical 또는 horizontal 보간 방향을 위임하고 현재 도장을 반환한다.
    getGradientDirection() -> 'vertical' | 'horizontal'
        동작: 보관한 현재 방향을 반환한다.

    getParam() -> UTerrainStampParam
        동작: polygon·polyline이면 일반 TerrainStamp로 복원할 수 있는 독립 값을 반환한다. footprint이면 Helper.save 사용을 안내하는 TypeError를 던진다.

    clear() -> this
        동작: 도형을 유지하고 표시만 끈 뒤 현재 도장을 반환한다.

    dispose() -> void
        의존: UFastTerrainStampManager — 도장 제거와 마지막 자원 해제 위임; 함수: {_removeStamp()}
        동작:
            이미 해제되었으면 종료한다.
            _disposed를 먼저 설정하고 visible을 false로 바꾸며 revision을 증가시킨다.
            자신의 앱·관리자 참조를 비우고 이전 관리자에서 현재 sink와 함께 제거한다.
            제거가 실패해도 finally에서 소유 점 배열과 bounds를 비우고 polygons·polylines·bounds3D 참조를 제거한다.

UFastTerrainStampCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        type: 'polygon' | 'polyline' = 'polygon'
        points: Array<WorldPosition> | undefined
        color: ColorLike = '#00ffff'
        opacity: number = 1
        lineWidth: number = 1
        lineWidthUnits: 'meters' | 'pixels' = 'meters'
        visible: boolean = false
        renderOrder: number = 0
        maxStampsPerTile: number = 128
        texture: string | undefined
        gradientColor: ColorLike | undefined
        gradientDirection: 'vertical' | 'horizontal' | undefined
        mode: string | number | undefined
        targetLayer: U3dLayer | string | null | undefined
        mappingFrame: Array<WorldPosition> | null | undefined
        expectTexture: boolean | undefined
            gradientColor·gradientDirection은 채움에 적용한다. 나머지 확장 표현은 fast 표시에서 지원하지 않는다.

UFastTerrainStampRenderState 부분 타입 명세
    이 명세에서 사용하는 필드:
        points: Array<Vector3>
        type: 'polygon' | 'polyline' | 'footprint'
        color: Color
        gradientColor: Color | undefined = undefined
        gradientDirection: 'vertical' | 'horizontal' = 'vertical'
        gradientFrame: Array<Vector3> | undefined = undefined
            활성 Gradient의 공통 frame 소유 사본이다. 없으면 world XY bounds의 축을 사용한다.
        opacity, lineWidth: number
        lineWidthUnits: 'meters' | 'pixels'
        closed, visible: boolean
        renderOrder, order, revision, geometryRevision: number
        bounds: Box2
            points와 bounds는 world XY이며 color는 linear 색상이다. 상태 객체와 내부 값의 소유자는 도장이다.
        polygons, polylines: Array<Array<Vector3>> | undefined
            기존 교차 다각형과 경계선의 소유 사본이며 닫힘은 마지막 점의 반복으로 보존한다.
        bounds3D: Box3 | undefined
            모든 footprint 점의 world XYZ 영역이다.
        fillColor, lineColor: Color | undefined
        fillOpacity, lineOpacity: number | undefined
            footprint의 채움과 외곽선 표현이다. color·opacity는 채움 표현과 같은 값을 유지한다.

UFastTerrainStampFootprintStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        fillColor, lineColor: Color
        fillOpacity, lineOpacity: number
        gradientColor?: Color
        gradientDirection?: 'vertical' | 'horizontal' = 'vertical'
        lineWidth: number
        lineWidthUnits: 'pixels' | 'meters'
        renderOrder?: number = 0
            한 snapshot은 채움 뒤에 외곽선을 합성하고 다른 snapshot 사이의 순서는 renderOrder와 생성 순서로 정한다.

UFastTerrainStampRetire 콜백 타입 명세
    resource: dispose 가능한 객체
        호출 시 단독 해제 소유권을 넘겨받으며 수신 후 오류를 던지지 않는다.

UFastTerrainStampFootprintInput 부분 타입 명세
    이 명세에서 사용하는 필드:
        stampPolygons, stampPolylines: Array<Array<WorldPosition>>
            원래 지형 교차 다각형과 경계선의 world XYZ 배열이다.
        stampMappingFrame?: Array<WorldPosition>
            현재 footprint 전체에 공유할 평행사변형 네 점이다.
        generation?: number
            계산 식별 정보이며 같은 좌표에 대해 갱신을 강제하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
FastStamp는 일반 TerrainStamp registry·최대 128행 제한·이미지 atlas에 등록하지 않는다.
fast 합성은 Lambert diffuse 조명을 사용하는 표준 source-over이며 일반 TerrainStamp의 Phong specular와 alpha 0.96 조기 종료를 재현하지 않는다.
visible은 표시 요청이고 실제 표시에는 앱 연결과 유효한 도형도 필요하다.
clear와 숨김은 재사용할 좌표를 유지하고 dispose는 재사용할 수 없는 최종 종료다.
도장 자체는 GPU 자원을 소유하지 않는다. 관리자가 texture·material·mesh를 소유하며 마지막 도장 해제 때 retire로 정리를 위임할 수 있다.
Fast 합성 결과는 일반 UTerrainStamp를 포함한 선택된 지형 영상 재질의 기존 draw 안에서 합성한다. Fast와 일반 도장의 renderOrder를 교차 지정해도 하나의 합성 순서가 되지 않으며, 두 경로 사이 배치를 제어해야 하면 일반 경로를 사용한다.
polygon·polyline의 getParam은 일반 도장 복원 입력의 형식 호환을 보장한다. footprint은 Helper.save에서 마지막 표시 CPU footprint를 복사하여 저장하며 추가 높이 조회·교차 계산은 수행하지 않는다. 일반 UTerrainStamp로 복원하면 등록 레이어·조명·다른 도장과의 합성 위치도 달라질 수 있으므로 두 표시 경로의 동일한 픽셀 결과를 보장하지 않는다.
관리자 dirty는 다음 render에서 모아 처리하므로 동기 배치는 별도 전역 Stamp registry commit을 만들지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
