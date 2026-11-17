# U3DInstancedTilesMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

3D Tiles의 인스턴스 집합을 하나의 Three.js InstancedMesh로 표시하고 인스턴스별 선택 색상과 엔진 메시 메타데이터를 제공한다.

### 1.2 책임 범위

인스턴스 geometry·material·개수를 기반 객체에 전달하고 선택 색상, 레이어 이름, 메시 종류와 경계 상자를 관리한다. 데이터 사용자가 지정하는 puid와 렌더 슬롯인 instanceId를 별도로 취급한다.

### 1.3 주요 동작 방식

생성 시 U3dObject 속성을 혼합하고 그림자와 건물 메시 기본값을 설정한다. 선택 시 선택된 슬롯 집합 전체에 이번 색상을 적용하고 미선택 슬롯은 흰색으로 설정한다. 복원은 선택 색상 버퍼 자체를 제거한다.

### 1.4 주요 사용처와 연계 대상

3D Tiles 인스턴스 모델을 표현하는 메시 형식이며 Three.js InstancedMesh와 U3dObject를 결합한다.

## 3. 정규 자연어 수도코드

```spec
HIGH_LIGHT_COLOR: string = '#fe5f55'
    선택 색상 기본값
HIGH_LIGHT_OPACITY: number = 0.6
    pickMaterial 시그니처의 기본값이며 현재 구현에서는 투명도에 반영하지 않는다.
whiteColor: Color
    의존: THREE.Color — 미선택 슬롯 색상; 생성자: {new Color()}
    흰색 0xffffff를 공유한다.

U3DInstancedTilesMesh extends THREE.InstancedMesh 클래스 정의
    의존: THREE.InstancedMesh — 인스턴스 집합 렌더 기반; 상속: {InstancedMesh}

    puid: string | undefined
        데이터 사용자가 지정하는 집합 재로딩 식별값
    castShadow, receiveShadow: boolean = true
        그림자 생성과 수신을 허용한다.
    _utype
        메시 종류이며 기본값은 UDEF.UMESH_TYPE._building이다.
    _ulayername = undefined
        소속 레이어 이름
    _disposed: boolean = false
        해제 상태
    _backgroundColor: Color
        배경색을 보관한다.
    _isBIM: boolean = false
        BIM 여부
    _pickMesh = undefined
        선택 관련 메시 참조
    _colorMap: Map = 빈 Map
        선택된 instanceId와 선택 색상의 대응표

    constructor(geometry, material, instanceLength, opt)
        의존:
            THREE — 인스턴스 기반과 기본 배경색 생성; 생성자: {super(), new Color()}
            U3dObject — 엔진 객체 속성 생성; 생성자: {new U3dObject()}
            assign — 엔진 속성 혼합; 함수: {assign()}
            defaultValue — 종류와 배경색 기본값; 함수: {defaultValue()}
            UDEF — 기본 메시 종류; 상수: {UMESH_TYPE._building}
        동작:
            geometry·material·instanceLength로 기반 인스턴스 메시를 만들고 falsy인 opt는 빈 객체로 바꾼다.
            opt로 만든 U3dObject의 속성을 현재 객체에 복사한다.
            그림자 생성·수신을 켜고 레이어 이름, 메시 종류, 해제·BIM·선택 상태와 배경색을 초기화한다.
            선택 슬롯을 관리할 빈 _colorMap을 만든다.

    getUid() -> string
        의존: THREE.Object3D — 현재 인스턴스 식별자; 속성 읽기: {uuid}
        동작: puid가 null 또는 undefined가 아니면 puid를 반환하고, 아니면 현재 객체의 uuid를 반환한다.

    get BackgroudColor()
        동작: _backgroundColor 참조를 반환한다.

    set BackgroudColor(clr) -> void
        동작: 입력 clr을 _backgroundColor에 저장한다.

    pickMaterial(intersectInfo, color = HIGH_LIGHT_COLOR, opacity = HIGH_LIGHT_OPACITY) -> void
        인터페이스: intersectInfo.instanceId는 선택할 렌더 슬롯이다. opacity는 현재 실행에서 사용하지 않는다.
        의존:
            defined — 교차 결과·슬롯·색상 존재 판정; 함수: {defined()}
            THREE.InstancedMesh — 슬롯 범위와 색상 반영; 함수: {setColorAt()}; 속성 읽기: {count}; 속성 쓰기: {instanceColor.needsUpdate}
            THREE.Object3D — 마지막 선택 슬롯 기록; 속성 쓰기: {userData.pickedInfo}
        동작:
            intersectInfo 또는 instanceId가 없으면 상태를 바꾸지 않고 종료한다.
            color가 정의되지 않았으면 0x00ffff를 사용하고 선택 슬롯을 _colorMap에 기록한다.
            0부터 count 미만까지 순회하며 이미 선택된 슬롯은 이번 color로 대응표와 색상 버퍼를 모두 바꾸고 미선택 슬롯은 whiteColor로 설정한다.
            instanceColor.needsUpdate를 true로 설정하고 userData.pickedInfo에 마지막 instanceId를 기록한다.

    restoreMaterial() -> void
        의존:
            THREE.InstancedMesh — 선택 색상 버퍼 제거; 속성 쓰기: {instanceColor}
            THREE.Object3D — 마지막 선택 슬롯 제거; 속성 쓰기: {userData.pickedInfo}
        동작: _colorMap을 비우고 instanceColor를 null로 제거하며 userData.pickedInfo를 undefined로 지운다.

    getUType()
        동작: _utype을 반환한다.

    setUType(type) -> void
        동작: _utype에 type을 저장한다.

    isBIM() -> boolean
        동작: _isBIM을 boolean으로 변환하여 반환한다.

    getLayerName()
        동작: _ulayername을 반환한다.

    setLayerName(name) -> void
        동작: _ulayername에 name을 저장한다.

    getParent()
        의존:
            defined — 부모 존재 확인; 함수: {defined()}
            THREE.Object3D — 부모 조회; 속성 읽기: {parent}
        동작: parent가 정의되어 있으면 반환하고, 아니면 undefined를 반환한다.

    getChildren() -> Array
        의존:
            defined — 자식 목록 존재 확인; 함수: {defined()}
            THREE.Object3D — 자식 조회; 속성 읽기: {children}
        동작: children이 정의되어 있으면 그 배열 참조를 반환하고, 아니면 새 빈 배열을 반환한다.

    getBBox() -> Box3
        의존: THREE.Box3 — 현재 객체 계층의 경계 계산; 생성자: {new Box3()}; 함수: {setFromObject()}
        동작: 새 Box3에 현재 객체의 경계를 계산하여 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
