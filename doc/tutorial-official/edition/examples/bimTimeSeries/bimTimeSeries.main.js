

let nextLayerId=0;
/**
 * 교량 전용 세션을 준비하고 UI에서 호출할 상태를 반환합니다. <br>
 * GeOnDT
 *
 * @param {ExampleContext} context 공통 런타임이 소유하는 앱·자산 해석 API
 * @returns {Promise<object>} UI cleanup 이후 dispose할 Manager와 초기 설정
 */
export async function initialize(context){
    // Editor의 Blob 모듈에서도 같은 웹 루트 모듈을 읽도록 HTTP 자산 URL을 기준으로 해석합니다.
    const moduleUrl=new URL("/extension/sequence/sequence.js",context.runtime.resolveAsset("assets/bridge.source.json")).href;
    const {USequenceSessionManager,USequenceSourceVo}=await import(moduleUrl);
    const sourceUrl=context.runtime.resolveAsset('assets/bridge.source.json'),response=await fetch(sourceUrl);
    if(!response.ok)throw new Error('교량 연결 설정을 읽지 못했습니다: '+response.status);
    const raw=await response.json(),initialSource=new USequenceSourceVo(raw);
    initialSource.baseUrl=new URL('/',sourceUrl).href;
    initialSource.sequenceUri=context.runtime.resolveAsset('assets/bridge.sequence.json');
    context.app.setMethodHeight('1_0');
    const manager=new USequenceSessionManager({app:context.app,mathEngine:GeOnDT.UMathEngine,
        createLayer:
        /**
         * 아직 앱에 부착하지 않은 교량 레이어를 생성합니다.
         *
         * @param {import('../../../extension/sequence/vo/sequenceDefinitionVos.js').USequenceContentVo} content 복사된 절대 형상 URI. <br>
         * 소유권은 Manager에 전달
         * @returns {U3dModelTilesLayer} 기본 그룹화에 의존하지 않는 전용 타일 레이어
         */
        content=>{
            const calibratedUri=new URL('https://3d-dev.geon.kr/data/bim/sample/28.2-4_교량공_태장교_통합 BIM(As-Built BIM)_R24 (초안)/tileset.json').href;
            const matchesBridgeSource=content.id==='bridge-taejang'&&content.uri===calibratedUri
                &&content.revision==='sha256:f90396040000e5ca5f249703a89f341a930efa47eec2c95eadfbe4e5c30e6f38';
            const layer=new GeOnDT.model.U3dModelTilesLayer({
                name:'sequence-bridge-'+(++nextLayerId),baseUrl:content.uri,visible:true,useProxy:false,
                autoHeight:false,heightOffset:matchesBridgeSource?-98.86:0,
                setLevelGroup:false,maximumScreenSpaceError:16,viewSizeOffset:10
            });
            if(typeof layer.setContentOffsetBounds!=='function'||typeof layer.getContentOffsetBounds!=='function'){
                layer.dispose();throw new Error('현재 GeOnDT 빌드에 시퀀스 이동 경계 API가 없습니다.');
            }
            return layer;
        },
        createSelector:
        /**
         * 전용 점 선택기를 생성하며 아직 앱에 부착하지 않습니다.
         *
         * @returns {U3dSelect} Manager가 등록·해제할 전용 선택기
         */
        ()=>new GeOnDT.select.U3dSelect({mode:'point',exceptTexture:false,selectType:GeOnDT.select.U3dSelect.TYPE.OUTLINE,hover:{enabled:false}}),
        onError:
        /**
         * 실제 실행 오류를 콘솔에 원래 예외로 보고합니다.
         *
         * @param {Error} error 타일·선택·재생 연결에서 전달된 원래 오류
         */
        error=>console.error('교량 시퀀스 실행 오류',error)});
    let referenceLayer=null,usanLayer=null,slopeLayer=null,noiseBarrierLayer=null,noiseBarrier9km400Layer=null;
    try{
        referenceLayer=new GeOnDT.model.U3dModelTilesLayer({
            name:'reference-hojeo2-'+(++nextLayerId),
            baseUrl:new URL("https://3d-dev.geon.kr/data/bim/sample/19.2-4_구교_C(함)호저제2 1.5X1(서원기(현) 9km 045.17_)_통합 BIM(As-Built BIM)_R24 (초안)/tileset.json").href,
            visible:false,useProxy:false,autoHeight:false,setLevelGroup:false,
            maximumScreenSpaceError:16,viewSizeOffset:10
        });
        // 별도 레이어의 비동기 연결 실패를 관찰합니다.
        function reportReferenceError(error){console.warn('호저제2 구교 레이어 연결 오류',error);}
        void referenceLayer.ready.catch(reportReferenceError);
        context.app.addLayer(referenceLayer);
        usanLayer=new GeOnDT.model.U3dModelTilesLayer({
            name:'reference-usan1-'+(++nextLayerId),
            baseUrl:new URL("https://3d-dev.geon.kr/data/bim/sample/27.2-4_구교_B(함)우산제1 5.0X1(서원기(현) 9km527.06)_통합 BIM(As-Built BIM)_R24 (초안)/tileset.json").href,
            visible:false,useProxy:false,autoHeight:false,setLevelGroup:false,
            maximumScreenSpaceError:16,viewSizeOffset:10
        });
        // 우산제1 구교의 연결 실패를 관찰하며 상세 상태는 해당 목록 행에서 표시합니다.
        function reportUsanError(error){console.warn('우산제1 구교 레이어 연결 오류',error);}
        void usanLayer.ready.catch(reportUsanError);
        context.app.addLayer(usanLayer);
        slopeLayer=new GeOnDT.model.U3dModelTilesLayer({
            name:'reference-slope-'+(++nextLayerId),
            baseUrl:new URL("https://3d-dev.geon.kr/data/bim/sample/33.2-4_토공_비탈면_통합 BIM(As-Built BIM)_R24 (초안)/tileset.json").href,
            visible:false,useProxy:false,autoHeight:false,setLevelGroup:false,
            maximumScreenSpaceError:16,viewSizeOffset:10
        });
        // 토공 비탈면의 연결 실패를 관찰하며 상세 상태는 해당 목록 행에서 표시합니다.
        function reportSlopeError(error){console.warn('토공 비탈면 레이어 연결 오류',error);}
        void slopeLayer.ready.catch(reportSlopeError);
        context.app.addLayer(slopeLayer);
        noiseBarrierLayer=new GeOnDT.model.U3dModelTilesLayer({
            name:'reference-noise-barrier-'+(++nextLayerId),
            baseUrl:new URL("https://3d-dev.geon.kr/data/bim/sample/15.2-4_방음벽공_방음벽_10km120_통합 BIM(As-Built BIM)_R24 (초안)/tileset.json").href,
            visible:false,useProxy:false,autoHeight:false,setLevelGroup:false,
            maximumScreenSpaceError:16,viewSizeOffset:10
        });
        // 방음벽 10km120의 연결 실패를 관찰하며 상세 상태는 해당 목록 행에서 표시합니다.
        function reportNoiseBarrierError(error){console.warn('방음벽 10km120 레이어 연결 오류',error);}
        void noiseBarrierLayer.ready.catch(reportNoiseBarrierError);
        context.app.addLayer(noiseBarrierLayer);
        noiseBarrier9km400Layer=new GeOnDT.model.U3dModelTilesLayer({
            name:'reference-noise-barrier-9km400-'+(++nextLayerId),
            baseUrl:new URL("https://3d-dev.geon.kr/data/bim/sample/18.2-4_방음벽공_방음벽_9km400_통합 BIM(As-Built BIM)_R24 (초안)/tileset.json").href,
            visible:false,useProxy:false,autoHeight:false,setLevelGroup:false,
            maximumScreenSpaceError:16,viewSizeOffset:10
        });
        // 방음벽 9km400의 연결 실패를 관찰하며 상세 상태는 해당 목록 행에서 표시합니다.
        function reportNoiseBarrier9km400Error(error){console.warn('방음벽 9km400 레이어 연결 오류',error);}
        void noiseBarrier9km400Layer.ready.catch(reportNoiseBarrier9km400Error);
        context.app.addLayer(noiseBarrier9km400Layer);
        return {manager,initialSource,referenceLayer,usanLayer,slopeLayer,noiseBarrierLayer,noiseBarrier9km400Layer};
    }catch(error){
        try{dispose(context,{manager,referenceLayer,usanLayer,slopeLayer,noiseBarrierLayer,noiseBarrier9km400Layer});}
        catch(cleanupError){throw new AggregateError([error,cleanupError],'추가 레이어 생성·정리에 실패했습니다.');}
        throw error;
    }
}
/**
 * 예제에서 생성한 세션과 전용 레이어만 정리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 소유 문맥이며 변경하지 않음
 * @param {object} example initialize의 결과. <br>
 * 초기화 실패 시 undefined 가능
 */
export function dispose(context,example){
    if(!example)return;
    const failures=[];
    try{example.manager?.dispose();}catch(error){failures.push(error);}
    for(const layer of [example.referenceLayer,example.usanLayer,example.slopeLayer,example.noiseBarrierLayer,example.noiseBarrier9km400Layer]){
        if(!layer)continue;
        try{
            context.app.removeLayer(layer);
            if(!layer.isDisposed())layer.dispose();
        }catch(error){failures.push(error);}
    }
    if(failures.length)throw new AggregateError(failures,'교량 예제 자원 정리에 실패했습니다.');
}
