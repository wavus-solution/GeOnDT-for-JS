# UAbortError 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

해제나 취소 때문에 작업을 계속할 수 없는 경우를 구별한다.

### 1.2 책임 범위

취소 오류의 기본 메시지와 기존 취소 처리에서 사용하는 이름을 제공한다.

### 1.3 주요 동작 방식

UError로 메시지와 원인을 초기화한 뒤 name을 AbortError로 바꾼다.

### 1.4 주요 사용처와 연계 대상

U3dPatternXYZLayer의 해제된 레이어·타일 작업과 진행 중인 addDecal의 취소에 사용한다. U3dImageLayer의 기존 AbortError 이름 판정과 연결된다.

## 3. 정규 자연어 수도코드

```spec
UAbortError extends UError 클래스 정의

    name: string = 'AbortError'
        기존 취소 처리에서 사용하는 이름이며 호출자가 변경할 수 있다.

    constructor(message: string = '작업이 취소되었습니다.', cause: unknown = undefined)
        인터페이스:
            message는 취소 설명이며 빈 문자열을 전달하면 그대로 보존한다. cause는 선택적인 원인 값이다.
        동작:
            message와 cause를 부모 UError 생성자에 그대로 전달한다.
            name을 AbortError로 설정한다. UError와 Error의 상속 관계를 유지한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
