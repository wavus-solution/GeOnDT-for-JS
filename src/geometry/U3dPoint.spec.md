# U3dPoint 명세

> 상태: 구현 관찰 초안

## 1. 개요

화면을 향하는 Three.js Points로 이미지 표적과 색상 점을 표시한다. URL과 offset별 텍스처를 캐시하고 인스턴스별 재질은 독립 복제한다. U3dVectorLayer에 등록하며 U3dAnnotationUtil의 마커 생성에서도 사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dPointCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        size?: number = 1
        img?: string | HTMLImageElement
        offset?: Vector3Like
        sizeAttenuation?: boolean = false
        depthTest?: boolean = true
        heightOffset?: number
        renderOrder?: number = 0

U3dPointCO 타입 정의
    U3dGeometryCO & U3dPointCO_Content 별칭

U3dPointParam_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        size: number
        img: string | HTMLImageElement | undefined
        offset: Vector3Like | undefined
        sizeAttenuation: boolean
        depthTest: boolean

U3dPointParam 타입 정의
    U3dPointParam_Content & U3dGeometryStyleParam 별칭

U3dPoint extends U3dGeometry 클래스 정의
    의존: U3dGeometry — 기반 동작; 상속: {U3dGeometry}

    material: PointsMaterial | undefined
    userData: Object3D['userData']
    visible: Object3D['visible']
    renderOrder: Object3D['renderOrder']
    static DEFAULT_ALPHA_TEST: number = 0.9
    static materialList: Record<string, PointsMaterial | undefined>
    static #scaleList: Record<string, number>
    #imageScale: number = 1
    #appliedImageKey: string | HTMLImageElement | undefined = undefined
    #imageRequestId: number = 0
        setImage 진입과 영구 해제 때 증가하는 요청 세대
    _disposed: boolean = false
    _classtype: string = 'U3dPoint'
    size: number
    img: string | HTMLImageElement | undefined
    offset: Vector3Like | undefined
    sizeAttenuation: boolean
    depthTest: boolean
    isMesh: boolean = false
    texture: UTexture | Texture | undefined = undefined
    _url: string | undefined
    geometry: UBufferGeometry

    static disposeMaterialList() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            각 캐시 재질의 map을 dispose하고 null로 분리한 뒤 재질을 dispose한다.
            재질 및 배율 캐시를 새 빈 객체로 교체한다.
            살아있는 점이 공유 텍스처를 사용하므로 전체 종료 시 호출한다.

    static #isCachedTexture(texture: Texture | null | undefined) -> boolean
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            texture가 null·undefined이면 false다.
            materialList 중 map과 같은 참조가 하나라도 있으면 true, 아니면 false다.

    static #cacheKey(url: string, offset: Vector3Like | undefined) -> string
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            offset이 없으면 URL을 반환하고 있으면 URL 뒤에 |x,y를 붙여 반환한다.

    constructor(opt: U3dPointCO = {})
        의존:
            U3dGeometry — 생성·검증·자원과 상태 연결; 함수: {super()}
            defaultValue — 생성·검증·자원과 상태 연결; 함수: {defaultValue()}
        동작:
            기반 도형을 초기화 지연으로 생성하고 subSuper로 THREE.Points의 객체 속성을 복사한다.
            size=1, img·offset=undefined, 감쇠=false, 깊이 판정=true로 기본 설정하고 isMesh=false·texture=undefined로 둔다.
            _init으로 재질과 이미지를 준비한다.

    override getMaterial() -> PointsMaterial | undefined
        동작:
            현재 material을 반환한다.

    override setMaterial(material: PointsMaterial | undefined) -> void
        의존:
            U3dGeometry — 생성·검증·자원과 상태 연결; 함수: {setMaterial()}
        동작:
            기반 setMaterial에 전달한다.
            이전 자원은 자동 해제하지 않는다.

    getSize() -> number
        동작:
            size가 null·undefined이면 0으로 보고 #imageScale을 곱한 실제 크기를 반환한다.

    setSize(size: number) -> void
        의존:
            __GWarn__ — 생성·검증·자원과 상태 연결; 함수: {__GWarn__()}
        동작:
            size가 유한하지 않거나 0 미만이면 경고 후 유지한다.
            그 외 size를 저장하고 배율을 반영한다.

    updateSize(size: number) -> void
        동작:
            setSize로 위임한다.

    getSizeAttenuation() -> boolean
        동작:
            sizeAttenuation을 반환한다.

    setSizeAttenuation(val: boolean) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            boolean으로 저장하고 재질이 있으면 감쇠 및 needsUpdate를 반영한다.

    getDepthTest() -> boolean
        동작:
            depthTest를 반환한다.

    setDepthTest(val: boolean) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            boolean으로 저장하고 재질이 있으면 깊이 판정 및 needsUpdate를 반영한다.

    getOffset() -> Vector3Like | undefined
        동작:
            offset 참조를 반환한다.

    setOffset(offset: Vector3Like | undefined) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            U3dPoint.#sameOffset으로 기존 offset과 x,y를 비교하며 같으면 종료한다.
            새 참조를 저장하고 img가 정의되어 있으면 setImage로 재적용한다.

    override setImage(img: string | HTMLImageElement) -> void
        의존:
            defined — 재질 존재 판정; 함수: {defined()}
            UTexture — 엘리먼트의 개별 텍스처; 함수: {new UTexture()}
            UDEF — 텍스처 크기 유지; 함수: {noResizeTexture()}
        동작:
            _disposed가 true이거나 material이 없으면 종료한다.
            #imageRequestId를 증가시켜 현재 requestId로 보관한다.
            img가 문자열인 경우:
                _url과 img를 저장하고 URL·offset으로 key를 계산한다.
                #appliedImageKey를 key로 저장한다.
                materialList[key]가 있으면 key·requestId로 캐시를 적용한다.
                그 외에는 URL·key·requestId로 비동기 로드를 시작한다.
            img가 문자열이 아닌 경우:
                _url은 undefined로 바꾸고 img·#appliedImageKey를 엘리먼트로 저장한다.
                이전 개별 텍스처의 소유 참조를 끊고 해제한다.
                해제 콜백 뒤 현재 requestId가 아니면 종료한다.
                현재 요청인 경우:
                    UTexture를 만들고 배율=1·size=이미지 폭·실제 재질 크기를 저장한다.
                    noResizeTexture·업로드 표식을 설정하고 texture·material.map에 연결한다.
                    material.visible=true·needsUpdate=true로 바꾸고 change를 발생시킨다.

    override updateVertex() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            UBufferGeometry — 생성·검증·자원과 상태 연결; 함수: {new UBufferGeometry()}
            U3dGeometry — 생성·검증·자원과 상태 연결; 함수: {updateVertex()}
        동작:
            _vertices가 없거나 길이가 0이면 종료한다.
            _vertices가 정의되어 있고 길이가 0보다 큰 경우:
                잘못된 좌표를 경고 검사한다.
                geometry가 없으면 이름을 부여한 UBufferGeometry를 생성한다.
                super.updateVertex로 정점 속성을 갱신하고 geometry.computeBoundingBox를 호출한다.
                setRelativePosition으로 중심 기준 상대 좌표로 바꾼다.

    override setParam(param?: U3dPointCO) -> void
        의존:
            assertNonNegative — 생성·검증·자원과 상태 연결; 함수: {assertNonNegative()}
            assertBoolean — 생성·검증·자원과 상태 연결; 함수: {assertBoolean()}
            assertVector2 — 생성·검증·자원과 상태 연결; 함수: {assertVector2()}
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            U3dGeometry — 생성·검증·자원과 상태 연결; 함수: {setParam()}
        동작:
            param이 falsy면 빈 객체로 처리한다.
            size·감쇠·깊이 판정·offset과 이미지 타입을 먼저 검증한다.
            기반 공통 속성을 적용하고 정의된 점 속성을 저장한다.
            img 참조 또는 offset x,y가 바뀌고 이미지가 있으면 setImage로 다시 적용한다.
            마지막에 현재 재질 속성을 다시 반영한다.
            생성용 heightOffset·renderOrder는 별도 처리하지 않는다.

    override getParam() -> U3dPointParam
        의존:
            U3dGeometry — 생성·검증·자원과 상태 연결; 함수: {getParam()}
        동작:
            기반 속성의 새 객체에 요청 size·img·offset·감쇠·깊이 판정을 추가하여 반환한다.

    dispose() -> void
        의존:
            THREE — 생성·검증·자원과 상태 연결; 함수: {Points.prototype.dispose.call()}
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            UDEF — 생성·검증·자원과 상태 연결; 함수: {disposeResource()}
        동작:
            _disposed가 true이면 종료한다.
            _disposed가 false인 경우:
                _disposed=true로 확정하고 #imageRequestId를 증가시켜 이전 요청을 무효화한 뒤 THREE.Points.prototype.dispose로 해제 이벤트를 알린다.
                재질이 정의되어 있으면 map의 캐시 소유를 판정하며 캐시 텍스처이면 map=null로 분리한다.
                texture 참조를 undefined로 지우고 UDEF.disposeResource로 자체 재질·형상·개별 텍스처를 해제한다.
                등록된 벡터 레이어의 자체 dispose 리스너가 영구 해제 표식을 확인해 분리한다. 점 자체가 레이어 제거 API를 호출하지는 않는다.

    _init(opt: U3dPointCO) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.PointsMaterial()}
            defaultValue — 생성·검증·자원과 상태 연결; 함수: {defaultValue()}
        동작:
            정점을 갱신한다.
            opt.heightOffset이 truthy이면 객체 position.z에 더한다.
            subSuper에서 만든 기본 재질이 있으면 dispose한다.
            color·DEFAULT_ALPHA_TEST·감쇠·깊이 판정·toneMapped=false로 PointsMaterial을 생성한다.
            실제 재질 크기를 반영한다.
            이미지 로드 전 material.visible=false로 설정하고 renderOrder를 저장한다.
            img가 정의되어 있으면 이미지를 적용한다.
            img가 정의되어 있지 않으면 material.visible=true로 설정한다.

    #applyCachedMaterial(key: string, requestId: number) -> void
        의존:
            defined — 캐시·이전 자원 존재 판정; 함수: {defined()}
            THREE.Points — 변경 알림; 함수: {dispatchEvent()}
        동작:
            현재 requestId가 아니면 종료한다.
            materialList[key]가 없으면 종료한다.
            캐시 재질을 복제하고 이전 material·texture 참조를 보관한다.
            캐시 배율(없으면 1)·새 재질·공유 map을 먼저 현재 참조에 연결한다.
            현재 점의 속성을 반영하고 복제 재질을 표시한다.
            이전 재질이 정의되고 캐시 원본과 다르면 map을 null로 끊고 dispose한다.
            이전 texture가 정의되고 캐시 소유가 아니면 dispose한다.
            해제 콜백 이후에도 현재 requestId일 때만 change를 발생시킨다.

    #loadImageFromUrl(url: string, key: string, requestId: number) -> void
        의존:
            THREE.Points — 변경 알림; 함수: {dispatchEvent()}
            THREE — 이미지 비동기 로드; 함수: {new THREE.ImageLoader()}
            defined — offset·캐시 존재 판정; 함수: {defined()}
            U3dAnnotationUtil — offset 캔버스 생성; 함수: {drawImageOffset()}
            UTexture — 로드한 이미지 텍스처; 함수: {new UTexture()}
            UDEF — 텍스처 크기 유지; 함수: {noResizeTexture()}
            __GError__ — 현재 요청 실패 안내; 함수: {__GError__()}
        동작:
            기존 개별 텍스처를 해제한다.
            현재 requestId가 아니면 종료한다.
            현재 요청인 경우 ImageLoader로 URL을 로드한다.
            성공 콜백:
                현재 requestId가 아니면 종료한다.
                offset이 있으면 이미지 폭·높이와 offset으로 확장 캔버스를 만든다.
                UTexture를 생성하고 noResizeTexture·업로드 표식을 설정한다.
                같은 key가 먼저 캐시되었으면 새 텍스처를 버리고 key·requestId로 캐시를 적용한 뒤 종료한다.
                그 외에는 확장 폭/원본 폭 배율·texture·material.map을 연결하고 현재 점 속성을 반영한다.
                material.visible=true·needsUpdate=true로 바꾼다.
                재질을 복제해 materialList[key]에 등록하고 배율 캐시를 저장한다.
                texture dispose 리스너는 현재 캐시 map과 해제한 texture가 같을 때만 캐시 재질을 dispose하고 재질·배율 항목을 삭제한다.
                캐시 소유권과 무효화 리스너를 확정한 다음 change를 발생시킨다. 외부 리스너의 교체·dispose·예외 뒤에 이전 상태를 다시 기록하지 않는다.
            실패 콜백:
                현재 requestId가 아니면 종료한다.
                현재 요청인 경우 오류를 기록하고 material.visible=true·needsUpdate=true로 바꾼 뒤 change를 발생시킨다.

    #releaseOwnTexture() -> void
        의존:
            defined — 텍스처 존재 판정; 함수: {defined()}
        동작:
            이전 texture를 보관하고 현재 texture 참조를 먼저 undefined로 끊는다.
            이전 texture가 존재하고 캐시 소유가 아니면 material.map과 같은 참조일 때 map=null로 끊고 texture를 dispose한다.
            공유 캐시 텍스처는 해제하지 않는다.

    #isCurrentImageRequest(requestId: number) -> boolean
        의존:
            defined — 재질 존재 판정; 함수: {defined()}
        동작:
            _disposed가 false이고 material이 정의되어 있으며 #imageRequestId가 requestId와 같을 때만 true를 반환한다.

    #applyMaterialSize() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            material이 없으면 종료한다. material이 정의된 경우 현재 getSize 결과를 size에 반영한다.

    #applyMaterialParams() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            material이 없으면 종료한다. material이 정의된 경우 color·getSize 결과·감쇠·깊이 판정을 반영하고 needsUpdate를 켠다.

    static #sameOffset(a: Vector3Like | undefined, b: Vector3Like | undefined) -> boolean
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            둘 다 없으면 true, 하나만 없으면 false다.
            둘 다 있으면 x와 y가 모두 같은지 반환하며 z는 무시한다.

checkVertices(owner: U3dPoint, vertices: Array<Vector3>) -> void
    의존:
        defined — 좌표 존재 판정; 함수: {defined()}
        __GWarn__ — 잘못된 좌표 안내; 함수: {__GWarn__()}
    동작: 각 정점이 없거나 xyz 중 유한하지 않은 값이 있으면 인덱스를 모은다. 인덱스가 있으면 경고하고 예외나 좌표 교체 없이 종료한다.

모듈 초기화
    의존: subExtends — Three.js mixin 연결; 함수: {subExtends()}
    동작: U3dPoint에 THREE.Points 동작을 혼합한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
