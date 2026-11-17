// 예제 시설 이동 중 최신 요청만 실제 메쉬 경계로 후속 조정합니다.
let referenceCameraGeneration=0;
// 시설의 로딩 요청과 보정 완료 후 화면 표시를 분리합니다. 레이어 수명은 main이 소유합니다.
const referenceLayerPresentation=new WeakMap();


/**
 * 페이지 DOM을 기존 세션과 연결합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 기능 DOM을 포함한 런타임 문맥 자료형: GeOnDTExampleContext.
 * @param {object} example main이 반환한 Manager·초기 설정 자료형: object.
 * @returns {Promise<function():void>} Runtime이 main.dispose보다 먼저 호출할 자체 UI 정리 함수
 */
export async function initializeUI(context,example){
    const moduleUrl=new URL("/extension/sequence/sequence.js",context.runtime.resolveAsset("assets/bridge.source.json")).href;
    const {USequencePageHandler,USequenceOpacityPanel,USequenceObjectListPanel,USequenceObjectFocusExecutor,UTilesPropertySelectionHandler}=await import(moduleUrl);
    const handler=new USequencePageHandler({root:context.elements.root,sessionManager:example.manager,initialSource:example.initialSource});
    const resources=[handler.dispose.bind(handler)];
    try{
        const opacityPanel=new USequenceOpacityPanel({container:context.elements.root.querySelector('[data-sequence="settings-panel"]'),sessionManager:example.manager});
        resources.push(opacityPanel.dispose.bind(opacityPanel));
        const focusExecutor=new USequenceObjectFocusExecutor({sessionManager:example.manager});
        resources.push(focusExecutor.dispose.bind(focusExecutor));
        opacityPanel.mount();
        handler.mount();
        const objectList=new USequenceObjectListPanel({container:context.elements.root.querySelector('[data-sequence="object-list"]'),sessionManager:example.manager,focusExecutor});
        resources.unshift(objectList.dispose.bind(objectList));
        objectList.mount();
        resources.unshift(connectSelectionHandoff(context.elements.root,objectList,example.manager));
        const propertySelection=new UTilesPropertySelectionHandler({
            root:context.elements.root.closest('#example-viewer'),app:context.app,
            onResult:handler.showObjectProperties.bind(handler),
            // 현재 시계열 레이어에만 기존 속성 스냅샷을 재사용합니다.
            resolveObject(layer,objectId){
                const session=example.manager.session;
                return session?.layer===layer?session.query.getObject(objectId):null;
            }
        });
        resources.unshift(propertySelection.dispose.bind(propertySelection));propertySelection.mount();
        resources.unshift(connectReferenceLayer(context.elements.root,context.app,example.referenceLayer,'hojeo2','호저제2 구교'));
        resources.unshift(connectReferenceLayer(context.elements.root,context.app,example.usanLayer,'usan1','우산제1 구교'));
        resources.unshift(connectReferenceLayer(context.elements.root,context.app,example.slopeLayer,'slope','토공 비탈면'));
        resources.unshift(connectReferenceLayer(context.elements.root,context.app,example.noiseBarrierLayer,'noise-barrier','방음벽 10km120'));
        resources.unshift(connectReferenceLayer(context.elements.root,context.app,example.noiseBarrier9km400Layer,'noise-barrier-9km400','방음벽 9km400'));
        resources.unshift(connectLayerVisibility(context.elements.root,context.app,example.manager,new Map([['hojeo2',example.referenceLayer],['usan1',example.usanLayer],['slope',example.slopeLayer],['noise-barrier',example.noiseBarrierLayer],['noise-barrier-9km400',example.noiseBarrier9km400Layer]])));
        resources.unshift(connectLeftPanelTabs(context.elements.root));
        resources.unshift(connectTimelineLayout(context.elements.root));
        void handler.connectInitialSource();
    }catch(error){
        try{disposeUiResources(resources);}
        catch(cleanupError){throw new AggregateError([error,cleanupError],'교량 UI 초기화와 정리에 실패했습니다.');}
        throw error;
    }
    /**
     * 자체 UI만 정리하며 Manager는 main이 정리합니다.
     */
    function disposeUI(){ disposeUiResources(resources); }
    return disposeUI;
}


