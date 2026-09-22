# UBox3Helper 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UBox3Helper`는 Three.js의 `LineSegments`를 확장하여 `Box3` 경계를 선으로 표시한다. 인스턴스마다 같은 geometry를 쓰고 색상 키가 같은 재질을 재사용한다.

### 1.2 책임 범위

- 표시 대상·색상 참조를 연결하고 Three.js의 Box3Helper 행렬 갱신을 사용한다.
- 공유 geometry 초기화와 재질 획득·해제 흐름을 관리한다.
- 정점·인덱스 버퍼와 선 재질 구성 세부는 비공개 구현에서 담당한다. 공개 정적 저장소와 수명주기 제어는 일반 소스에 남아 있다.

### 1.3 주요 동작 방식

모듈 초기화에서 공유 버퍼를 준비하고 첫 인스턴스 생성에서 geometry에 연결한다. 색상으로 조회한 재질과 경계 참조를 인스턴스에 연결하며 실제 위치·크기는 행렬 갱신 때 반영한다. 재질 변경과 해제에서 획득한 참조를 반납하며, geometry와 재질은 각각 마지막 참조가 사라질 때 해제한다.

### 1.4 주요 사용처와 연계 대상

- `union3d/app/GeOnDT.js`가 helper를 공개한다.
- `UBox3HelperGroup`이 경계 입력에 대응하는 helper를 재사용한다.
- `U3dGridTileLayer`가 상자 목록을 만들고 공유 재질의 색상·투명도를 직접 변경한다.

## 3. 정규 자연어 수도코드

