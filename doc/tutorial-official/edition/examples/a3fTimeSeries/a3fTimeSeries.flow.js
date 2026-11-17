//@ts-check
import {readA3FPaletteColors, createA3FPaletteGradient, runA3FWithLoading, syncA3FPaletteSelect} from './a3fTimeSeries.ui.js';
const Color = /** @type {typeof import('three').Color} */ (Reflect.get(Reflect.get(window, 'GeOnDT'), 'THREE').Color);
/**
 * 전체 가시 노드에 합산할 예제 초기 입자 상한입니다.
 */
const DEFAULT_PARTICLE_COUNT = 10000;
/**
 * 공개 세션의 명시 벡터를 사용하고, 기존 홍수 샘플에 한해 확인된 방향 정의를 예제 설정으로 전달합니다. <br>
 * 범용 모듈에 데이터셋 이름 추정을 추가하지 않습니다.
 *
 * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession} session 연결 완료한 빌린 세션, 벡터·자료 요약 사본만 조회
 * @returns {Array<UA3FVectorFieldVoCO | import('../../../extension/a3fTimeSeries/backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo>} 선택 후보
 */
export function readA3FVectorFields(session) {
    const defined = session.getVectorFields(); if (defined.length) return defined;
    if (session.getDatasetInfo()?.datasetId !== 'etri-flood-nc-6-2') return [];
    return [{vectorId: 'velocity', label: '유속 (+E / +N)', uFieldId: 'u', uComponent: 0, vFieldId: 'v', vComponent: 0, speedFieldId: 'vmag', maskFieldId: 'h', basisType: 'source-grid', basisCrs: 'EPSG:5187', componentSemantics: 'physical', velocityUnit: 'm/s'}];
}

/**
 * 입자 기본 상수로 현재 프레임 유속 흐름의 설정·재생 UI, 오른쪽 유속 범례와 자체 수명 정리를 연결합니다.
 *
 * @param {HTMLElement} container 빌린 가시화 설정 내용 DOM
 * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession} session 현재 예제 소유 공급자, 해제하지 않음
 * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FDatasetInfoVo} metadata 현재 읽은 문서, 변경 없음
 * @param {null | function(number):Promise<void>} [seekFrame] 원본 프레임 번호가 아닌 0 기반 목록 위치를 전달하며, 예제 버튼을 누를 때만 호출, 원본 프레임 번호가 아닌 0 기반 목록 위치를 전달하며 예제 버튼에서만 호출
 * @returns {(function():void) & { ready: Promise<void>; }} 이 화면의 DOM·구독·리스너 해제와 최초 유속 적용 완료, 빌린 세션은 유지
 */