// 교량 하단 도구의 실제 높이를 관찰하여 설정·속성 패널의 표시 범위에 반영합니다.
function connectTimelineLayout(root){
    const viewer=root.closest('#example-viewer'),bottom=root.querySelector('.bim-sequence-bottom');
    if(!viewer||!bottom)throw new Error('교량 지도와 타임라인 영역이 필요합니다.');
    const window=root.ownerDocument.defaultView;
    const previousHeight=viewer.style.getPropertyValue('--bim-timeline-height');
    // 타임라인 표시 높이(px)가 바뀌면 패널 배치용 CSS 값만 갱신합니다.
    function updateHeight(){
        const value=Math.ceil(bottom.getBoundingClientRect().height)+'px';
        if(viewer.style.getPropertyValue('--bim-timeline-height')===value)return;
        viewer.style.setProperty('--bim-timeline-height',value);
    }
    const observer=typeof window.ResizeObserver==='function'?new window.ResizeObserver(updateHeight):null;
    if(observer)observer.observe(bottom);
    else window.addEventListener('resize',updateHeight);
    updateHeight();
    // 자체 높이 관찰과 대체 이벤트를 해제하고 이전 CSS 변수로 복원합니다.
    function disposeLayout(){
        observer?.disconnect();
        window.removeEventListener('resize',updateHeight);
        if(previousHeight)viewer.style.setProperty('--bim-timeline-height',previousHeight);
        else viewer.style.removeProperty('--bim-timeline-height');
    }
    return disposeLayout;
}

// 자체 UI 정리 함수를 순서대로 실행하며 일부 실패 시에도 나머지 자원을 정리합니다.
function disposeUiResources(resources){
    const failures=[];
    for(const dispose of resources.splice(0)){
        try{dispose();}
        catch(error){failures.push(error);}
    }
    if(failures.length)throw new AggregateError(failures,'교량 UI 자원 정리에 실패했습니다.');
}

// 왼쪽 패널의 제목과 접근성 이름을 예제 탭 이름에 맞추고 탭 전환을 연결합니다.
function connectLeftPanelTabs(root){
    const dock=root.querySelector('.bim-left-dock'),buttons=[...dock.querySelectorAll('button[data-left-tab]')];
    for(const button of buttons){
        const heading=root.querySelector('#'+button.dataset.leftTab)?.querySelector('h2');
        if(!heading)continue;
        const title=button.textContent.trim();
        heading.textContent=title;
        if(heading.parentElement.hasAttribute('aria-label'))heading.parentElement.setAttribute('aria-label',title);
    }
    // 유효한 탭만 선택하고 기존 위젯을 유지한 채 표시 상태를 바꿉니다.
    function selectTab(selected){
        for(const button of buttons){
            const active=button===selected,panel=root.querySelector('#'+button.dataset.leftTab);
            button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;panel.hidden=!active;
        }
    }
    // 자체 탭 버튼의 클릭을 처리합니다.
    function handleClick(event){
        const button=event.target.closest?.('button[data-left-tab]');
        if(buttons.includes(button))selectTab(button);
    }
    // 탭 목록 안의 좌우 화살표·처음·끝 키로 선택과 키보드 초점을 이동합니다.
    function handleKey(event){
        const index=buttons.indexOf(event.target);if(index<0)return;
        let next=index;
        if(event.key==='ArrowRight')next=(index+1)%buttons.length;
        else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;
        else if(event.key==='Home')next=0;
        else if(event.key==='End')next=buttons.length-1;
        else return;
        event.preventDefault();selectTab(buttons[next]);buttons[next].focus();
    }
    dock.addEventListener('click',handleClick);dock.addEventListener('keydown',handleKey);
    // 자체 탭 이벤트만 해제하고 패널의 수명은 각 위젯이 처리하도록 둡니다.
    function disposeTabs(){dock.removeEventListener('click',handleClick);dock.removeEventListener('keydown',handleKey);}
    return disposeTabs;
}

