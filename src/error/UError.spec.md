# UError 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

실패 설명과 원래 실패 값을 간단한 생성자 호출로 함께 보관한다.

### 1.2 책임 범위

표준 Error의 메시지·원인 저장과 기본 오류 이름 설정을 담당한다.

### 1.3 주요 동작 방식

메시지로 Error를 초기화하고 이름을 UError로 설정한다. 두 번째 인수는 cause에 직접 보관하며 변환하거나 복제하지 않는다.

### 1.4 주요 사용처와 연계 대상

U3dPatternXYZLayer의 Error가 아닌 초기화 실패 값을 감싸며, UAbortError의 부모 클래스다.

## 3. 정규 자연어 수도코드

```spec
UError extends Error 클래스 정의

    name: string = 'UError'
        생성 시 설정하는 오류 이름이며 호출자가 변경할 수 있다.

    cause: unknown
        undefined 이외의 원인이 있을 때만 생성하는 자체 속성이다. 열거에서는 제외하며 변경·삭제는 허용한다.

    constructor(message: string = '', cause: unknown = undefined)
        인터페이스:
            message는 오류 설명이다. cause는 두 번째 인수로 직접 받는 원인 값이다.
        동작:
            message로 표준 Error를 초기화하고 name을 UError로 설정한다. Error의 상속 관계와 기본 메시지·스택 동작을 유지한다.
            cause가 undefined이면 자체 cause 속성을 만들지 않는다.
            그 외에는 원인 값을 cause 속성에 그대로 대입하고 열거하지 않는 속성으로 바꾼다. null, 원시값과 객체 참조를 그대로 보존한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