export function mountA3FFlowControls(container,session,metadata,seekFrame=null){
const vectors=readA3FVectorFields(session),panel=document.createElement('section');panel.className='a3f-flow-controls';panel.id='a3f-flow-settings';panel.setAttribute('aria-label','흐름 설정');
panel.innerHTML=`<fieldset>
    <div class="a3f-settings-fields">
        <div class="a3f-flow-field"><span id="a3f-flow-mode-label">표현 방식</span>
            <div class="a3f-flow-modes" role="group" aria-labelledby="a3f-flow-mode-label">
                <button type="button" data-flow-mode="off" aria-pressed="false">끄기</button>
                <button type="button" data-flow-mode="flow" aria-pressed="false">입자</button>
                <button type="button" data-flow-mode="arrows" aria-pressed="false">화살표</button>
            </div>
            <select id="a3f-flow-mode" aria-label="벡터 표현" hidden><option value="off">끄기</option><option value="flow">물 입자 흐름</option><option value="arrows">방향 화살표</option></select>
        </div>
        <label class="a3f-flow-field">벡터 종류<select id="a3f-flow-vector"></select></label>
        <div data-flow-particles>
            <button id="a3f-flow-more" class="a3f-settings-more" type="button" popovertarget="a3f-flow-extra" hidden>입자 수·속도·색상 설정 ↗</button>
            <div id="a3f-flow-extra" class="a3f-settings-extra" data-settings-overflow data-settings-trigger="a3f-flow-more">
                <div class="a3f-popover-heading"><strong>입자 설정</strong><button type="button" popovertarget="a3f-flow-extra" popovertargetaction="hide" aria-label="입자 설정 닫기">×</button></div>
                <div class="a3f-settings-grid">
                    <label>전체 입자 상한<input id="a3f-particle-count" type="number" min="256" max="16384"></label>
                    <label>표시 배율 · 배<input id="a3f-flow-speed" type="number" min="0.1" max="1000" step="any" value="100"></label>
                    <label>표시 시간 · 초<input id="a3f-flow-life" type="number" min="0.1" max="30" step="0.1" value="4"></label>
                    <label for="a3f-flow-color">입자 색상<input id="a3f-flow-color" type="color" value="#159fe8"><output id="a3f-flow-color-value" for="a3f-flow-color">#159FE8</output></label>
                </div>
                <p class="a3f-muted">표시 배율은 시각화 속도만 조절합니다.</p>
            </div>
            <p id="a3f-flow-detail-summary" class="a3f-muted"></p>
        </div>
        <div class="a3f-settings-grid" data-flow-arrows>
            <label>간격 · px<input id="a3f-flow-spacing" type="number" min="16" max="512" value="40"></label>
            <label>최대 개수<input id="a3f-flow-count" type="number" min="1" max="20000" value="6000"></label>
        </div>
    </div>
    <div class="a3f-settings-footer">
        <div class="a3f-flow-actions"><button id="a3f-flow-apply" type="button" class="a3f-primary">적용</button><button id="a3f-flow-toggle" type="button" class="a3f-secondary">Ⅱ 일시정지</button></div>
        <p id="a3f-flow-status" class="a3f-muted" role="status"></p>
        <button id="a3f-flow-example" type="button" class="a3f-flow-example">흐름 예제 보기 · 100프레임 ↗</button>
        <p id="a3f-flow-detail-status" hidden></p>
    </div>
</fieldset>`;
const host=container.querySelector('#a3f-flow-tab-panel'),placeholder=container.querySelector('#a3f-flow-placeholder');
if(!(host instanceof HTMLElement))throw new Error('흐름 설정 탭이 필요합니다.');
host.append(panel);if(placeholder instanceof HTMLElement)placeholder.hidden=true;
const mode=/** @type {HTMLSelectElement} */(panel.querySelector('#a3f-flow-mode')),choice=/** @type {HTMLSelectElement} */(panel.querySelector('#a3f-flow-vector'));
const spacing=/** @type {HTMLInputElement} */(panel.querySelector('#a3f-flow-spacing')),count=/** @type {HTMLInputElement} */(panel.querySelector('#a3f-flow-count')),particleCount=/** @type {HTMLInputElement} */(panel.querySelector('#a3f-particle-count')),speed=/** @type {HTMLInputElement} */(panel.querySelector('#a3f-flow-speed')),life=/** @type {HTMLInputElement} */(panel.querySelector('#a3f-flow-life'));
particleCount.defaultValue=String(DEFAULT_PARTICLE_COUNT);
const waterColor=/** @type {HTMLInputElement} */(panel.querySelector('#a3f-flow-color'));
const detailSummary=/** @type {HTMLElement} */(panel.querySelector('#a3f-flow-detail-summary')),detailStatus=/** @type {HTMLElement} */(panel.querySelector('#a3f-flow-detail-status')),colorValue=/** @type {HTMLOutputElement} */(panel.querySelector('#a3f-flow-color-value'));
const button=/** @type {HTMLButtonElement} */(panel.querySelector('#a3f-flow-apply')),toggle=/** @type {HTMLButtonElement} */(panel.querySelector('#a3f-flow-toggle')),example=/** @type {HTMLButtonElement} */(panel.querySelector('#a3f-flow-example')),fieldset=/** @type {HTMLFieldSetElement} */(panel.querySelector('fieldset')),status=/** @type {HTMLElement} */(panel.querySelector('#a3f-flow-status'));
let disposed=false,operation=0,running=true,appliedMode='off',colorInfo='';
const legendMode=/** @type {HTMLElement} */(document.getElementById('a3f-speed-legend-mode')),legendUnit=/** @type {HTMLElement} */(document.getElementById('a3f-speed-legend-unit')),legendRamp=/** @type {HTMLElement} */(document.getElementById('a3f-speed-legend-ramp')),legendTicks=/** @type {HTMLElement} */(document.getElementById('a3f-speed-legend-ticks')),legendNote=/** @type {HTMLElement} */(document.getElementById('a3f-speed-legend-note'));
const legendPalette=/** @type {HTMLSelectElement} */(document.getElementById('a3f-speed-palette'));
legendPalette.disabled=vectors.length===0;
let appliedPaletteId='default';
let palettePending=false,legendStamp='';
/** @type {import('../../../extension/a3fTimeSeries/backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo | null} */
let appliedFlowOptions=null;
/** @type {import('../../../extension/a3fTimeSeries/backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo | null} */
let appliedFlowVector=null;
legendMode.textContent='유속 표시 준비 중';legendRamp.hidden=true;legendTicks.hidden=true;legendNote.textContent='실제로 적용된 유속 색상과 범위를 표시합니다.';
for(let i=0;i<vectors.length;i++)choice.add(new Option(vectors[i].label,String(i)));
mode.value=vectors.length?'flow':'off';example.hidden=metadata.datasetId!=='etri-flood-nc-6-2'||!seekFrame;
if(!vectors.length){fieldset.disabled=true;status.textContent='벡터 필드와 방향 기준 메타정보가 필요합니다.';legendMode.textContent='유속 자료 없음';legendNote.textContent=status.textContent;}
/**
 * 공개 흐름 부분 설정으로 팔레트만 변경하는 동안 로딩을 표시하고 실제 적용된 색상으로 콤보를 동기화합니다. <br>
 * 외부 사용자 팔레트는 보존합니다.
 *
 * @param {string} paletteId 선택 ID
 */
async function setPalette(paletteId) {
    const palette=paletteId==='custom'?session.getState().flowConfigurationVo?.palette??null:readA3FPaletteColors(paletteId);
    await runA3FWithLoading(session.configureFlow.bind(session, {palette}));
    if (!disposed) { appliedPaletteId=syncA3FPaletteSelect(legendPalette,session.getState().flowConfigurationVo?.palette??null);legendStamp=''; }
}

 // 흐름 팔레트를 즉시 적용하고 성공·실패 후 실제 적용 정책으로 선택과 범례를 동기화합니다.
 async function onPaletteChange() {
    if (disposed || fieldset.disabled || palettePending) return; legendPalette.disabled = true;palettePending=true;
    try { await setPalette(legendPalette.value); if (disposed) return; legendNote.dataset.error = 'false'; updateControls(); if (appliedFlowOptions && appliedFlowVector) updateSpeedLegend(appliedFlowOptions, appliedFlowVector); }
    catch (error) { if (!disposed) { legendPalette.value = appliedPaletteId; legendNote.dataset.error = 'true'; legendNote.textContent = error instanceof Error ? error.message : String(error); } }
    finally { palettePending=false;if (!disposed) { appliedPaletteId=syncA3FPaletteSelect(legendPalette,session.getState().flowConfigurationVo?.palette??null);legendPalette.disabled=vectors.length===0;updateStatus(); } }
 }

/**
 * 성공한 유속 설정의 범위와 실제 적용된 색상 조합을 오른쪽 범례에 표시합니다. <br>
 * 미적용 입력은 반영하지 않습니다.
 *
 * @param {import('../../../extension/a3fTimeSeries/backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo} options 적용 완료한 빌린 옵션, 색상·모드·전체 범위를 읽으며 변경 없음
 * @param {import('../../../extension/a3fTimeSeries/backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo} vector 적용 완료한 빌린 벡터 정의, 속도 단위만 읽으며 변경 없음
 */
function updateSpeedLegend(options,vector){
    const range=options.speedColorRange,active=options.mode!=='off',scaled=active&&range!==null,snapshot=session.getState();
    const colors=snapshot.flowConfigurationVo?.palette??null,empty=active&&snapshot.flowStatusVo.selectedCount===0;
    const stamp=JSON.stringify([options.mode,options.color,range,colors,vector.velocityUnit,empty]);if(stamp===legendStamp)return;legendStamp=stamp;legendNote.dataset.error='false';
    legendMode.textContent=options.mode==='arrows'?'방향 화살표':options.mode==='flow'?'물 입자 흐름':'유속 표시 꺼짐';legendUnit.textContent=vector.velocityUnit;
    legendRamp.hidden=!active;legendTicks.hidden=!scaled;legendTicks.replaceChildren();
    if(!active){legendNote.textContent='가시화의 유속 탭에서 입자 또는 화살표를 적용하세요.';return;}
    const base=new Color(options.color),stops=[];
    for(let i=0;i<=4;i++){
        const t=i/4,color=scaled?(options.mode==='arrows'?[t,.35-.1*t,1-t]:[particleColor(base.r,t),particleColor(base.g,t),particleColor(base.b,t)]):[base.r,base.g,base.b];
        stops.push('rgb('+color[0]*255+' '+color[1]*255+' '+color[2]*255+') '+t*100+'%');
        if(!scaled||!range)continue;
        const tick=document.createElement('span');tick.textContent=(range[0]+(range[1]-range[0])*t).toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2});legendTicks.append(tick);
    }
    legendRamp.style.background=colors===null?'linear-gradient(90deg, '+stops.join(', ')+')':scaled?createA3FPaletteGradient(colors):colors[0];
    legendNote.textContent=scaled?(colors===null?'현재 프레임의 유속 · 전체 시간의 고정 범위. '+(options.mode==='arrows'?'파랑은 느림, 빨강은 빠름.':'밝을수록 빠름. 광택·꼬리의 밝기는 달라집니다.'):'현재 프레임의 유속 · 전체 시간의 고정 범위. 낮은 값에서 높은 값 순서입니다.'):colors===null?'전체 유속 통계가 없어 고정 색상을 사용합니다.':'전체 유속 통계가 없어 선택한 조합의 첫 색상을 사용합니다.';
    if(empty)legendNote.textContent='현재 화면·프레임에 표시할 유속이 없습니다. 시간을 이동하거나 유속 설정을 확인하세요. '+legendNote.textContent;
}
/**
 * 입자 셰이더가 사용하는 선형 색상 성분의 기본 명암을 계산합니다.
 *
 * @param {number} component 선택 색상의 선형 RGB 성분, 0~1, 변경 없음
 * @param {number} fraction 전체 속력 범위의 정규화 위치, 0~1, 변경 없음
 * @returns {number} RawShaderMaterial 출력과 같은 변환 전 RGB 성분, 광택·꼬리 효과 제외
 */