// 공통 버튼의 확정 상태에 GUID 선택기의 지도 입력을 맞추고 도구 전환·지도 클릭 전에 이전 선택을 정리합니다.
function connectSelectionHandoff(root,objectList,manager){
    const viewer=root.closest('#example-viewer');
    if(!viewer)throw new Error('선택 전환을 연결할 예제 영역이 필요합니다.');
    const toggle=viewer.querySelector('[data-common-select-toggle]');
    if(!toggle)throw new Error('지도 선택 상태를 연결할 공통 선택 버튼이 필요합니다.');
    // Manager는 일반 편집기를 위해 새 선택기를 켭니다. 최초 연결·문서 열기·편집 확정마다
    // 실제 버튼 상태를 다시 적용하여, 꺼진 버튼 뒤에서 전용 선택기만 입력을 받지 않게 합니다.
    // 버튼의 확정된 활성 상태를 현재 세션의 클릭 입력에 적용합니다.
    function synchronizeSelection(){
        const selector=manager.session?.selector;
        if(!selector)return;
        if(toggle.getAttribute('aria-pressed')==='true')selector.active();
        else selector.deactive();
    }
    // 새 세션이 동기 부착된 직후 같은 호출 안에서 입력 상태를 맞춥니다.
    function handleSession(type){if(type==='changed')synchronizeSelection();}
    // 버튼 클릭 횟수로 상태를 추측하지 않습니다. 공통 도구가 활성화에 실패한 경우에도
    // aria-pressed에 반영한 실제 결과를 다음 사용자 입력 전에 전달합니다.
    const observer=new root.ownerDocument.defaultView.MutationObserver(synchronizeSelection);
    synchronizeSelection();
    const unsubscribe=manager.subscribe(handleSession);
    observer.observe(toggle,{attributes:true,attributeFilter:['aria-pressed']});
    // 이전 목록 선택 정리에 실패한 원인을 개발 콘솔에 기록합니다.
    function reportSelectionError(error){console.warn('이전 부재 선택을 해제하지 못했습니다.',error);}
    // 공통 도구를 켜거나 끄기 직전과 지도 클릭 선택 직전에 기존 목록 선택을 해제합니다.
    function handleSelectionHandoff(event){
        const button=event.target.closest?.('[data-common-select-toggle]');
        const togglesTool=event.type==='click'&&button===toggle;
        const selectsMap=event.type==='pointerdown'&&event.button===0&&event.target.tagName==='CANVAS'
            &&event.target.closest('#map')&&toggle?.getAttribute('aria-pressed')==='true';
        if(togglesTool||selectsMap)void objectList.clearSelection().catch(reportSelectionError);
    }
    viewer.addEventListener('click',handleSelectionHandoff,true);
    viewer.addEventListener('pointerdown',handleSelectionHandoff,true);
    // 자체 버튼 관찰·세션 구독·두 캡처 수신을 제거하고 공통 지도·목록·세션은 유지합니다.
    function disconnectSelectionHandoff(){
        observer.disconnect();unsubscribe();
        viewer.removeEventListener('click',handleSelectionHandoff,true);
        viewer.removeEventListener('pointerdown',handleSelectionHandoff,true);
    }
    return disconnectSelectionHandoff;
}

