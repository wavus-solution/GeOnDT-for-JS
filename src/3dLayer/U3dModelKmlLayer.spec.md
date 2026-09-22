# U3dModelKmlLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

KML/KMZ를 읽어 점·선·돌출 폴리곤으로 표시하는 벡터 레이어다. OpenLayers가 KML 피처와 스타일을 해석하고, 현재 단위가 형상별 속성·스타일·식별자를 구성하여 U3dVectorLayer에 등록한다. KMZ 압축 해제와 포함 이미지 조회, 레이어 경계 계산 및 object URL 수명 관리도 담당한다.

`GeOnDT.vector.U3dModelKmlLayer`로 제공하며 `tutorial-official/examples/kmlModelLayer/kmlModelLayer.main.js`에서 URL 로딩·styleFunction·completed 이벤트·앱 등록과 범위 이동을 조합한다. 네트워크 로딩과 Blob 읽기는 비동기지만 KML 파싱, 압축 해제와 형상 추가는 해당 실행 안에서 동기 수행한다.

## 3. 정규 자연어 수도코드

```spec
U3dModelKmlLayerEMD: U3dModelKmlLayerEMI
    이벤트 이름을 보관하는 변경 가능한 객체다.

U3dModelKmlLayerEMD.COMPLETED: string = completed
    완료 이벤트는 실행 시 이 값을 읽는다.

U3dModelKmlLayer extends U3dVectorLayer 클래스 정의
    의존: U3dVectorLayer — 레이어 기반; 상속: {U3dVectorLayer}; 상수: {EVENT}

    static EVENT: U3dVectorLayerEMI & U3dModelKmlLayerEMI
        부모 EVENT와 U3dModelKmlLayerEMD를 순서대로 펼친 새 객체다.
    static DefaultStyle: object
        pointSize=24, pointColor=#ffffff, lineWidth=2, lineColor=#ffffff, polygonColor=#ffffff, polygonOpacity=1, polygonHeight=10이다.
        변경 가능한 객체이며 이후 형상 생성과 높이 선택에서 현재 값을 읽는다.
    static GeometryType: Array<string> = Point, LineString, Polygon
        외부에서 변경할 수 있으나 현재 내부 변환 분기는 이 배열을 참조하지 않는다.
    _loadingPromise: Promise<U3dModelKmlLayer> | null = null
        생성자가 시작한 로딩만 보관하며 reload는 이 참조를 교체하지 않는다.
    _geometryIdMap: Map<string, U3dGeometry> = 빈 Map
        생성 식별자로 형상 참조를 찾는 별도 사전이다.
    _geometrySequence: number = 0
        형상마다 증가하며 clear에서 0으로 되돌린다.
    _heightField: string = height
        폴리곤 높이를 읽을 속성 키다.
    _styleFunction: KmlStyleFunction | undefined
        생성 옵션이 함수인 경우에만 보관한다.
    _kmzAssets: Record<string, Uint8Array> | null = null
        압축 해제한 엔트리 원본을 보관한다.
    _kmzObjectUrls: Map<string, string> = 빈 Map
        압축 엔트리별로 생성한 object URL을 보관한다.
    _baseUrl: string | undefined
        생성 옵션과 마지막 URL 로딩 대상이다.
    _classtype: string = U3dModelKmlLayer
        식별자 기본 접두어다.
    _rectangle, _rectangle3d: UGeoRect | undefined
        계산 성공 시 같은 사각형 참조를 가진다.
    _box3: Box3 | undefined
        형상 위치와 돌출 높이로 계산한 경계다.

    constructor(opt: U3dModelKmlLayerCO)
        의존:
            U3dVectorLayer — 기반 초기화; 생성자: {super()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            defined — 입력 존재 판정; 함수: {defined()}
            __GError__ — 생성 시 시작한 로딩 실패 기록; 함수: {__GError__()}
        동작:
            부모 생성 뒤 이름표·URL·로딩 참조·식별자 사전·순번·KMZ 자료와 URL 사전을 초기화한다.
            heightField의 기본값은 height이며 styleFunction은 함수인 경우만 저장한다.
            정의된 비어 있지 않은 kmlText, 정의된 kmlData, 정의된 비어 있지 않은 baseUrl 순서로 한 경로만 시작하고 반환 Promise를 보관한다.
            로딩 Promise의 실패에 레이어 receiver 인수와 오류 문자열을 로그로 전달하는 catch를 등록하며 원래 Promise 참조는 유지한다.

    async #load(path: string = this._baseUrl) -> Promise<U3dModelKmlLayer>
        의존:
            defined — 경로 존재 판정; 함수: {defined()}
            Web API — 파일 읽기; 함수: {fetch(), Response.arrayBuffer(), Headers.get()}; 속성 읽기: {Response.ok, Response.status, Response.statusText}
        동작:
            path가 정의되지 않았거나 빈 문자열이면 KML path is undefined 오류로 거부한다.
            _baseUrl을 먼저 변경한 뒤 fetch를 기다리며 응답이 ok가 아니면 상태 번호와 상태 문구를 포함한 오류로 거부한다.
            응답 바이트와 content-type·path 힌트로 텍스트를 얻는다.
            얻은 텍스트의 로딩 결과를 반환하며 fetch·읽기·변환 예외도 거부로 전달한다.

    async #loadFromData(data: ArrayBuffer | Uint8Array | Blob) -> Promise<U3dModelKmlLayer>
        의존: Web API — Blob 데이터 읽기; 함수: {Blob.arrayBuffer()}
        동작:
            Blob이면 arrayBuffer를 기다리고 그 외 입력은 그대로 사용한다.
            빈 힌트로 텍스트를 얻는다.
            얻은 텍스트의 로딩 결과를 반환한다.

    #normalizeToKmlText(input: ArrayBuffer | Uint8Array | string, hint: object) -> string
        동작:
    #resolveKmzImageSrc(src: string | undefined) -> string | undefined
        의존:
            defined — 소스·자료·캐시 존재; 함수: {defined()}
            Web API — 이미지 URL 소유권 획득; 생성자: {new Blob()}; 함수: {URL.createObjectURL()}
        동작:
            src가 미정의·빈 문자열이거나 자료가 없거나 data:·blob:으로 시작하면 원본을 반환한다.
            해당 엔트리의 URL 캐시가 정의되어 있으면 재사용한다.
            확장자를 소문자로 바꿔 png·jpg/jpeg·gif·svg·webp·bmp에 대응 MIME을 선택하고 그 외에는 application/octet-stream을 쓴다.
            엔트리 바이트의 Blob으로 object URL을 생성하여 사전에 저장하고 반환한다.

    #revokeKmzObjectUrls() -> void
        의존: Web API — 소유 URL 해제; 함수: {URL.revokeObjectURL()}
        동작:
            저장된 URL을 모두 revoke한 뒤 사전을 비운다.

    async #loadFromText(text: string) -> Promise<U3dModelKmlLayer>
        의존:
            defined — 텍스트 존재; 함수: {defined()}
            ol.format.KML — KML 해석; 생성자: {new ol.format.KML()}; 함수: {readFeatures()}
            U3dVectorLayer — 형상 갱신; 함수: {update()}
            UEventDispatcher — 완료 통지; 함수: {dispatchEvent()}
        동작:
            입력을 확인하기 전에 레이어를 비운다.
            text가 미정의이거나 trim 결과가 빈 문자열이면 완료 이벤트 없이 자신으로 완료한다.
            extractStyles=true, showPointNames=false인 KML reader로 피처 목록을 구한다.
            피처 순서대로 형상을 추가하며 도중 예외가 생기면 이미 추가한 형상을 되돌리지 않고 Promise를 거부한다.
            경계를 갱신하고 레이어 update 후 U3dModelKmlLayerEMD.COMPLETED와 자신을 data로 통지한 다음 자신으로 완료한다.
            네트워크·자원 취소나 오래된 응답 배제는 이 경로에서 수행하지 않는다. [확인 Q-002]

    reload() -> Promise<U3dModelKmlLayer>
        동작:
            현재 _baseUrl의 로딩 Promise를 반환하고 _loadingPromise는 교체하지 않는다.

    override initialize() -> void
        의존: U3dVectorLayer — 상속 초기화; 함수: {super.initialize()}
        동작:
            부모 initialize의 반환값을 보관하고 경계를 갱신한 뒤 그 값을 반환한다. 현재 기반 반환은 undefined다.

    override clear() -> void
        의존: U3dVectorLayer — 등록 형상 제거; 함수: {super.clear()}
        동작:
            부모 clear 뒤 경계·ID 사전·순번을 초기화하고 object URL을 해제한다. _kmzAssets는 남긴다.

    override dispose() -> Promise<boolean>
        의존: U3dVectorLayer — 상속 해제; 함수: {super.dispose()}
        동작:
            object URL을 해제하고 _kmzAssets를 null로 지운 뒤 부모 dispose의 반환값을 그대로 반환한다.

    getGeometryById(geometryId: string) -> U3dGeometry | undefined
        동작:
            별도 ID 사전의 원본 형상 참조를 반환한다. 상속된 개별 제거 경로는 이 사전을 갱신하지 않는다. [확인 Q-003]

    override getBoundingBox() -> Box3
        의존:
            U3dVectorLayer — 기본 경계 계산; 함수: {super.getBoundingBox()}
            U3dLayer — 현재 경계; 속성 읽기: {_box3}
        동작:
            _box3가 truthy이면 원본을 반환하고 그렇지 않으면 부모 계산 결과를 반환한다.

    #appendFeature(feature: OLFeature) -> void
        의존:
            OLFeature — 형상·속성·이름·ID 읽기; 함수: {getGeometry(), getProperties(), get(), getId()}
            OLGeometry — 원본 형상 종류; 함수: {getType()}
            defined — 형상 유무; 함수: {defined()}
        동작:
            피처 형상이 정의되지 않으면 종료한다.
            속성에서 geometry를 제외하고 복사한 뒤 피처 스타일을 선택한다.
            이름은 feature.get의 name이 truthy이면 사용하고 아니면 복사 속성의 name을 쓴다.
            원본 ID는 getId, properties.id, 이름 중 첫 nullish가 아닌 값이다.
            형상·복사 속성·스타일·이름·원본 타입·원본 ID를 변환기로 전달한다.

    #appendGeometry(geometry: OLGeometry, properties: KeyValue, style: OLStyle, name: string | undefined, sourceGeometryType: string | undefined, sourceFeatureId: string | number | undefined) -> void
        의존:
            OLGeometry — 형상과 좌표 읽기; 함수: {getType(), getCoordinates()}
            U3dVectorLayer — 형상 등록; 함수: {addGeometry()}
            U3dPoint — 점 위치 반영; 함수: {setPosition()}
            U3dLine — 선 위치 반영; 함수: {setPositions()}
            U3dPolygonLoftGeometry — 폴리곤 위치 반영; 함수: {setPositions()}
        동작:
            Point·LineString·Polygon은 한 형상, MultiPoint·MultiLineString·MultiPolygon은 구성 좌표마다 대응 단일 형상으로 처리하며 그 외 타입은 아무 것도 추가하지 않는다.
            각 형상의 식별자와 속성을 먼저 만들고 대응 점·선·폴리곤 생성기에 넘긴다.
            부모 레이어에 등록하고 ID 사전에 저장한 다음 좌표를 반영한다. 좌표 반영 예외 이전의 등록과 순번 증가는 남는다.
            점은 좌표 하나를, 선은 좌표마다 변환한 새 벡터를 설정한다. 폴리곤은 첫 링만 사용하고 나머지 내부 링을 사용하지 않는다.
            폴리곤의 첫 링은 닫힘 좌표를 보정한 뒤 변환하며 위치 반영 뒤 userData.useDepth를 읽어 직접 자식 재질까지 적용한다.

    #createGeometryInfo(properties: KeyValue, name: string | undefined, geometryType: string, sourceGeometryType: string | undefined, sourceFeatureId: string | number | undefined) -> object
        동작:
    #createPointGeometry(properties: KeyValue, style: OLStyle, name: string | undefined) -> U3dPoint
        의존:
            OLStyle — 이미지·채움 선택; 함수: {getImage(), getFill()}
            OLImageStyle — KML 점 스타일; 함수: {getScale(), getSize(), getColor(), getSrc()}
            OLFill — 채움 색상; 함수: {getColor()}
            U3dPoint — 형상 생성; 생성자: {new U3dPoint()}
            defined — 이미지 존재 판정; 함수: {defined()}
        동작:
            이미지 스타일을 읽은 뒤 Point 문맥의 사용자 스타일을 구한다.
            크기는 사용자 size가 nullish가 아니면 이를, 아니면 이미지 첫 크기 또는 기본 크기에 이미지 scale 또는 1을 곱한 값을 Number로 변환한다.
            색상은 사용자 color를 nullish 우선하고 아니면 truthy 이미지 색·채움 색·기본 점 색 순으로 선택한다.
            사용자 img 또는 이미지 src를 KMZ URL로 해석한다.
            opacity는 사용자 값 또는 색 alpha·기본 1로부터 Number 변환한다.
            색을 변환하고 속성을 다시 복사하여 이름·색·크기·이미지·속성·불투명도·depthTest로 점을 만든다. 크기는 유한하고 0보다 클 때만 사용하며 opacity는 유한하지 않으면 1이다. depthTest는 boolean 사용자 depth 또는 true다.
            사용자 depth를 재질에 반영한 뒤 반환한다.

    #createLineGeometry(properties: KeyValue, style: OLStyle, name: string | undefined) -> U3dLine
        의존:
            OLStyle — 선 스타일 선택; 함수: {getStroke()}
            OLStroke — 색·폭 읽기; 함수: {getColor(), getWidth()}
            U3dLine — 형상 생성; 생성자: {new U3dLine()}
        동작:
            stroke를 읽은 뒤 LineString 문맥의 사용자 스타일을 구한다.
            색상은 사용자 color를 nullish 우선하고 그 외에는 truthy stroke 색 또는 기본 선 색이다.
            폭은 customStyle.lineWidth, stroke.getWidth(), U3dModelKmlLayer.DefaultStyle.lineWidth 순서의 첫 nullish가 아닌 값을 Number로 변환한다.
            opacity는 사용자 값 또는 색 alpha·기본 1을 Number로 변환한다.
            색 변환·속성 복사 결과로 선을 생성한다. 폭은 유한하고 0보다 클 때만 사용하며 그 외 기본 폭, opacity는 유한하지 않으면 1이다.
            사용자 depth를 재질에 반영한 뒤 반환한다.

    #createPolygonGeometry(properties: KeyValue, style: OLStyle, name: string | undefined) -> U3dPolygonLoftGeometry
        의존:
            OLStyle — 면·외곽선 선택; 함수: {getFill(), getStroke()}
            OLFill — 면 색 읽기; 함수: {getColor()}
            OLStroke — 외곽선 색 읽기; 함수: {getColor()}
            defined — 외곽선 기본 사용 여부; 함수: {defined()}
            U3dPolygonLoftGeometry — 형상·그림자; 생성자: {new U3dPolygonLoftGeometry()}; 함수: {setShadow()}
        동작:
            fill·stroke를 읽은 뒤 Polygon 문맥의 사용자 스타일을 구한다.
            사용자 color가 nullish가 아니면 사용하고 아니면 truthy 채움 색·외곽선 색·기본 폴리곤 색 순으로 선택한다.
            opacity는 사용자 값 또는 색 alpha·기본 opacity를 Number로 변환하고 높이는 별도 우선순위로 구한다.
            useLine은 사용자 값이 nullish가 아니면 사용하고 아니면 stroke의 정의 여부이며 lineColor는 사용자 값만 쓴다.
            색 변환·속성 복사 결과와 이름·높이·선 설정으로 돌출 형상을 만든다. 비유한 opacity는 기본값으로 바꾼다.
            visible·setShadow·exceptAO는 각각 boolean일 때만 적용하고 userData.useDepth에는 depth를 그대로 저장한다.
            재질 depth를 적용한 뒤 반환한다.

    #getUserPolygonHeight(properties: KeyValue, height?: number | string) -> number
        동작:
            높이 인수, properties의 _heightField 값, altitude 중 첫 nullish가 아닌 값을 Number로 바꾼다.
            유한하면 0·음수도 그대로 반환하고 비유한이면 현재 DefaultStyle.polygonHeight를 반환한다.

    #getUserStyle(properties: KeyValue, type: string, name: string | undefined) -> KmlRenderStyle
        인터페이스: styleFunction의 this는 레이어이며 properties와 type·name 문맥을 받는다.
        의존: KmlStyleFunction — 사용자 함수 실행; 콜백: {styleFunction(properties, context)}
        동작:
            등록된 콜백을 레이어의 멤버로 호출하며 반환값이 falsy이거나 콜백이 없으면 새 빈 객체를 반환한다. 예외는 그대로 전파한다.

    #getFeatureStyle(feature: any) -> any
        의존: OLFeature — 피처 스타일 읽기; 함수: {getStyleFunction(), getStyle()}
        동작:
            getStyleFunction 결과가 truthy이면 별도 receiver 지정 없이 feature와 해상도 1로 호출하고 아니면 getStyle을 읽는다.
            결과가 배열이면 그대로, truthy 단일 값이면 한 항목 배열, 그 외에는 빈 배열로 본다.
            빈 목록은 null, 하나이면 원본 스타일을 반환하고 여러 개면 병합 결과를 반환한다.

    #updateLayerBounds() -> void
        동작:
            계산 결과가 false일 때만 기존 경계를 초기화하며 값을 반환하지 않는다.

    #resetLayerBounds() -> void
        의존: U3dLayer — 경계 초기화; 속성 쓰기: {_rectangle, _rectangle3d, _box3}
        동작:
            _rectangle·_rectangle3d·_box3를 undefined로 변경한다.

toGeoVector(coordinate: Array<number>) -> GeoPositionVector3
    의존: THREE.Vector3 — 지리 좌표 값 구성; 생성자: {new THREE.Vector3()}
    동작:
        배열이 아니거나 길이가 2보다 작으면 새 영벡터를 반환한다.
        첫 세 값을 Number로 바꾸고 비유한 성분만 0으로 바꾼 새 벡터를 반환한다.

normalizeRing(ring: Array<Array<number>>) -> Array<Array<number>>
    동작:
        길이가 2보다 작으면 원본을 반환한다.
        첫·마지막 좌표의 x·y와 nullish z를 0으로 본 값이 모두 같으면 마지막 항목을 제외한 얕은 배열 복사본을 반환하고 아니면 원본을 반환한다.

cloneProperties(properties: KeyValue, excludeKeys: Array<string> = []) -> KeyValue
    동작:
toColorValue(color: any, fallback: ColorRepresentation) -> ColorRepresentation
    동작:
        배열이면 RGB 세 성분의 nullish 값을 255로 대체하고 Number 변환하여 rgb 문자열을 만든다. 범위·유한성 보정은 하지 않는다.
        그 외에는 truthy 원본 색 또는 fallback을 반환한다.

toOpacity(color: any, fallback: number) -> number
    동작:
        배열이 아니면 fallback이며 배열의 넷째 값을 Number로 바꿔 유한하면 그대로, 그 외에는 fallback을 반환한다.

mergeStyles(styles: Array<OLStyle>) -> any
    의존:
        OLStyle — 요소별 첫 스타일; 함수: {getImage(), getFill(), getStroke(), getText()}
    동작:
        image·fill·stroke·text 각각 첫 nullish가 아닌 결과를 선택하며 이미 선택한 요소의 뒤쪽 getter는 호출하지 않는다.
        네 요소를 반환하는 getter 함수를 가진 새 객체를 반환하며 원본 스타일 요소는 복제하지 않는다.

applyDepthStyle(geometry: U3dGeometry, depth: boolean | undefined, includeChildren: boolean = false) -> void
    의존: THREE.Material — 깊이 렌더링 설정; 속성 쓰기: {depthWrite, depthTest, transparent, needsUpdate}
    동작:
        depth가 boolean이 아니면 종료한다.
        형상의 material이 truthy이면 단일·배열 재질 각각 depthWrite·depthTest를 depth로 설정하고 needsUpdate를 true로 만든다. false일 때만 transparent를 true로 바꾸며 true에서는 기존 투명 설정을 보존한다.
        includeChildren이 true이고 children이 배열이면 직접 자식 재질에도 같은 처리를 적용하며 손자까지 재귀하지 않는다.

KmlStyleContext 타입 정의
    type: string
        현재 단일 형상 종류 Point·LineString·Polygon이다.
    name: string | undefined
        원본 피처에서 선택한 이름이다.

KmlStyleFunction 함수 타입 정의
    (properties: KeyValue, context: KmlStyleContext) -> KmlRenderStyle | undefined | null
    인터페이스: 형상별 복사 속성과 종류·이름을 받아 스타일을 반환하며 실제 receiver는 레이어다.

U3dModelKmlLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseUrl: string
            공개 선언은 필수지만 kmlText·kmlData 경로에서는 런타임 필수 검증을 하지 않는다. [확인 Q-001]
        kmlText?: string
            비어 있지 않은 문자열 입력이다.
        kmlData?: ArrayBuffer | Uint8Array | Blob
            텍스트 입력보다 낮은 우선순위의 바이너리다.
        heightField?: string = height
            속성 높이의 선택 키다.
        styleFunction?: KmlStyleFunction
            형상별 스타일을 정하는 공식 콜백이다.

U3dModelKmlLayerCO 타입 정의
    U3dVectorLayerCO와 U3dModelKmlLayerCO_Content를 교집합한 생성 옵션이다.

KmlRenderStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        visible?: boolean = true
            현재 생성 경로는 Polygon에서만 직접 반영한다.
        color?: ColorRepresentation
            형상 색상의 사용자 우선값이다.
        opacity?: number
            유한한 변환값을 사용하며 이 단위에서 0~1로 제한하지 않는다.
        size?: number
            Point 크기다.
        lineWidth?: number
            LineString 폭이다.
        height?: number | string
            Polygon 높이다.
        useLine?: boolean
            Polygon 외곽선 사용이다.
        lineColor?: ColorRepresentation
            Polygon 외곽선 색상이다.
        img?: string
            Point 이미지 소스다.
        setShadow?: boolean
            Polygon 그림자 설정이다.
        exceptAO?: boolean
            Polygon userData.exceptAO 설정이다.
        depth?: boolean
            재질 깊이 설정이다.

U3dModelKmlLayerEMI 타입 정의
    COMPLETED: string
        초기값 completed인 KML 파싱 후 완료 이벤트 이름이다.
```

## 4. 공통 처리 기준과 제약

```spec
KML 텍스트·바이너리 로딩은 기존 형상을 먼저 비운 뒤 새 형상을 추가하며 전후 상태를 원자적으로 교체하지 않는다.
완료 이벤트는 형상 추가·경계 반영·update 호출 이후이며 이미지 로딩이나 실제 렌더 프레임 완료를 기다리는 계약이 아니다.
공개 static 기본 스타일과 이벤트 객체는 불변화하지 않으며 각 사용 경로가 실행 시 읽는 값을 사용한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
