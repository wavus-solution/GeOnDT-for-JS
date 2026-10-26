# UTileMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

타일의 기본 평면 지오메트리와 공용 재질을 사용하는 메시다. `U3dQuadTile`이 생성하며, 영상 지형 메시가 공유하는 지오메트리와 로컬 경계구를 제공한다. 장면 등록과 고도 자료 선택은 호출자가 담당한다.

## 3. 정규 자연어 수도코드

```spec
UTileMesh extends UMesh 클래스 정의
    의존: UMesh — 메시 기반 기능; 상속: {UMesh}

    static DEFAULT_BASIC_MATERIAL: MeshPhongMaterial
        의존: MeshPhongMaterial — 공용 재질 생성; 생성자: {new MeshPhongMaterial()}
        양면, 색상 #223D62, 이름 DEFAULT_BASIC_MATERIAL인 공용 재질

    #boundingSphere: Sphere | undefined = undefined
        영상 메시가 참조하는 로컬 경계구
    castShadow, receiveShadow: boolean
        타일 레벨에 따른 그림자 송수신 여부
    userData: object
        생성 시 빈 사용자 자료
    renderOrder: number
        타일의 렌더 순서
    visible: boolean = false
        생성 직후의 표시 상태

    constructor(tile: U3dQuadTile)
        의존:
            UPlaneBufferGeometry — 기본 평면 생성; 생성자: {new UPlaneBufferGeometry()}
            UMesh — 기반 초기화와 수동 행렬 갱신; 생성자: {super()}; 함수: {setManualUpdate()}; 속성 쓰기: {material.transparent, position, scale}
            UDEF — 메시 종류; 상수: {UMESH_TYPE._tile}
            UDrawArg — 그림자 허용 레벨; 함수: {getTerrainShadowLevel()}
        동작:
            타일 폭·높이와 좌상단 위치로 2×2 분할, 스커트 없는 높이 0의 평면을 생성하여 공용 재질과 함께 기반 메시에 전달한다.
            타일 종류·레이어명과 렌더 순서를 지정하며, 타일 레벨이 그림자 허용 레벨 이상일 때만 송수신 그림자를 켠다.
            userData를 비우고 메시를 숨기며 공용 재질의 투명성을 끈다.
            위치를 타일 좌상단, 배율을 1로 설정하고 수동 행렬을 갱신한다.

    get boundingSphere() -> Sphere | undefined
        동작: #boundingSphere 참조를 반환한다.

    set boundingSphere(value: Sphere | undefined)
        의존: __GInfo__ — 경계 재설정 알림; 함수: {__GInfo__()}
        동작:
            value가 falsy일 때만 #boundingSphere를 대입한다.
            값의 대입 여부와 무관하게 경계 재설정 알림을 남긴다.

    changeGeometry(geometry: UPlaneBufferGeometry) -> void
        의존:
            UMesh — 기존 지오메트리 참조; 속성 읽기: {geometry}
            UPlaneBufferGeometry — 기존 지오메트리 내용 변경; 함수: {change()}
        동작: 기존 지오메트리 객체에 입력 지오메트리의 자료를 반영한다.

    computeBoundingSphere(tile: U3dQuadTile = this.getTile()) -> void
        의존:
            UMesh — 기본 타일 조회와 메시 변환; 함수: {getTile()}; 속성 읽기: {position, scale}
            Sphere — 최초 경계구 생성; 생성자: {new Sphere()}
            __GInfo__ — 경계 누락 알림; 함수: {__GInfo__()}
        동작:
            tile 또는 tile._sphere가 없으면 알림을 남기고 종료한다.
            #boundingSphere가 없으면 생성한다.
            타일 경계구 중심에서 메시 위치를 빼고 축별 배율로 나누어 로컬 중심에 대입한다.
            타일 월드 상자의 축별 길이를 메시 배율로 나눈 뒤 대각선 길이의 절반을 로컬 반경으로 저장한다.
            기존 경계구 객체를 보존한다. 비균일 배율에서 렌더러가 환산한 구는 타일 월드 구보다 클 수 있지만 표면을 포함한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