// 시설 타일 로딩은 허용하면서 높이 보정 전에는 화면 표시를 보류합니다.
function connectReferenceLayer(root,app,layer,key,label){
    const button=root.querySelector('[data-reference-layer="'+key+'"]');
    const status=root.querySelector('[data-reference-layer-status="'+key+'"]');
    if(!button||!status||!layer)throw new Error(label+' 레이어 연결 요소가 필요합니다.');
    let disposed=false,prepared=false,aligned=false,moving=false,alignmentPromise=null;
    let originalPosition=null,originalOffsetBounds=null,heightOffset=0,contactCount=0,residualMin=0,residualMax=0;
    button.disabled=true;
    const originalGroupVisible=layer.getGroup().visible;
    referenceLayerPresentation.set(layer,synchronizePresentation);
    synchronizePresentation();
    // 사용자의 표시 요청은 타일 로딩에 유지하고 화면 표시는 높이 보정 후에만 허용합니다.
    function synchronizePresentation(){
        if(disposed||layer.isDisposed())return;
        const visible=layer.getVisible(),group=layer.getGroup(),present=visible&&aligned;
        if(group.visible!==present){group.visible=present;app.forceUpdate();}
        if(visible&&!aligned)void ensureMeshAlignment().catch(showError);
    }
    // 현재 월드 경계로 이동 대상을 구합니다.
    function readDisplayBounds(useMeshes=false){
        const box=layer.getBoundingBox()?.clone(),group=layer.getGroup();
        if(!box||box.isEmpty()||!group)throw new Error('시설의 표시 경계를 읽을 수 없습니다.');
        updateReferenceWorldMatrices(group);
        if(useMeshes){
            const rendered=readReferenceMeshBounds(layer);
            if(!rendered.isEmpty())return key==='slope'?readSlopeNavigationBounds(layer,rendered):rendered;
        }
        box.applyMatrix4(group.matrixWorld);
        return key==='slope'?readSlopeNavigationBounds(layer,box):box;
    }
    // 실제 접점을 측정하기 전에는 정합 대기를 표시하고 측정 후에만 보정 완료를 표시합니다.
    function showReady(){
        if(disposed)return;
        button.disabled=!prepared||moving;
        status.textContent=moving?label+' 위치로 이동 중…':aligned?'3D Tiles · 고도 보정됨':'3D Tiles · 높이 보정 후 표시 대기';
        status.title=aligned?'전체 수직 이동 '+heightOffset.toFixed(2)+' m · 실제 하단 '+contactCount+'점 · 지형 잔차 '+residualMin.toFixed(2)+' ~ '+residualMax.toFixed(2)+' m':'이동하면 실제 메쉬를 읽어 하단 접점의 지형 높이를 측정합니다.';
    }
    // 연결·측정·이동 실패를 해당 행에 표시합니다.
    function showError(error){
        if(disposed)return;
        button.disabled=!prepared||moving;
        status.textContent='높이·이동 실패: '+(error?.message??String(error));
    }
    // 타일 경계 준비 후 복원 기준을 보관하고 이동을 허용합니다.
    async function prepareLayer(){
        if(disposed||layer.isDisposed())return;
        originalPosition=layer.getGroup().position.clone();
        originalOffsetBounds=layer.getContentOffsetBounds();
        prepared=true;
        showReady();
        await ensureMeshAlignment();
    }
    // 동일 메쉬의 중복 지형 요청을 합치고 실제 형상이 없는 상태에서는 정합을 완료하지 않습니다.
    async function ensureMeshAlignment(){
        if(disposed||!prepared||layer.isDisposed()||!layer.getVisible())return;
        if(aligned){updateReferenceWorldMatrices(layer.getGroup());return;}
        if(alignmentPromise)return alignmentPromise;
        const points=collectReferenceFootpoints(layer);
        if(!points.length)return;
        alignmentPromise=alignActualMesh(points);
        try{await alignmentPromise;}
        finally{alignmentPromise=null;}
    }
    // 하단 접점 전체의 중앙 이격을 기준으로 레이어를 균일 이동합니다.
    async function alignActualMesh(points){
        if(!moving)status.textContent='3D Tiles · 실제 메쉬 높이 측정 중…';
        const grounds=await readReferenceTerrainHeights(app,points);
        if(disposed||layer.isDisposed()||!layer.getVisible())return;
        const scale=GeOnDT.UMathEngine.getRealScaleAtGoogle(points[0]),gaps=[],targets=new Map();
        for(let index=0;index<points.length;index++){
            const point=points[index],pointScale=GeOnDT.UMathEngine.getRealScaleAtGoogle(point);
            if(!isReferenceTerrainHeight(grounds[index])||!Number.isFinite(pointScale)||pointScale<=0)continue;
            const dem=grounds[index]/pointScale,rendered=app.getRenderHeightAtPoint(point,true);
            const ground=isReferenceTerrainHeight(rendered)&&Math.abs((rendered-dem)*pointScale)<=5?rendered:dem;
            gaps.push(point.z-ground);targets.set(point.x+":"+point.y,ground);
        }
        if(!gaps.length)throw new Error('실제 메쉬 하단의 유효한 지형 높이가 없습니다.');
        const shift=-referenceMedian(gaps)+.1/scale;
        if(!Number.isFinite(shift)||!Number.isFinite(scale)||scale<=0)throw new Error('실제 메쉬 높이 보정값이 유효하지 않습니다.');
        const group=layer.getGroup(),previous=originalOffsetBounds??{min:[0,0,0],max:[0,0,0]};
        const cumulative=group.position.z-originalPosition.z+shift;
        layer.setContentOffsetBounds({
            min:[previous.min[0],previous.min[1],Math.min(0,previous.min[2]+cumulative)],
            max:[previous.max[0],previous.max[1],Math.max(0,previous.max[2]+cumulative)]
        });
        group.position.z=originalPosition.z+cumulative;
        updateReferenceWorldMatrices(group);
        heightOffset=cumulative*scale;contactCount=gaps.length;
        const residuals=[];
        for(const point of collectReferenceFootpoints(layer)){
            const ground=targets.get(point.x+":"+point.y);if(ground===undefined)continue;
            residuals.push((point.z-ground)*GeOnDT.UMathEngine.getRealScaleAtGoogle(point));
        }
        residualMin=Math.min(...residuals);residualMax=Math.max(...residuals);
        if(!residuals.length||Math.abs(referenceMedian(residuals)-.1)>.5){
            group.position.copy(originalPosition);updateReferenceWorldMatrices(group);
            layer.setContentOffsetBounds(originalOffsetBounds);
            throw new Error('렌더 월드 행렬에 높이 보정이 반영되지 않았습니다.');
        }
        aligned=true;synchronizePresentation();showReady();
    }
    // 타일 로딩 완료 후 실제 표시 메쉬의 접점을 측정합니다.
    function handleLayerLoaded(){
        if(disposed||layer.isDisposed())return;
        if(aligned)updateReferenceWorldMatrices(layer.getGroup());
        synchronizePresentation();
    }
    // 현재 표시 위치로 이동한 뒤 새로 로딩된 메쉬의 높이를 먼저 보정하고 보정된 실제 경계에 카메라를 다시 맞춥니다.
    async function moveToLayer(){
        if(disposed||button.disabled||!prepared)return;
        moving=true;
        showReady();
        const generation=++referenceCameraGeneration;
        try{
            await ensureMeshAlignment();
            if(disposed)return;
            if(generation!==referenceCameraGeneration){moving=false;showReady();return;}
            const box=readDisplayBounds(true);
            await fitDisplayBounds(box);
            if(disposed||layer.isDisposed())return;
            await ensureMeshAlignment();
            const rendered=readDisplayBounds(true);
            if(generation===referenceCameraGeneration&&!rendered.equals(box))await fitDisplayBounds(rendered);
            moving=false;
            showReady();
        }catch(error){
            moving=false;
            if(generation===referenceCameraGeneration)showError(error);
            else showReady();
        }
    }
    // 표시 경계의 보정된 월드 좌표에 카메라를 맞춥니다.
    async function fitDisplayBounds(box){
        const size=box.getSize(box.min.clone()),center=box.getCenter(box.min.clone());
        const scale=GeOnDT.UMathEngine.getRealScaleAtGoogle(center),margin=Math.max(size.length()*(key==='slope'?.15:1.6),80/scale);
        const moved=await app.fitExtentToBoundingBox(box,true,margin,0,55);
        if(moved===false)throw new Error('시설 위치로 이동하지 못했습니다.');
    }
    button.addEventListener('click',moveToLayer);
    layer.addEventListener('layer-loaded',handleLayerLoaded);
    void layer.ready.then(prepareLayer).catch(showError);
    // 자체 수신과 늦은 완료를 차단하고 살아 있는 레이어의 원래 그룹 위치·판정 범위를 복원합니다.
    function disposeReferenceLayerUi(){
        if(disposed)return;
        disposed=true;
        referenceLayerPresentation.delete(layer);
        button.removeEventListener('click',moveToLayer);
        layer.removeEventListener('layer-loaded',handleLayerLoaded);
        if(layer.isDisposed())return;
        layer.getGroup().visible=originalGroupVisible;
        if(!originalPosition)return;
        layer.getGroup().position.copy(originalPosition);
        updateReferenceWorldMatrices(layer.getGroup());
        layer.setContentOffsetBounds(originalOffsetBounds);
    }
    return disposeReferenceLayerUi;
}

