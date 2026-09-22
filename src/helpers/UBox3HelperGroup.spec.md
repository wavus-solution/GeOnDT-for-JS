# UBox3HelperGroup 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UBox3HelperGroup`은 여러 `Box3`를 순서대로 표시하고 반복 입력에서 기존 helper를 재사용하는 `UGroup` 파생 클래스다.

### 1.2 책임 범위

경계 입력을 기존 자식에 연결하거나 새 helper를 등록하며, 입력 묶음이 끝나면 남는 helper를 해제·제거한다. 공개 입력 분기·재사용 위치·등록·수명주기 제어는 일반 소스에 두고 `#cursor` 접근 제한은 유지한다. 재사용 helper의 경계·색상 변경 또는 새 helper 구성 세부는 비공개 구현에 둔다.

### 1.3 주요 동작 방식

Box3를 추가할 때 현재 위치의 자식을 사용하고 위치를 증가시킨다. `commit()`은 호출 전 위치 뒤에 남은 자식을 제거한 뒤 다음 위치를 저장한다. helper 자체를 추가하는 경로는 재사용 위치를 증가시키지 않는다.

### 1.4 주요 사용처와 연계 대상

- `U3dGridTileLayer`가 타일별 helper 목록을 등록한다.
- `U3dLayer`가 디버그 경계 표시 그룹으로 생성한다.
- `UGroup`이 자식 등록·중복 판정·제거를, `UBox3Helper`가 경계 표시와 공유 자원을 담당한다.

## 3. 정규 자연어 수도코드

```spec
UBox3HelperGroupCO 타입 정의
    {} 별칭
    기존 생성자와 같이 별도의 필수 키·속성 타입 제약을 선언하지 않는다. name·drawarg의 실제 처리는 상위 UGroup에 맡긴다.

UBox3HelperGroup extends UGroup 클래스 정의
    의존: UGroup — 그룹 등록·수명주기 기반; 상속: {UGroup}

    #cursor: number = 0
        다음 Box3 입력에서 재사용할 children의 위치다. 직접 helper 입력은 이 값을 바꾸지 않는다.

    constructor(option: UBox3HelperGroupCO = {})
        의존: UGroup — 그룹 초기화; 생성자: {new UGroup()}
        동작: option을 변환하지 않고 상위 생성자에 전달하며 재사용 위치는 0으로 시작한다.

    override add(box3: unknown, color: Color | string | number = 0xffff00) -> UBox3HelperGroup
        인터페이스: 입력은 Box3 또는 UBox3Helper다. 모든 정상 종료에서 현재 this를 반환하여 하위 클래스의 체이닝도 보존한다.
        의존:
            UGroup — 기존 helper 및 새 helper 등록; 함수: {add()}
            Object3D — 상속된 자식 목록 조회; 속성 읽기: {children}
            UBox3Helper — 직접 helper 입력 종류 판정; 상수: {UBox3Helper}
            Box3 — 경계 입력 종류 판정; 상수: {Box3}
        동작:
            box3 또는 color가 falsy이면 현재 그룹을 반환한다. 색상 숫자 0은 검정이어도 이 조건에서 거부된다. [확인 Q-001]
            box3가 UBox3Helper instanceof를 통과하면 상위 add에 전달하고 현재 그룹을 반환한다. 하위 helper도 이 경로에 포함되며 color와 #cursor는 변경하지 않는다.
            그 외에 Box3 instanceof를 통과하면 현재 #cursor 위치의 children 값을 읽고 #cursor를 먼저 1 증가시킨다.
            기존 자식·경계·색상을 비공개 구현에 전달해 이번 helper를 준비한다.
            원래 자식이 falsy일 때만 준비한 helper를 상위 add에 등록하고 현재 그룹을 반환한다. 기존 자식이면 재등록하지 않는다.
            지원하지 않는 truthy 입력이면 상태를 바꾸지 않고 현재 그룹을 반환한다.
            생성·변경·등록의 오류는 포착하지 않으며 Box3 경로에서 이미 증가한 #cursor와 먼저 바뀐 box를 되돌리지 않는다.

    commit(cursor: number = 0) -> void
        인터페이스: cursor는 정리 후 다음 Box3 입력의 재사용 위치다.
        의존:
            Object3D — 상속된 자식 목록 조회; 속성 읽기: {children}
            UBox3Helper — 남은 helper 자원 해제; 함수: {dispose()}
            UGroup — 자식 제거; 함수: {remove()}
        동작:
            children.length가 호출 전 #cursor보다 클 때 마지막 인덱스부터 #cursor 이상인 인덱스까지 역순으로 순회한다.
            해당 자식이 null·undefined가 아니면 dispose를 호출한 뒤, 그 인덱스의 현재 children 값을 this.remove에 전달한다. dispose 중 목록이 바뀌면 변경된 값을 다시 읽는다.
            순회를 끝내거나 제거 대상이 없으면 #cursor를 인수 cursor로 저장한다. 정리 범위는 새 cursor로 계산하지 않는다.
            cursor의 정수·범위·유한성 검사는 하지 않는다. 중간 오류는 그대로 전달하고 그 경우 새 cursor 저장까지 진행하지 않는다. [확인 Q-002]
```

## 4. 공통 처리 기준과 제약

```spec
재사용은 자식의 identity를 유지하면서 box·color를 바꾼다. 자원 공유와 해제 효과는 UBox3Helper의 현재 계약을 따른다.
children은 상속된 공개 목록이며 이 클래스가 외부 변경을 차단하지 않는다. add·commit은 재사용 위치의 값이 helper라는 전제로 메서드를 호출하므로 외부에서 다른 종류를 넣으면 실패할 수 있다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