function particleColor(component,fraction){return component*.65*(1-fraction)+(component*.75+.25)*fraction;}
/**
 * 선택한 표현 버튼과 해당 입력만 표시하며 끄기에서는 세부 입력을 접습니다. <br>
 * 별도 팔레트 사용 중에는 입자 색상 입력을 비활성화합니다.
 */
function updateControls(){
    const flow=mode.value==='flow';
    const extra=/** @type {HTMLElement} */(panel.querySelector('#a3f-flow-extra'));
    if(!flow&&extra.matches(':popover-open'))extra.hidePopover();
    /** @type {HTMLElement} */(panel.querySelector('[data-flow-particles]')).hidden=!flow;
    /** @type {HTMLElement} */(panel.querySelector('[data-flow-arrows]')).hidden=mode.value!=='arrows';
    for(const item of panel.querySelectorAll('button[data-flow-mode]'))item.setAttribute('aria-pressed',String(item.getAttribute('data-flow-mode')===mode.value));
    toggle.hidden=!flow;waterColor.disabled=appliedPaletteId!=='default';waterColor.title=waterColor.disabled?'유속 범례에서 기본 색상을 선택하면 사용할 수 있습니다.':'';
    updateInputSummary();
}
/**
 * 입력 중인 입자 수·표시 시간·색상을 요약합니다. <br>
 * 설정 적용은 실행하지 않습니다.
 */