// 최상위 그룹의 표시 대기를 제외하고 자식의 LOD·가시성을 유지한 실제 그리기 범위에서 평면 격자별 최하단 정점을 모읍니다.
function collectReferenceFootpoints(layer){
    const group=layer.getGroup();
    updateReferenceWorldMatrices(group);
    const box=readReferenceMeshBounds(layer);
    if(box.isEmpty())return [];
    const cellSize=Math.max(box.max.x-box.min.x,box.max.y-box.min.y,1)/12,cells=new Map();
    // 표시되는 개별 메쉬의 실제 그리기 범위만 하단 표본에 포함합니다.
    function includeMesh(mesh){
        if(!mesh.isMesh||!mesh.geometry?.getAttribute('position'))return;
        includeReferenceFootpoints(mesh,box,cellSize,cells);
    }
    for(const child of group.children)child.traverseVisible(includeMesh);
    return [...cells.values()];
}

// 메쉬의 실제 인덱스·drawRange를 순회해 각 평면 격자의 최하단 월드 정점을 보관합니다.
function includeReferenceFootpoints(mesh,box,cellSize,cells){
    // 격자별 최하단 월드 표본을 사본으로 보관합니다.
    function includePoint(point){
        const key=Math.floor((point.x-box.min.x)/cellSize)+':'+Math.floor((point.y-box.min.y)/cellSize),previous=cells.get(key);
        if(!previous||point.z<previous.z)cells.set(key,point.clone());
    }
    forEachReferenceVertex(mesh,includePoint);
}

