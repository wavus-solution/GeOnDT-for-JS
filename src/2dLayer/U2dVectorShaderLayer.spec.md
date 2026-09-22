# U2dVectorShaderLayer 명세

> 상태: 구현 관찰 초안

## 목적과 책임

2D Vector와 runtime feature를 일반 Scene 객체 또는 Terrain decal source로 변환하고, 타일별 Payload·Presentation·LOD 전환 상태를 Terrain manager와 동기화한다.

```spec
U2dVectorShaderLayer
    addTileFromScene(tile):
        현재 source와 terrain resource가 준비된 타일만 표시 단계로 진행한다.
        Terrain source contributor 표시 상태와 실제 binding 상태를 함께 확인한다.
    removeTileFromScene(tile):
        자식 Coverage가 실제 표시되기 전에는 부모 fallback을 유지한다.
        실제 LOD 전환이 아닌 Scene 이탈과 leaf 제거는 정상적으로 숨긴다.
        롤백으로 자식을 숨기면 부모 handoff를 해제한다.
    isTileRenderableReady(tile): source revision, material binding과 terrain resource 준비 상태를 반환한다.
    isTilePresentationVisible(tile): 참여 타일의 source contributor, 활성 terrain binding과 resource가 실제 표시 상태인지 반환한다.
    isTilePresentationAttached(tile): 최신 revision 준비와 무관하게 기존 Vector presentation이 화면에 붙어 있는지 반환한다. 표시 의도가 기록되지 않은 타일은 source가 실패 확정(failed/cancelled/disposed)이거나 적용본이 있을 때만 이탈(false)로 보고, 준비 중(pending·payload 도착)이면 판정 근거가 없는 중립(true)으로 둔다.
    isTileSceneRemovalDeferred(tile):
        자식 Coverage 준비 상태와 실제 부모 Presentation을 기준으로 제거 보류 여부를 반환한다.
        부모가 이미 숨겨져 Coverage가 없으면 오래된 handoff를 새로 만들지 않고 Quadtree 재평가를 요청한다.
    createTexture(tile): 준비된 build의 host Presentation 연결을 재요청하고 실제 swap-ready까지 기다린다.
    createTileSourceRequest(tile, extent, requestId):
        tile 하나의 source 요청을 실행·취소하는 함수를 반환하고, 기본 구현은 WFS GetFeature(BBOX) 요청이다.
        요청 큐 등록, 취소 handle, source pending 부기와 retry 판정은 createTexture가 담당한다.
        하위 Layer는 이 메서드만 override해 EPSG:3857 GeoJSON 형태의 `{features}`를 반환한다.
        요청을 만들 수 없으면 undefined를 반환해 해당 tile 요청을 건너뛴다.
        만든 요청을 큐에 넣지 않고 끝내는 retry 지연 경로에서도 cancel을 호출해 잡은 자원을 되돌린다.
```

## 공개 계약과 제약