function updateInputSummary(){
    const number=particleCount.valueAsNumber;
    detailSummary.textContent='입자 '+(Number.isFinite(number)?number.toLocaleString('ko-KR'):'—')+'개 · 표시 시간 '+(life.value||'—')+'초';
    colorValue.value=waterColor.value.toUpperCase();
}
/**
 * 표현 버튼의 선택을 기존 모드 입력에 반영합니다. <br>
 * 적용 버튼을 누르기 전에는 유속 공급자를 변경하지 않습니다.
 *
 * @param {MouseEvent} event 흐름 설정 클릭 이벤트, 세션 소유 DOM 안의 모드 버튼만 처리
 */
function onModeClick(event){
    const item=event.target instanceof Element?event.target.closest('button[data-flow-mode]'):null;
    if(!(item instanceof HTMLButtonElement)||fieldset.disabled)return;
    mode.value=item.dataset.flowMode??'off';updateControls();
}
/**
 * 입력값의 요약만 갱신하고 유속 적용은 적용 버튼에 맡깁니다.
 */
function onInput(){updateInputSummary();}
 // 벡터·흐름·입자·팔레트·독립 실행 선택을 로딩 표시와 함께 공개 세션에 적용합니다.
 async function apply() {
    const vector = vectors[Number(choice.value)]; if (!vector || disposed || fieldset.disabled) return;
    const current = ++operation; fieldset.disabled = true; legendPalette.disabled = true; status.dataset.error = 'false'; status.textContent = '유속장 준비 중…';
    try {
        await runA3FWithLoading(session.configureFlow.bind(session, {vectorFieldVo: vector,
            flowOptionsVo: {mode: mode.value === 'flow' ? 'flow' : mode.value === 'arrows' ? 'arrows' : 'off', spacingPixels: spacing.valueAsNumber, maxArrowCount: count.valueAsNumber, color: mode.value === 'flow' ? waterColor.value : '#ffffff', speedColorRange: readSpeedRange(session, vector)},
            particleOptionsVo: {particleCount: particleCount.valueAsNumber, visualSpeedScale: speed.valueAsNumber, lifeSeconds: life.valueAsNumber, animateWhenPaused: true},
            palette: legendPalette.value==='custom'?session.getState().flowConfigurationVo?.palette??null:readA3FPaletteColors(legendPalette.value), running}));
        if (disposed || current !== operation) return;
        const applied = session.getState().flowConfigurationVo; if (!applied?.vectorFieldVo) throw new Error('적용한 벡터 설정이 없습니다.');
        appliedFlowOptions = applied.flowOptionsVo; appliedFlowVector = applied.vectorFieldVo; appliedPaletteId=syncA3FPaletteSelect(legendPalette,applied.palette);legendStamp='';
        appliedMode = applied.flowOptionsVo.mode; colorInfo = applied.flowOptionsVo.speedColorRange ? '전체 시간의 고정 속력 범위' : '고정 색상';
        updateSpeedLegend(appliedFlowOptions, appliedFlowVector);
    } catch (error) { if (!disposed && current === operation) { status.dataset.error = 'true'; status.textContent = error instanceof Error ? error.message : String(error); } }
    finally { if (!disposed && current === operation) { fieldset.disabled = false; legendPalette.disabled = vectors.length === 0; updateStatus(); } }
 }

 // 공개 흐름 상태의 실제 모드·팔레트·범위로 범례와 선택을 동기화하고 입자·화살표·예산을 표시합니다.
 function updateStatus() {
    if (disposed || fieldset.disabled) return;
    const snapshot = session.getState(), state = snapshot.flowStatusVo, applied = snapshot.flowConfigurationVo;
    if(applied?.vectorFieldVo){appliedFlowOptions=applied.flowOptionsVo;appliedFlowVector=applied.vectorFieldVo;appliedMode=applied.flowOptionsVo.mode;running=applied.running;if(!palettePending)appliedPaletteId=syncA3FPaletteSelect(legendPalette,applied.palette);updateSpeedLegend(appliedFlowOptions,appliedFlowVector);}
    if (state.error) { status.dataset.error = 'true'; status.textContent = state.error; return; }
    status.dataset.error='false';
    if (appliedMode === 'off') { status.textContent = '유속 표시 꺼짐'; return; }
    if (appliedMode === 'arrows') { status.textContent = '방향 화살표 · ' + state.selectedCount + '개'; status.title = colorInfo; return; }
    const detail = state.allocatedParticles ? '입자 상한 ' + state.allocatedParticles + '개 · 실제 간격 ' + (state.actualCellMeters?.toFixed(1) ?? '미준비') + 'm · 파생 자료 ' + (state.derivedBytes / 1048576).toFixed(1) + 'MiB' : '현재 표시할 유속이 없습니다. 시간을 이동하거나 벡터 설정을 확인하세요.';
    detailStatus.textContent = colorInfo + ' · ' + detail;
    status.textContent = (applied?.running ? '물 입자 흐름 재생 중' : '물 입자 흐름 일시정지') + ' · ' + (applied?.particleOptionsVo.visualSpeedScale ?? 1) + '×' + (state.timeLimited ? ' · 이동 한도 적용' : '');
    status.title = detailStatus.textContent;
 }