// 지형 조회의 유효 높이를 판정하며 실제 0m·음수 고도와 자료 없음 표식을 구분합니다.
function isReferenceTerrainHeight(height){
    return Number.isFinite(height)&&height!==Number.MAX_VALUE&&height!==Math.fround(.00002922);
}

// 현재 표시 중인 지형에서 하단 표본 위치의 DEM 높이를 일괄 조회합니다.
async function readReferenceTerrainHeights(app,points){
    // 공개 DEM 조회가 가능하며 표시 중인 지형을 선택합니다.
    function isTerrain(terrain){return terrain.getVisible()&&typeof terrain.getHeightAtPoints==='function';}
    const candidates=app.getHeightLayers().filter(isTerrain);
    if(!candidates.length)throw new Error('시설 높이를 맞출 지형 레이어가 없습니다.');
    const terrain=candidates[candidates.length-1];
    await terrain.ready;
    // 높이 조회에 필요한 평면 좌표만 복사합니다.
    function copyPoint(point){return {x:point.x,y:point.y};}
    const samples=await terrain.getHeightAtPoints(points.map(copyPoint),15,false),scale=terrain.getHeightScale?.()??1;
    // 입력과 같은 순서로 유효 DEM 높이를 복원하며 요청 실패·자료 없음은 NaN으로 남깁니다.
    function readHeight(point,index){
        const sample=samples[index],height=sample?.z;
        return sample&&!sample.errorMsg&&sample.x===point.x&&sample.y===point.y&&isReferenceTerrainHeight(height)?height*scale:NaN;
    }
    return points.map(readHeight);
}