```spec
UBox3Helper extends LineSegments 클래스 정의
    의존: LineSegments — 선 객체의 상태와 장면 연결; 상속: {LineSegments}

    static sharedMaterials: Map<any, any> = 빈 Map
        색상 정수 키별 재질 캐시다. 외부 쓰기가 가능하며 임의로 넣은 truthy 값도 createMaterial에서 그대로 반환한다.
    static sharedState: Map<number, number> = 빈 Map
        색상별 남은 재질 참조 횟수다. 생성·다른 색상 획득에서 증가하고, 색상 교체·해제에서 감소하며 0이면 항목을 제거한다.
    static sharedIndex: BufferAttribute
        정적 초기화에서 INTERNAL.createIndexAttribute의 결과를 보관한다. 이후 외부에서 교체할 수 있으며 geometry를 처음 만들 때 읽는다.
    static sharedPositionAttr: Float32BufferAttribute
        정적 초기화에서 INTERNAL.createPositionAttribute의 결과를 보관한다. 이후 외부에서 교체할 수 있으며 geometry를 처음 만들 때 읽는다.
    static sharedGeometry: undefined | BufferGeometry
        런타임 초기값은 undefined이고 생성자가 필요할 때 만든다. 마지막 참조를 반납할 때 해당 geometry를 해제하고, 이 필드가 같은 객체를 가리키면 undefined로 바꾼다.
    static #geometryReferences: WeakMap<BufferGeometry, number> = 빈 WeakMap
        획득한 geometry 객체별 남은 helper 참조 수다. 공개 sharedGeometry가 교체되어도 기존 geometry의 반납을 구분한다.
    #materialKey: number
        재질 획득 시의 색상 키다. 공개 color의 이후 변경으로 반납 대상이 바뀌지 않는다.
    #sharedMaterial: Material | Array<Material>
        이 helper가 획득한 공유 재질이다. 공개 material이 교체되어도 이 참조를 반납한다.
    #sharedGeometry: BufferGeometry
        생성 시 획득한 공유 geometry다. 공개 geometry가 교체되어도 이 참조를 반납한다.
    box: Box3
        복제하지 않은 표시 대상 참조다. 외부 쓰기와 setBox의 변경을 행렬 갱신에서 읽는다.
    color: Color
        현재 색상 참조다. 외부 변경은 가능하지만 공유 참조 반납에는 획득 시 저장한 #materialKey를 사용한다.
    type: string = 'Box3Helper'
        상위 생성자의 값을 먼저 보존하고 box·color 연결 후 이 문자열로 지정한다. 쓰기 가능한 기존 종류 필드다.
    material: Material | Array<Material>
        LineSegments가 초기화하는 현재 표시 재질 참조다. setColor가 공유 캐시 값으로 교체하며, 공유 참조 반납은 별도로 저장한 #sharedMaterial을 사용한다.

    constructor(box: Box3, color: Color | string | number = 0xffff00)
        인터페이스: box는 표시 대상 원본이다. color가 Color이면 생성자에 전달한 참조를 color 필드에 보관한다.
        처리 기준: 인수 검증·예외 포착은 추가하지 않는다. geometry 준비 뒤 색상 처리에서 실패할 수도 있다.
        의존:
            BufferGeometry — 공유 geometry 생성·속성 연결·경계 구 계산; 생성자: {new BufferGeometry()}; 함수: {setIndex(), setAttribute(), computeBoundingSphere()}
            Color — 색상 호환 입력 변환; 생성자: {new Color()}
            LineSegments — geometry·material 소유 필드 초기화; 생성자: {new LineSegments()}; 속성 읽기: {geometry}
        동작:
            sharedGeometry가 falsy이면 BufferGeometry를 만들고 현재 sharedIndex와 sharedPositionAttr를 연결한다.
            color.isColor가 falsy이면 Color로 변환한다. null 입력은 이 속성 읽기에서 실패한다. createMaterial의 instanceof 판정과 같다고 간주하지 않는다.
            색상에 대응하는 재질을 획득한 뒤 같은 sharedGeometry와 함께 상위 생성자에 전달한다. 하위 클래스의 static 메서드가 아니라 UBox3Helper.createMaterial을 호출한다.
            획득한 재질과 색상 키, geometry를 내부 필드에 저장하고 해당 geometry의 참조 수를 1 증가시킨다.
            box·color 참조를 저장하고 type을 Box3Helper로 지정한 뒤 geometry의 경계 구를 계산한다.

    static createMaterial(color: Color | string | number) -> any
        인터페이스: 외부에서 변경 가능한 sharedMaterials의 캐시 값 또는 새 LineBasicMaterial을 반환한다.
        의존:
            Color — 색상 정규화와 캐시 키 계산; 생성자: {new Color()}; 함수: {getHex()}
        동작:
            Color instanceof 판정을 통과하지 않으면 Color로 변환하고 getHex 결과를 키로 삼는다.
            캐시 값이 falsy이면 비공개 구현으로 선 재질을 만든 뒤 재질과 획득 횟수 1을 공개 캐시에 저장한다.
            캐시 값이 truthy이면 재질을 바꾸지 않고 기존 횟수 또는 0에 1을 더하여 저장한다.
            선택한 캐시 값 또는 생성 재질을 반환한다.

    setBox(box3: Box3) -> void
        동작: box 참조만 교체한다. 행렬 갱신을 즉시 호출하지 않는다.

    setColor(color: Color | string | number) -> void
        처리 기준: 해제를 시작한 helper에는 변경을 적용하지 않으며 같은 색상 키는 추가 획득하지 않는다.
        의존:
            Color — 색상 호환 입력 변환; 생성자: {new Color()}
            LineSegments — 상속된 표시 재질 교체; 속성 쓰기: {material}
        동작:
            color가 Color instanceof 판정을 통과하지 않으면 Color로 변환한다.
            색상 키가 #materialKey와 같으면 기존 #sharedMaterial을 material에 연결하고 color 참조만 갱신한다.
            다른 색상이면 새 재질을 먼저 획득한다. 획득에 실패하면 기존 연결과 참조 수를 유지한다.
            새 재질·색상 키와 공개 material·color를 연결한 뒤 이전 키와 재질의 참조를 반납한다. 해제 이벤트는 교체된 상태를 관찰한다.

    static #releaseMaterial(colorKey: number, material: Material | Array<Material>) -> void
        역할: 획득한 재질 참조를 한 번 반납하고 마지막 참조이면 캐시와 자원을 정리한다.
        의존: Material — 마지막 참조의 재질 해제; 함수: {dispose()}
        동작:
            해당 키의 횟수 또는 0에서 1을 뺀 값이 양수이면 감소한 횟수를 저장하고 종료한다.
            0 이하이면 sharedState와 sharedMaterials의 항목을 먼저 삭제한다. 해제 이벤트에서 같은 색상의 새 helper를 생성해도 새 항목을 지우지 않는다.
            재질이 배열이면 중복 참조를 제외한 각 원소를, 단일 재질이면 그 객체를 한 번 해제한다.

    override updateMatrixWorld(force: boolean) -> void
        의존: Box3Helper — 경계에 따른 표시 변환 갱신; 함수: {prototype.updateMatrixWorld.call()}
        동작: 같은 this와 force로 Three.js Box3Helper의 updateMatrixWorld를 호출한다. 빈 box이면 기반 구현이 조기 종료하고, 그 외에는 중심과 반크기를 position·scale에 반영한 뒤 월드 행렬을 갱신한다.

    _disposed: boolean = false
        dispose 이벤트 재진입과 같은 인스턴스의 중복 자원 해제를 차단한다.

    override dispose() -> void
        처리 기준: 같은 helper의 반복 호출과 해제 이벤트 재진입은 최초 한 번만 처리한다. Scene 부모 관계는 변경하지 않는다.
        의존:
            LineSegments — 부모 해제 이벤트 전달; 함수: {dispose()}
            BufferGeometry — 마지막 참조의 공유 geometry 해제; 함수: {dispose()}
        동작:
            해제를 시작했으면 종료한다. 최초 호출에서는 해제 상태를 확정한 뒤 부모 dispose로 해제 이벤트를 전달한다.
            획득한 #sharedGeometry의 참조 수를 1 줄인다. 양수이면 저장하며, 0 이하이면 참조 기록을 제거하고 같은 객체를 가리키는 sharedGeometry를 비운 뒤 geometry를 해제한다.
            획득한 #materialKey와 #sharedMaterial의 참조를 반납한다.
            공개 geometry·material이 다른 객체로 교체되어 있어도 해당 외부 객체를 대신 해제하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
공개 정적 Map과 속성, box·color 참조의 외부 변경은 차단하지 않는다. sharedGeometry가 이미 존재하면 sharedIndex·sharedPositionAttr 교체를 기존 geometry에 다시 적용하지 않는다.
재질의 속성 변경은 같은 재질을 참조하는 다른 helper에도 보인다. 공개 캐시 Map을 직접 변경하면 호출자가 재질과 참조 수의 일관성을 유지해야 한다.
createMaterial을 외부에서 직접 호출해도 참조가 증가하므로 저장 횟수를 helper 개수만으로 해석하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