- Vector source contributor는 다른 레이어가 소유한 terrain material binding을 임의로 변경하지 않는다.
- Parent fallback 보류는 논리 집합뿐 아니라 실제 타일 Mesh와 활성 binding 표시 상태를 유지해야 한다.
- 준비 완료와 실제 Scene attach를 별개 상태로 판정한다. 직전 적용본 유지(retained presentation) 판정과 source-only contributor의 표시 유지 판정은 `appliedSourceRevisions` 적용 이력이 아니라 manager presentation state의 목표 material 적용 상태(`isTargetMaterialApplied`)로 확인한다. 숨김→재표시에서 host material이 다시 등록되거나 최신 revision 재빌드를 기다리는 동안에는 이력이 남아도 화면에 적용본이 없으며, manager present 게이트가 뒤처진 revision의 buffer를 다시 적용하지 않으므로 이력만으로 부모를 준비 완료로 보면 축소(coarsen)에서 자식이 먼저 폐기되어 화면이 빈다.
- 해당 타일에 참여하지 않는 Vector 레이어는 다른 레이어의 Presentation 검증을 막지 않는다. source 등록만 끝나 표시 이력이 없는 Vector 레이어도 같다. 표시 이력은 표시 기록, cache mesh, 소유 binding, 실제 source payload 또는 `pending` 을 벗어난 source 상태 중 하나다. `pendingSourceKeys` 등록과 그 시점에 0으로 미리 채워지는 `sourceRevisions` 항목은 참여 이력일 뿐이라 표시 이력이 아니다. 이력이 없는 타일의 부착 판정은 미부착이 아니라 중립값이며, 최신 revision 전환 가능 여부는 계속 준비 판정이 담당한다. 새로 추가한 Layer가 아직 결과가 없는 타일을 미부착으로 만들면 다른 Layer가 이미 그린 Coverage가 LOD 전환 되돌림으로 사라진다.
- 선 단순화 허용 거리(`pathSimplifyTolerance`)는 표시 tile이 아니라 `getTerrainPathSimplifyTile(tile)`이 돌려주는 기준 tile의 level과 world 범위로 정한다. 기본 구현은 표시 tile 자신이며, 하나의 source 데이터를 여러 표시 level이 공유하는 하위 Layer는 그 source를 쓰는 표시 level 중 가장 확대된 level로 바꾼다. 기준이 표시 tile이면 같은 좌표 배열을 level마다 다른 허용 거리로 솎아내어 같은 선이 tile 경계에서 옆으로 밀려 보인다. Payload의 `clipBounds`는 이 기준과 무관하게 표시 tile 경계를 그대로 쓴다.
- Visibility-only 변경은 Payload 또는 Worker Build를 새로 예약하지 않는다.
- Runtime Feature 이동으로 타일의 마지막 Payload가 제거되면, host mesh 유무와 관계없이 해당 source를 `confirmed-empty`로 종료한다.
- WFS 요청이 `AbortError`로 끝났을 때 tile이 직접 취소한 경우(`cancelledByTile`)가 아니면 `createTexture`를 마이크로태스크로 즉시 재시도하지 않는다. 즉시 재시도는 새 요청이 다시 곧바로 abort되는 상황에서 렌더링에 제어를 넘기지 못하는 무한 연쇄(페이지 완전 정지)가 되므로, 실패 경로와 같은 `#scheduleTerrainWfsRetry`의 지수 백오프 timer(기본 1초, 최대 30초)로 미루고 timer가 `ensureTileProgress`로 진행을 다시 예약한다. style revision이 바뀌어 요청이 대체된 경우의 즉시 재시도는 revision 변화로 유한하므로 유지한다. debug 로그 `imageTexture:abortRetryScheduled`에 token·revision·지연·abort 사유를 남긴다.
- Debug 전환 로그(`pushDebugLog`) entry는 `scope: 'layer'`, `category: 'terrain-transition'`을 포함한다. Manager의 `emitTerrainTileDebugEvent`(`scope: 'manager'`)와 같은 전역 저장소를 쓰므로 출처를 이 두 필드로 구분한다.
- Presentation 완료 판정의 실패 revision 규칙은 `hasTerrainTileFailedCurrentRevision`(UShaderTerrainDecalTileStateManager)을 import해 공유하고 Layer가 독립 판정식을 갖지 않는다. Debug payload의 tile key 수집은 Manager facade `getTerrainTileKeys()`를 우선 사용하고, facade가 없는 테스트용 대체 manager에서만 `TERRAIN_TILE_REGISTRY.keys()`로 대체한다. 그 밖의 `TERRAIN_TILE_REGISTRY` 직접 참조는 이번 작업 범위 밖이며 후속 전환 대상이다(2026-09-08 승인된 예외 범위 안에서 본 절 항목 추가로만 동기화).
- 폴리곤 Shape 곡선 지연 생성(2026-09-10): `#processPolygonRings`는 feature에 `PBF_DEFERRED_SHAPE_KEY`(`_pbfDeferShape`) 표식이 `true`일 때만 곡선을 실제 소비 시점까지 미루는 `THREE.Shape`를 만들고, 표식이 없는 WFS·runtime 폴리곤은 기존 `new THREE.Shape(points)` 즉시 생성을 유지한다. 표식 이름은 이 모듈에서 한 번만 정의하고 `U3dVectorPBFLayer`가 import해 붙인다. 지연 Shape의 계약은 다음과 같다. ① `curves` accessor가 첫 접근에서 한 번만 실체화하며 곡선·`getPoints`·`getLength`·`extractPoints`·`clone`·`copy`·`toJSON`·`ShapeGeometry` 결과가 즉시 생성본과 같다. ② `currentPoint`는 생성 직후부터 마지막 입력점 값을 보이고, 실체화 전에 외부에서 바꾼 값도 잃지 않는다. ③ `curves` 대입(`copy`·`fromJSON`의 `curves = []` 포함)은 미실체화 원본을 취소하고 대입값만 남긴다. ④ `add`·`closePath`·`moveTo`/`lineTo`/Bezier/Spline/arc 계열 수정은 실체화 뒤 이어 붙어 이미 채워진 Shape와 같은 결과를 낸다. ⑤ `setCoordinates`의 `setFromPoints`가 기존 곡선을 지우지 않고 이어 붙이는 의미를 그대로 유지한다. ⑥ 점이 없는 입력은 즉시 생성과 같은 방식으로 실패한다. ⑦ 실체화 전에는 `intersectsExtent`·extent 계산·terrain payload 생성이 곡선을 만들지 않는다. 미실체화 좌표는 `UMeasureFeature`의 vectors와 같은 배열을 복제 없이 참조하므로, 실체화 전에 그 배열을 제자리에서 바꾸면 즉시 생성본과 달리 바뀐 값이 반영된다. 관찰용으로 비열거 `__deferredPolygonShapePending` getter를 두며 이 getter는 곡선을 만들지 않는다. 표식이 있는 폴리곤의 `curves`는 data property가 아니라 accessor property이므로 property descriptor가 즉시 생성본과 다르고, 표식이 없는 폴리곤에는 이 차이가 없다. PBF로 만든 `UMeasureFeature`도 `getFeatures()`·`getFeatureById()`로 노출되므로 이 계약이 외부 관찰까지 보존해야 한다.
- 보이지 않는 도형과 외곽선만 있는 면의 terrain payload(2026-09-22): `#buildTerrainFeaturePayload`는 면·선 feature 의 resolved style 이 **채움 불투명도 0 이고 외곽선도 없으면(strokeOpacity 0 또는 strokeWidth 0)** payload 를 만들지 않는다(`undefined`). 채움만 없고 외곽선이 있는 면은 `area` 가 아니라 **닫힌 `path`**(첫 점과 끝 점이 다르면 첫 점을 덧붙임, `isHole` 은 false)로 보낸다. area 의 경계 판정(모든 변까지의 최소 거리 ≤ 반폭)과 path 판정(어느 segment 까지의 거리 ≤ 반폭)은 같은 픽셀을 덮으므로 화면은 같고, path 는 segment 단위 버킷과 `pathSimplifyTolerance` 를 받아 정점이 수천 개인 경계(행정경계)의 워커 패킹·합성 비용이 줄어든다. 채움 색의 rgba 알파는 `validateStyle` 이 `fillOpacity` 로 옮기므로 투명 판정은 `fillOpacity` 하나로 한다. 점(circle)은 대상이 아니다. 기준선: imagePbfLayers 벡터 행정경계 타일의 feature 절반이 투명 채움 + 선 폭 0 인 잘린 면(외곽선은 별도 선 feature)이었고, 소스 도착→적용 p90 이 12~14레벨에서 350~1,600ms 였다.
- Source 안정성 전달(2026-09-09): tile source payload 동기화(`syncTerrainTileFeatures`)에 `compositionStability`를 함께 넘긴다. runtime source(`#getTerrainFeatureSourceKey()`와 같은 key)는 `dynamic`, 그 밖의 tile source는 `static`이다. static은 영구 불변이 아니라 source revision 단위로만 갱신된다는 뜻이며, `sourceKey` 문자열의 접두사를 새 추론 규칙으로 쓰지 않고 Layer가 이미 구분하고 있는 두 source의 의미를 그대로 전달한다.
- 연속 갱신 tile 의 LOD 준비 판정(2026-09-22): `isTileRenderableReady`(소유 binding 분기와 source-only 분기 모두)·`isTilePresentationVisible`·`#commitTerrainTileVisibility`의 source-only contributor 최신 준비 판정은 manager `isTerrainTileSwapReady` 에 `acceptInFlightRevision: true` 를 넘긴다. 움직이는 runtime feature(40Hz 원)가 지나는 tile 은 적용이 끝나는 tick 에 다음 revision 이 올라 "최신 revision 적용" 이 어느 프레임에도 성립하지 않아, 화면에 없는 자식 tile 이 이 레이어 때문에 영원히 부착되지 못하고 부모 LOD 가 남았다(휠 줌 실측 6.9~8.3초, 차단 레이어 satellite·subVectorLayer). 같은 이유로 `#syncRuntimeFeatureTileForScene`의 같은 준비 상태 분기는 `isSettled` 뿐 아니라 **적용본이 이미 목표 material 에 붙어 있으면**(`hasActivePresentation`·`isTargetMaterialApplied`, source 표시 중) 표시 의도를 기록한다(실측: 적용본 있음·source revision 최신인데 tile revision 지연으로 `isSettled=false` 가 차단 사유의 272/274). payload 재동기화가 필요한 경우(`shouldResyncPayload`: idle 이고 source 가 없거나 revision 이 어긋남)와 적용본이 없는 tile 은 종전대로 기다린다. 적용본 유지(retained) 판정과 `isTilePresentationAttached` 의 이탈 규칙은 바뀌지 않는다.

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