/**
 * 현재 유속 표시 설정을 적용합니다.
 */
function onApply(){void apply();}
 // 공개 흐름 부분 설정으로 타임라인과 독립된 실행 의도를 전환하는 동안 로딩을 표시합니다.
 async function onToggle() {
    if (disposed || fieldset.disabled) return; fieldset.disabled = true; status.dataset.error = 'false';
    try { await runA3FWithLoading(session.configureFlow.bind(session, {running: !running})); if (!disposed) { running = session.getState().flowConfigurationVo?.running ?? running; toggle.textContent = running ? 'Ⅱ 일시정지' : '▶ 재생'; } }
    catch (error) { if (!disposed) { status.dataset.error = 'true'; status.textContent = error instanceof Error ? error.message : String(error); } }
    finally { if (!disposed) { fieldset.disabled = false; updateStatus(); } }
 }

/**
 * 사용자가 선택한 예제의 0 기반 목록 위치 100으로 이동합니다.
 */
async function onExample(){if(!seekFrame||disposed)return;try{await runA3FWithLoading(seekFrame.bind(null,100));}catch(error){status.dataset.error='true';status.textContent=error instanceof Error?error.message:String(error);}}
button.addEventListener('click',onApply);toggle.addEventListener('click',onToggle);example.addEventListener('click',onExample);mode.addEventListener('change',updateControls);legendPalette.addEventListener('change',onPaletteChange);panel.addEventListener('click',onModeClick);panel.addEventListener('input',onInput);updateControls();
host.dispatchEvent(new Event('a3f-settings-layout',{bubbles:true}));
const unsubscribe = session.subscribe(updateStatus); const ready=vectors.length?apply():Promise.resolve();
/**
 * 이 화면의 DOM·구독·색상 콤보 이벤트를 정리하고 유속 범례를 연결 전 상태로 돌리며 색상 선택값은 유지합니다.
 */