// 시설 그룹의 변경된 로컬 위치를 하위 렌더 월드 행렬까지 명시적으로 전파합니다.
function updateReferenceWorldMatrices(group){
    group.parent?.updateWorldMatrix(true,false);
    group.updateMatrix();
    const pending=[group];
    while(pending.length){
        const node=pending.pop();
        if(node.matrixAutoUpdate)node.updateMatrix();
        if(node.parent)node.matrixWorld.multiplyMatrices(node.parent.matrixWorld,node.matrix);
        else node.matrixWorld.copy(node.matrix);
        node.matrixWorldNeedsUpdate=false;
        for(const child of node.children)pending.push(child);
    }
}

// 레이어 목록의 표시 토글과 이동 전 표시를 연결하며 메쉬 캐시는 유지합니다.
function connectLayerVisibility(root,app,manager,layers){
    let disposed=false;
    // 현재 세션의 태장교 또는 등록된 시설 레이어를 읽습니다.
    function getLayer(key){return key==='bridge-taejang'?manager.session?.layer:layers.get(key);}
    // 표시 요청을 버튼 이름과 접근성 상태에 반영하고 시설은 보정 완료 조건을 추가로 확인합니다.
    function synchronize(){
        if(disposed)return;
        for(const button of root.querySelectorAll('[data-layer-visibility]')){
            const layer=getLayer(button.dataset.layerVisibility),visible=Boolean(layer?.getVisible());
            const synchronizePresentation=referenceLayerPresentation.get(layer);
            if(synchronizePresentation)synchronizePresentation();
            else if(layer?.getGroup())layer.getGroup().visible=visible;
            const action=visible?'숨기기':'보이기',label=button.dataset.layerLabel+' '+action;
            button.disabled=!layer||layer.isDisposed();
            button.textContent=action;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(visible));
        }
    }
    // 표시 토글은 해당 레이어만 전환하고 이동 요청은 대상 레이어를 먼저 켭니다.
    function handleClick(event){
        const button=event.target.closest?.('.bim-layer-item button');
        if(!button||!root.contains(button))return;
        const key=button.dataset.layerVisibility??button.dataset.referenceLayer??(button.dataset.sequenceAction==='fit'?'bridge-taejang':null);
        const layer=getLayer(key);if(!layer||layer.isDisposed())return;
        const visible=button.hasAttribute('data-layer-visibility')?!layer.getVisible():true;
        layer.setVisible(visible);synchronize();app.forceUpdate();
        if(!button.hasAttribute('data-layer-visibility')&&key==='bridge-taejang'){event.stopPropagation();void moveBridge(layer).catch(reportMoveError);}
    }
    // 태장교 목록 이동을 실제 그리기 범위에 맞춥니다.
    async function moveBridge(layer){
        await layer.ready;
        if(disposed||manager.session?.layer!==layer||!layer.getVisible())return;
        const box=readReferenceMeshBounds(layer);
        if(box.isEmpty())box.copy(layer.getBoundingBox()).applyMatrix4(layer.getGroup().matrixWorld);
        const size=box.getSize(box.min.clone()),center=box.getCenter(box.min.clone()),scale=GeOnDT.UMathEngine.getRealScaleAtGoogle(center);
        await app.fitExtentToBoundingBox(box,true,Math.max(size.length()*.2,40/scale),0,55);
    }
    // 태장교 이동 실패 원인을 개발 콘솔에 보존합니다.
    function reportMoveError(error){console.error('태장교 목록 이동 오류:',error);}
    const unsubscribe=manager.subscribe(synchronize);
    root.addEventListener('click',handleClick,true);synchronize();
    // 메타데이터 준비 후 표시 상태를 갱신하며 정리된 DOM은 건드리지 않습니다.
    function refreshReady(){synchronize();}
    for(const layer of layers.values())void layer.ready.then(refreshReady,refreshReady);
    // 자체 수신과 세션 구독을 해제하며 앱·레이어 표시 상태의 소유권은 유지합니다.
    function disposeVisibility(){disposed=true;root.removeEventListener('click',handleClick,true);unsubscribe();}
    return disposeVisibility;
}

// 유효한 높이 표본의 중앙값을 사본에서 계산해 극단값의 영향을 줄입니다.
function referenceMedian(values){
    // 높이 표본을 오름차순 비교합니다.
    function compare(left,right){return left-right;}
    const sorted=[...values].sort(compare),middle=Math.floor(sorted.length/2);
    return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}


// 긴 비탈면의 목록 이동 범위를 최대 약 300m로 제한합니다.
function readSlopeNavigationBounds(layer,bounds){
    const center=bounds.getCenter(bounds.min.clone()),size=bounds.getSize(bounds.min.clone());
    const scale=GeOnDT.UMathEngine.getRealScaleAtGoogle(center);
    if(!Number.isFinite(scale)||scale<=0)throw new Error('비탈면 이동 좌표의 미터 배율이 유효하지 않습니다.');
    if(Math.max(size.x,size.y)*scale<=300)return bounds;
    let anchor=center,distance=Infinity;
    for(const point of collectReferenceFootpoints(layer)){
        const candidate=(point.x-center.x)**2+(point.y-center.y)**2;
        if(candidate<distance){anchor=point;distance=candidate;}
    }
    const radius=150/scale,height=20/scale,focus=bounds.clone();
    focus.min.set(anchor.x-radius,anchor.y-radius,anchor.z-height);
    focus.max.set(anchor.x+radius,anchor.y+radius,anchor.z+height);
    return focus;
}

// 최상위 표시 대기와 관계없이 자식의 가시성을 유지한 실제 drawRange·인덱스 정점만 합쳐 월드 경계를 구합니다.
function readReferenceMeshBounds(layer){
    const group=layer.getGroup(),box=layer.getBoundingBox().clone().makeEmpty();
    updateReferenceWorldMatrices(group);
    // 실제 표시 정점을 경계에 합칩니다.
    function includePoint(point){box.expandByPoint(point);}
    // 메쉬 노드의 실제 그리기 정점만 읽습니다.
    function includeMesh(mesh){forEachReferenceVertex(mesh,includePoint);}
    for(const child of group.children)child.traverseVisible(includeMesh);
    return box;
}

// 메쉬의 유효한 인덱스·drawRange만 순회하고 같은 임시 월드 좌표를 재사용해 전달합니다.
function forEachReferenceVertex(mesh,visit){
    const geometry=mesh.geometry,positions=geometry?.getAttribute('position');
    if(!mesh.isMesh||!positions)return;
    const total=geometry.index?.count??positions.count,start=Math.max(0,geometry.drawRange.start);
    const stop=Math.min(total,start+geometry.drawRange.count),point=mesh.position.clone();
    for(let cursor=start;cursor<stop;cursor++){
        const index=geometry.index?geometry.index.getX(cursor):cursor;
        point.fromBufferAttribute(positions,index).applyMatrix4(mesh.matrixWorld);
        if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(point.z))throw new Error('시설 메쉬 정점 좌표가 유효하지 않습니다.');
        visit(point);
    }
}