function dispose(){if(disposed)return;disposed=true;operation++;unsubscribe();button.removeEventListener('click',onApply);toggle.removeEventListener('click',onToggle);example.removeEventListener('click',onExample);mode.removeEventListener('change',updateControls);legendPalette.removeEventListener('change',onPaletteChange);panel.removeEventListener('click',onModeClick);panel.removeEventListener('input',onInput);legendPalette.disabled=true;panel.remove();if(placeholder instanceof HTMLElement)placeholder.hidden=false;legendMode.textContent='자료 연결 전';legendRamp.hidden=true;legendTicks.hidden=true;legendTicks.replaceChildren();legendNote.textContent='유속 표시를 적용하면 색상과 값의 범위를 표시합니다.';}
return Object.assign(dispose,{ready});
}
/**
 * 공개 흐름 필드의 전체 통계에서 명시한 속력 성분 범위를 읽습니다. <br>
 * 원본 메타정보나 이름으로 값을 추정하지 않습니다.
 *
 * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession} session 준비된 빌린 세션, 통계 사본만 조회
 * @param {UA3FVectorFieldVoCO | import('../../../extension/a3fTimeSeries/backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo} vector 후보, 명시 속력 필드·0 기반 성분 정의
 * @returns {[ number, number ] | null} 원본 속력 범위
 */
function readSpeedRange(session, vector) {
    for (const field of session.getFlowFields()) {
        if (field.fieldId !== vector.speedFieldId) continue;
        const component = vector.speedComponent ?? 0, low = field.statistics?.minimum[component], high = field.statistics?.maximum[component];
        if (typeof low === 'number' && typeof high === 'number' && Number.isFinite(low) && Number.isFinite(high) && low < high) return [low, high];
    }
    return null;
}

