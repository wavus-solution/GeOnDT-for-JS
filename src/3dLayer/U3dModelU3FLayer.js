//@ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UMathEngine} from '@UMathEngine';
import {UFileLoader} from '@union3d/core/loader/UFileLoader';
import {U3dQueue} from '@union3d/core/U3dQueue';
import {UDEF} from '@union3d/core/UDEF';
import {UTextureLoader} from '@UTextureLoader';
import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {U3FParser} from '@union3d/core/parser/U3FParser';
import {U3FPackageParser} from '@union3d/core/parser/U3FPackageParser';
import {U3dQuadTileWork} from '@union3d/quadtree/U3dQuadTileWork';
import {USharedMesh} from '@union3d/core/mesh/USharedMesh';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {U3dMessage, __GInfo__} from '@U3dMessage';
import {UTaskProcessor} from '@union3d/core/UTaskProcessor';
import {UWorkerParameter} from '@union3d/worker/util/UWorkerParameter';
import {deferred} from '@util/deferred';
import {TileInfo, U3fPackagedInfo} from '@union3d/meta/U3fPackagedInfo';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {Yield} from '@util/Yield';
import {UCache} from '@union3d/core/UCache';
import {Box3} from 'three';
import {normalizeOptionKeys} from '@union3d/util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/3dLayer/U3dModelU3FLayer.internal';

const VALIDATION_MODE = false;
/** @type {Record<string, Array<string>>} */
const VALIDATION_TARGET = {};
const ALL_MODEL_LEVEL = 9999;
const MAX_COUNT = 3;
const LIMIT_COUNT = 40;
const V25_TEST = false;
const IS_SERIAL = false;
const CAMERA_POSITION = new THREE.Vector3();

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * U3F 모델을 타일 단위로 로드하고 표시·편집·해제하는 레이어입니다.
 *
 * @group 3dLayer
 *
 * @example
 *  let Layer = app.create3DFModelLayer({
 *      name: "chuncheon",
 *      basename: "chuncheon",
 *      baseurl: 'https://3d.geon.kr/data/model/gangwondo/chuncheon',
 *      minlevel: 17,
 *      maxlevel: 17,
 *      ext: '.u3f',
 *      useproxy: true
 *  });
 */
class U3dModelU3FLayer extends U3dModelLayer {
    /**
     * 부모 옵션과 U3F 로딩·표시 옵션의 대소문자 호환 키 목록입니다.
     *
     * @override
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS = [...U3dModelLayer.OPT_KEYS, 'baseName', 'baseUrl', 'useModelAndTexture', 'useMinMixModel', 'minusMaxLevel', 'useBaseMaterial', 'useSplitModel', 'zeroLevelHeight', 'startImageLevel', 'proxyUrl', 'useProxy', 'boundingBox', 'useBoxHelper', 'immediateUpdateImage', 'minLevel', 'maxLevel', 'wrapping', 'ext', 'compressExt', 'reverseY', 'needXml', 'makeU3FPackage', 'isShareMaterial', 'useWorker', 'isTextureUpdate', 'textureDistance', 'style', 'meshColor', 'textureLevel'];

    /**
     * 텍스처 품질 선택에 사용하는 변경 가능한 상수 모음입니다. HIGH는 high, LOW는 low입니다.
     *
     * @type {Record<string, string>}
     */
    static TEXTURE_LEVEL = {
        HIGH: 'high',
        LOW: 'low'
    }

    /**
     * 원본 레이어 정보에서 읽은 최소 타일 레벨입니다.
     *
     * @type {number}
     */
    _srcminlevel;
    /**
     * 원본 레이어 정보에서 읽은 최대 타일 레벨입니다.
     *
     * @type {number}
     */
    _srcmaxlevel;
    /**
     * 타일별 모델 작업 연결을 보관합니다.
     *
     * @type {Record<string, Array<string>>}
     */
    _u3fTiles;
    /**
     * 정리 시 보존할 타일 키 목록입니다.
     *
     * @type {Array<string>}
     */
    _keysPreserved;
    /**
     * 초기화 때 읽은 레이어 정보 참조입니다.
     *
     * @type {KeyValue | undefined}
     */
    _info;
    /**
     * 텍스처 경계의 반복 방식을 지정하는 Three.js 값입니다.
     *
     * @type {number}
     */
    _wrapping;
    /**
     * 최초 텍스처 적용 시 모델 표시도 함께 켤지 결정합니다.
     *
     * @type {boolean}
     */
    _useModelAndTexture;
    /**
     * 중간 타일 레벨에서 최소 모델 범위를 유지할지 결정합니다.
     *
     * @type {boolean}
     */
    _useMinMaxModel;
    /**
     * 압축 모델 요청에 사용하는 확장자입니다.
     *
     * @type {string}
     */
    _compressExt;
    /**
     * 타일 요청의 Y 인덱스를 반전할지 결정합니다.
     *
     * @type {boolean}
     */
    _reverseY;
    /**
     * 타일 요청의 X 인덱스를 반전할지 결정합니다.
     *
     * @type {boolean}
     */
    _reverseX;
    /**
     * 다음 갱신에서 시간 간격 검사와 관계없이 상세 갱신할지 결정합니다.
     *
     * @type {boolean}
     */
    _forceUpdate;
    /**
     * 최대 이미지 레벨에서 낮출 단계 수입니다.
     *
     * @type {number}
     */
    _minusMaxlevel;
    /**
     * 모델에 조명 계산 없는 기본 재질을 사용할지 결정합니다.
     *
     * @type {boolean}
     */
    _useBaseMaterial;
    /**
     * 파서에 전달할 모델 분할 요청 여부입니다.
     *
     * @type {boolean}
     */
    _useSplitModel;
    /**
     * 가장 낮은 모델 레벨에 포함할 건물의 높이 기준입니다.
     *
     * @type {number}
     */
    _zeroLevelHeight;
    /**
     * 이 레이어가 사용하는 모델 형식 식별자입니다.
     *
     * @type {string}
     */
    _format;
    /**
     * 최초 모델 생성 시 사용할 이미지 레벨입니다.
     *
     * @type {number}
     */
    _startImageLevel;
    /**
     * 텍스처 상세 갱신을 기다리는 타일 대기열입니다.
     *
     * @type {import('@union3d/core/U3dQueue').U3dQueue}
     */
    _tileBuffer;
    /**
     * 대기열에 등록한 타일을 키로 찾는 표입니다.
     *
     * @type {Record<string, import('@U3dQuadTile').U3dQuadTile>}
     */
    _tileBufferMap;
    /**
     * 초기화 시 원본 레이어 정보를 요청할지 결정합니다.
     *
     * @type {boolean}
     */
    _needXml;
    /**
     * 프록시 사용 시 요청 주소 앞에 붙일 접두 URL입니다.
     *
     * @type {string}
     */
    _proxyurl;
    /**
     * 모델 요청에 프록시를 사용할지 결정합니다.
     *
     * @type {boolean}
     */
    _useproxy;
    /**
     * 레이어 정보 요청에 사용할 파일의 기본 이름입니다.
     *
     * @type {string}
     */
    _basename;
    /**
     * 타일별로 복원된 모델 식별자를 기록합니다.
     *
     * @type {KeyValue}
     */
    _tileModelMap;
    /**
     * 레이어에 복원된 모델 식별자를 기록합니다.
     *
     * @type {KeyValue}
     */
    _modelIds;
    /**
     * 복원된 모델에 경계 상자 표시를 추가할지 결정합니다.
     *
     * @type {boolean}
     */
    _useBoxHelper;
    /**
     * 이미지 갱신 작업을 우선 대기열에 등록할지 결정합니다.
     *
     * @type {boolean}
     */
    _immediateUpdateImage;
    /**
     * 앞선 갱신에서 관찰한 카메라 위치입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _prevPostion;
    /**
     * 현재 갱신에서 관찰한 카메라 위치입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _curPostion;
    /**
     * 카메라 이동 이후 수행한 상세 갱신 횟수입니다.
     *
     * @type {number}
     */
    _updateCount;
    /**
     * 모델 재질에 적용할 색상 문자열입니다.
     *
     * @type {string | undefined}
     */
    _meshColor;
    /**
     * 레이어·타일·모델 바이너리를 요청하는 로더입니다.
     *
     * @type {import('@union3d/core/loader/UFileLoader').UFileLoader}
     */
    _loader;
    /**
     * 이 레이어가 요청한 텍스처의 로딩을 담당합니다.
     *
     * @type {import('@UTextureLoader').UTextureLoader}
     */
    _textureLoader;
    /**
     * 패키지 모델 요청 여부이며 초기화 시 원본 정보로 보완됩니다.
     *
     * @type {number | undefined}
     */
    _makeU3FPackage;
    /**
     * 패키지 모델 요청에서 사용할 번호입니다.
     *
     * @type {number}
     */
    _packageIndex;
    /**
     * 패키지 모델 요청에서 사용할 기본 이름입니다.
     *
     * @type {string}
     */
    _packageName;
    /**
     * 텍스처가 없는 모델 사이에 재질을 공유할지 결정합니다.
     *
     * @type {boolean | number}
     */
    _isShareMaterial;
    /**
     * 모델 복원을 Worker에 요청할지 결정합니다.
     *
     * @type {boolean}
     */
    _useWorker;
    /**
     * 패키지 타일 정보 JSON의 파일 이름입니다.
     *
     * @type {string | undefined}
     */
    _jsonname;
    /**
     * 패키지 타일 목록의 조회 상태를 보관합니다.
     *
     * @type {import('@union3d/meta/U3fPackagedInfo').U3fPackagedInfo}
     */
    _packagedInfo;
    /**
     * 거리별 텍스처 상세 갱신을 사용할지 결정합니다.
     *
     * @type {boolean}
     */
    _isTextureUpdate;
    /**
     * 이미지 상세 전환 거리를 지정하며 0이면 렌더링 문맥의 값을 사용합니다.
     *
     * @type {number | undefined}
     */
    _textureDistance;
    /**
     * 복원 재질에 전달할 스타일 설정입니다.
     *
     * @type {string | undefined}
     */
    _style;
    /**
     * 이미지 갱신 작업의 실행 간격을 관리합니다.
     *
     * @type {import('@union3d/core/UCheckTime').UCheckTime}
     */
    _checkUpdateImage;
    /**
     * 원본 레이어 정보에서 읽은 패키지 JSON 사용 상태입니다.
     *
     * @type {number | boolean}
     */
    _makeJson;
    /**
     * 타일 표시와 개별 모델 편집 시 복원할 재질 구간을 보관합니다.
     *
     * @type {KeyValue}
     */
    _refineCache;
    /**
     * 결합 그룹별 개별 모델의 편집 정보를 보관합니다.
     *
     * @type {KeyValue}
     */
    _composedCache;
    /**
     * 타일별로 요청한 모델 URL 목록입니다.
     *
     * @type {Record<string, Array<string>>}
     */
    _modelUrlMap;
    /**
     * 이미지 상세 선택에 적용할 품질 설정입니다.
     *
     * @type {string | undefined}
     */
    _textureLevel;
    /**
     * 이 레이어의 모델들이 재사용하며 dispose에서 해제하는 재질입니다.
     *
     * @type {Common_Material | undefined}
     */
    _sharedMaterial;
    /**
     * 앞선 상세 갱신에서 관찰한 모델 처리 개수입니다.
     *
     * @type {number | undefined}
     */
    _preUpdateCount;
    /**
     * 앞선 상세 갱신에서 마지막으로 처리한 타일 키입니다.
     *
     * @type {string | undefined}
     */
    _preUpdateLastTile;

    /**
     * U3dModelU3FLayer 클래스 생성자입니다. <br>
     * 실제 데이터 요청은 initialize에서 시작합니다. <br>
     * baseUrl이 없으면 안내 로그를 남기고 자식 초기화를 중단합니다.
     *
     * @param {U3dModelU3FLayerCO} [opt={}] 모델 주소와 타일·이미지 로딩 및 표시 옵션
     */
    constructor(opt = {}) {
        // nullish 입력의 기존 안내 로그도 옵션 정규화 전후 동일하게 유지합니다.
        const hasOptions = defined(opt);
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);
        const self = this;
        if (!hasOptions) {
            U3dMessage.info(self._classtype, 'U3dModelU3FLayer constructor is failed. because opt is null', '4364476');
            return;
        }

        if (!defined(opt.baseUrl)) {
            U3dMessage.info(self._classtype, 'U3dModelU3FLayer constructor is failed. because baseurl is null', '4364687');
            return;
        }

        self._classtype = 'U3dModelU3FLayer';

        self._srcminlevel = -9999;
        self._srcmaxlevel = -9999;
        self._u3fTiles = {};
        self._keysPreserved = [];
        self._info = undefined; //+ 레이어정보

        self._wrapping = defaultValue(opt.wrapping, THREE.ClampToEdgeWrapping);

        // self._name                = defaultValue(opt.name, Guid());
        self._useModelAndTexture = defaultValue(opt.useModelAndTexture, true);
        self._useMinMaxModel = defaultValue(opt.useMinMixModel, true);
        self._ext = defaultValue(opt.ext, '.u3f');
        self._compressExt = '.gz';
        self._reverseY = defaultValue(opt.reverseY, false);
        self._forceUpdate = false;
        //+ 이미지레벨을 1 다운시킨다.
        self._minusMaxlevel = defaultValue(opt.minusMaxLevel, 1);

        self._useBaseMaterial = defaultValue(opt.useBaseMaterial, false);

        //+ 병합된 건물을 다시 낱개로 쪼개는 기능 사용 여부 (u3f 1.2 버전이상)
        self._useSplitModel = defaultValue(opt.useSplitModel, false);

        self._zeroLevelHeight = defaultValue(opt.zeroLevelHeight, 40);
        self._format = 'u3flayer';

        self._startImageLevel = defaultValue(opt.startImageLevel, 0);

        self._tileBuffer = new U3dQueue();
        self._tileBufferMap = {};
        self._needXml = defaultValue(opt.needXml, true);
        // if (self._needXml) {
        self._proxyurl = defaultValue(opt.proxyUrl, './proxy.jsp?url=');
        self._useproxy = defaultValue(opt.useProxy, false);
        if (self._useproxy === false) self._proxyurl = '';

        self._boundingBox = defined(opt.boundingBox) ? Object.create(opt.boundingBox) : undefined;

        self._box3 = new THREE.Box3();
        self._basename = /** @type {string} */(opt.baseName);
        // self.removedList = [];
        self._tileModelMap = {};
        self._modelIds = {};

        self._useBoxHelper = defaultValue(opt.useBoxHelper, false);

        //+ 거리에 따라 건물이미지 갱선주기 최우선으로 바꾸는 설정
        self._immediateUpdateImage = defaultValue(opt.immediateUpdateImage, false);

        self._prevPostion = undefined;
        self._curPostion = undefined;
        self._updateCount = 0;
        self._meshColor = defaultValue(opt.meshColor, undefined);
        self._loader = new UFileLoader();
        self._loader.crossOrigin = 'anonymous';
        self._loader.setResponseType('arraybuffer');
        self._textureLoader = new UTextureLoader(this._classtype);
        self._makeU3FPackage = defaultValue(opt.makeU3FPackage, undefined);
        self._packageIndex = 0;
        self._packageName = 'package';
        self._isShareMaterial = defaultValue(opt.isShareMaterial, false);
        self._useWorker = defaultValue(opt.useWorker, true);

        self._jsonname = undefined;
        self._packagedInfo = new U3fPackagedInfo();
        self._isTextureUpdate = defaultValue(opt.isTextureUpdate, true);
        self._textureDistance = defaultValue(opt.textureDistance, undefined);
        self._style = defaultValue(opt.style, undefined);
        self._checkUpdateImage = new UCheckTime();
        self._makeJson = 0;

        self._refineCache = {};
        self._refineCache[UDEF.TILE_REFINE.ADD] = {};
        self._refineCache[UDEF.TILE_REFINE.REPLACE] = {};
        //composed model index Range Cache
        self._composedCache = {};

        self._modelUrlMap = {};
        self._textureLevel = defaultValue(opt.textureLevel, undefined);

        if (!U3dModelU3FLayer.nonDrawMaterial) {
            if (V25_TEST) {
                U3dModelU3FLayer.nonDrawMaterial = new THREE.MeshBasicMaterial({
                    color: '#ff0000'
                });
            } else {
                U3dModelU3FLayer.nonDrawMaterial = new THREE.MeshBasicMaterial();
                self.setMaterial(U3dModelU3FLayer.nonDrawMaterial);
                U3dModelU3FLayer.nonDrawMaterial.visible = false;
            }
        }
    }

    /**
     * 그림자 갱신 대상 그룹을 순회해 메시의 가시 상태와 갱신 시간을 반영합니다.
     *
     * @param {number} updateTime 각 메시의 갱신 여부 검사와 그림자 적용에 전달할 시간
     */
    updateShadow(updateTime) {
        if (this._group.children.length === 0) return;
        const count = Math.floor(this._group.children.length / 2);
        let applyCount = 0;
        for (let i = 0; i < count; i++) {
            const meshGroup = /** @type {import('@UGroup').UGroup | undefined} */ (this._group.next());

            if (!meshGroup || meshGroup.userData.exceptShadowUpdate) continue;

            for (const sharedMesh of meshGroup.children) {
                const group = /** @type {import('@UGroup').UGroup} */ (/** @type {unknown} */ (sharedMesh));
                for (const mesh of /** @type {Array<import('@UMesh').UMesh>} */ (group.children)) {
                    if (!mesh?.hasReachedShadowTime?.(updateTime)) {
                        continue;
                    }
                    mesh.applyShadow((mesh.visible && (/** @type {import('@U3dApp').U3dApp} */(this._app))._frustum.intersectsObject(mesh)), updateTime);
                }
            }

            if (++applyCount > 4) {
                return;
            }
        }
    }

    /**
     * 모델 텍스처의 품질 설정을 저장하고 화면 갱신을 요청합니다. <br>
     * high 또는 low 값은 품질 선택에 사용되지만 현재 입력 검사에서는 안내 로그도 출력됩니다. <br>
     * 안내 로그가 발생해도 입력값은 저장됩니다.
     *
     * @param {string} textureLevel 적용할 텍스처 품질
     */
    setTextureLevel(textureLevel) {
        const self = this;
        if (!U3dModelU3FLayer.TEXTURE_LEVEL.hasOwnProperty(textureLevel)) {
            __GInfo__(self, `설정 가능한 level 값은 'high' 또는 'low'입니다. 값을 다시 확인해 주세요.`, "4539695");
        }

        self._textureLevel = textureLevel;
        self.refresh?.();
    }

    /**
     * 텍스처 품질 고정을 해제하여 거리별 자동 선택으로 돌아갑니다. <br>
     * 이 메서드는 별도의 화면 갱신을 요청하지 않습니다.
     */
    clearTextureLevel() {
        const self = this;
        self._textureLevel = undefined;
    }

    /**
     * 모든 U3F 레이어가 공유하는 모델 복원 Worker 실행기입니다.
     *
     * @type {import('@union3d/core/UTaskProcessor').UTaskProcessor}
     */
    static g_TaskProcessor = new UTaskProcessor('task/model/u3f/U3fParserTask.js', 5);
    /**
     * 병합 모델에서 숨긴 구간에 재사용하는 공용 재질입니다.
     *
     * @type {ModelMaterial | undefined}
     */
    static nonDrawMaterial;

    /**
     * 메쉬 정점/지오메트리 수를 집계하고 테스트 머터리얼을 적용합니다.
     *
     * @ignore
     */
    testMesh() {
        const self = this;
        const testColor = [
            0xff0000,
            0x00ff00,
            0x0000ff,
            0xffff00,
            0x00ffff,
            0xff00ff
        ]
        let count = 0;
        let vertexCount = 0;
        self._scene.traverse((/** @type {ModelMesh} */ obj) => {
            if (obj.geometry && obj.geometry.attributes && obj.geometry.attributes.position
                && obj.geometry.attributes.position.array && obj.geometry.attributes.position.array.length > 0) {
                count++;
                vertexCount = vertexCount + (obj.geometry.attributes.position.array.length / 3);
                if (obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
                obj.material = new THREE.MeshBasicMaterial();
                obj.material.color = new THREE.Color(testColor[count % 6]);
                obj.material.opacity = 0.8;
                obj.material.transparent = true;
            }
        });
        console.log(`${self._name} => total vertex: ${vertexCount} / total geometry: ${count}`);
    }

    /**
     * 원본 레이어 정보를 읽어 표시 범위와 패키지 로딩 설정을 초기화합니다. <br>
     * needXml이 false이면 부모 초기화와 완료 통지만 수행하며 Promise를 반환하지 않습니다. <br>
     * 패키지 JSON을 요청하는 경우 반환된 Promise와 별도로 초기화가 진행됩니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 상위 호출부와 호환되는 렌더링 문맥
     * @returns {Promise<unknown> | undefined} 원본 정보 요청을 연결한 Promise, 원본 정보를 요청하지 않으면 undefined
     */
    initialize(drawArg) {
        const self = this;
        if (self._needXml) {
            if (!self._basename.includes('.u3g'))
                self._basename = self._basename + '.u3g';
            const url = self._proxyurl + self._baseUrl + '/' + self._basename;
            return self.getLayerInfo(url, drawArg).then(function (/** @type {KeyValue} */ info) {
                //console.info('success')
                if (defined(info.bbox)) {
                    let bbox = info.bbox;
                    self._boundingBox = {
                        minx: bbox[0],
                        maxx: bbox[1],
                        miny: bbox[2],
                        maxy: bbox[3],
                        minz: bbox[4],
                        maxz: bbox[5]
                    };

                    //+ 레이어정보
                    self._info = info;
                    if (!defined(info.makeU3FPackage) || info.makeU3FPackage === UDEF.NON_PACKAGED_MODEL) {
                        self._makeU3FPackage = UDEF.NON_PACKAGED_MODEL;
                    }
                    self._makeJson = !!(defined(info.makeJson) && info.makeJson === 1)
                    self.computeRectangle();
                }

                if (self._makeU3FPackage === UDEF.PACKAGED_MODEL && self._makeJson) {
                    self._jsonname = self._basename.replace('.u3g', '.json');
                    const jsonUrl = self._proxyurl + self._baseUrl + '/' + self._jsonname;
                    self.getLayerJson(jsonUrl).then((json) => {
                        self._packagedInfo.set(json);
                    }).catch(() => {
                        self._makeJson = 0;
                    }).finally(() => {
                        U3dModelLayer.prototype.initialize.call(self);
                        //+ 이니셜라이즈 종료 호출
                        if (defined(/**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).resolve)) {
                            /**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).resolve(self);
                        }
                    });
                } else {
                    U3dModelLayer.prototype.initialize.call(self);
                    //+ 이니셜라이즈 종료 호출
                    if (defined(/**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).resolve)) {
                        /**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).resolve(self);
                    }
                }
            }).catch(function () {
                U3dMessage.error(self._classtype, 'Failed to load layer Url :' + self._baseUrl + '/' + self._basename, '3610581');
                if (defined(/**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).reject)) {
                    /**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).reject(self);
                }
            });

        } else {
            self.computeRectangle();
            U3dModelLayer.prototype.initialize.call(self);
            if (defined(/**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).resolve)) {
                /**@type{Partial<DeferredObject<U3dModelU3FLayer>>}*/(self).resolve(self);
            }
        }

        return undefined;
    }

    /**
     * 초기화된 레이어의 경계 상자를 반환합니다. <br>
     * 반환 객체는 복사본이 아니라 레이어가 보관한 원본 참조입니다.
     *
     * @returns {import('three').Box3} 레이어 경계 상자
     */
    getBoundingBox() {
        return /** @type {import('three').Box3} */(this._box3);
    }

    /**
     * 프록시·기본 주소·기본 이름을 결합한 레이어 정보 요청 URL을 반환합니다. <br>
     * 이름에 확장자가 이미 있어도 확장자를 다시 덧붙입니다.
     *
     * @returns {string} 레이어 정보 요청 URL
     */
    createU3GURL() {
        return this._proxyurl + this._baseUrl + '/' + this._basename + '.u3g';
    }

    /**
     * 초기화에서 저장한 원본 레이어 정보를 반환합니다. <br>
     * 반환 객체를 변경하면 레이어가 사용하는 정보에도 반영됩니다.
     *
     * @returns {KeyValue | undefined} 저장된 레이어 정보, 초기화 전이면 undefined
     */
    getInfo() {
        return this._info;
    }

    /**
     * 레이어 정보를 요청하고 원본 최소·최대 타일 레벨을 기록합니다. <br>
     * 요청 실패·중단은 false로, 형식 식별 실패는 undefined로 거부합니다. <br>
     * 바이너리 해석 중 발생한 예외는 이 메서드에서 복구하지 않습니다.
     *
     * @param {string} [url] 요청 URL이며 생략하면 createU3GURL의 결과 사용
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 호출부 호환용 렌더링 문맥이며 현재 구현에서는 사용하지 않음
     * @returns {Promise<object>} 해석한 레이어 정보가 전달되는 완료 객체
     */
    getLayerInfo(url, drawArg) {
        const self = this;
        if (!defined(url))
            url = self.createU3GURL();
        /** @type {DeferredObject<object>} */
        let promise = deferred();
        let loader = self._loader;
        loader.load(
            url,
            //+ load
            function (/** @type {ArrayBuffer} */ data) {
                // 응답에서 레이어 범위 정보를 복원하고 기존 완료 객체에 결과를 전달합니다.
                INTERNAL.readLayerInfo(self, data, promise);
            }
            //+ progress 속도가 느려진다. 콜백함수가 없어야 한다.
            , null
            //+ error
            , function () {
                promise.reject(false);
            }
            //+ abort
            , function () {
                promise.reject(false);
            }
        );
        return promise;
    }

    /**
     * 레이어 JSON 정보를 로드합니다.
     *
     * @param {string} url JSON 요청 URL
     * @returns {Promise<object>} JSON 정보 Promise
     *
     * @ignore
     */
    getLayerJson(url) {
        const jsonLoader = new UFileLoader();

        /** @type {DeferredObject<object>} */
        const promise = deferred();
        jsonLoader.crossOrigin = 'anonymous';
        jsonLoader.setResponseType('json');
        jsonLoader.load(
            url,
            function (/** @type {object} */ json) {
                promise.resolve(json);
            },
            null,
            function () {
                promise.reject();
            },
            function () {
                promise.reject();
            });

        return promise;
    }

    /**
     * 타일 정보를 로드/파싱합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} indexX 타일 X 인덱스
     * @param {number} indexY 타일 Y 인덱스
     * @param {number} level 타일 레벨
     * @param {string} url 타일 정보 요청 URL
     * @returns {Promise<import('@union3d/meta/U3fPackagedInfo').TileInfo>} 타일 정보 Promise
     *
     * @ignore
     */
    getTileInfo(tile, indexX, indexY, level, url) {
        const self = this;
        /** @type {DeferredObject<import('@union3d/meta/U3fPackagedInfo').TileInfo>} */
        const promise = deferred();

        if (self._makeJson && self._makeU3FPackage === UDEF.PACKAGED_MODEL) {
            if (self._packagedInfo.isValidTile(level, indexX, indexY)) {
                const tileInfo = new TileInfo({
                    level: level,
                    indexX: indexX,
                    indexY: indexY
                });
                promise.resolve(self._packagedInfo.setInfo(tileInfo));
            } else {
                promise.resolve();
            }
            return promise;
        }

        const gcenter = tile._rectangle3d.centerMap();
        const baseurl = UMathEngine.createUrl3DF(gcenter.x
            , gcenter.y
            , self._proxyurl + self._baseUrl
            , tile._rlevel
            , self._reverseX
            , self._reverseY
        );

        if (self._cacheTiles.get(url)) {
            INTERNAL.parseTileInfo(indexX, indexY, level, self, self._cacheTiles.get(url), promise, baseurl);
            return promise;
        }
        const loader = self._loader;

        loader.load(
            url,
            //+ onLoad
            function (/** @type {ArrayBuffer} */ data) {

                const key = self.createKeyByTile(tile);
                if (!defined(self._u3fTiles[key]))
                    self._u3fTiles[key] = [];

                self._u3fTiles[key].push(url);
                self._cacheTiles.add(url, data);
                INTERNAL.parseTileInfo(indexX, indexY, level, self, data, promise, baseurl);
            },
            //+ onProgress
            null,
            //+ error
            function (/** @type {unknown} */ e) {
                promise.reject(e);
            },
            //+ abort
            function () {
                promise.reject('loader abort');
            }
        );

        return promise;
    }

    /**
     * 모델 정보를 로드/파싱하여 mesh로 변환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} index 모델 인덱스
     * @param {string} url 모델 요청 URL
     * @param {string} baseurl 모델 기본 URL
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo 타일 정보
     * @returns {Promise<unknown> | undefined} 모델 정보 Promise
     *
     * @ignore
     */
    getModelInfo(tile, index, url, baseurl, drawArg, tileInfo) {
        const self = this;
        const promise = deferred();

        if (self.isTileDisposed(tile, drawArg))
            return undefined;

        if (self._cacheModeles.get(url))
            return undefined;

        if (self._useWorker) {
            U3dModelU3FLayer.g_TaskProcessor.scheduleTask(new UWorkerParameter({
                type: 'U3fParserTask',
                subType: 'load',
                data: {
                    url: url,
                    baseurl: baseurl,
                    info: self.getInfo(),
                    index: index,
                    useSplitModel: self._useSplitModel,
                    compressModel: self._compressModel,
                    makeU3FPackage: self._makeU3FPackage
                }
            })).then(function (/** @type {Array<U3FParsedObj>} */ objs) {
                if (self.isTileDisposed(tile, drawArg)) {
                    self.disposeTile(tile);
                    promise.reject();
                    return;
                }

                if (tile.getParent() && !tile.getParent().updatePossible()) {
                    self.disposeTile(tile);
                    promise.reject();
                    return;
                }

                self._cacheModeles.add(url, true); // 모델 로드가 끝난 후에 넣어야 제대로 작동한다.

                if (objs === undefined) {
                    promise.reject(false);
                    return;
                }

                if (objs.length === 0) {
                    promise.reject(false);
                    return;
                }

                if (self._makeU3FPackage === UDEF.PACKAGED_MODEL) {
                    let count = 0;
                    /** @type {Array<U3FParsedObj>} */
                    let objects = [];
                    for (let obj of objs) {
                        UDEF.createPromise(function (resolve, reject) {
                            //+ chows add (현식아 . index값 안넣으면 시리얼하게 모델이 안 올라간다)
                            if (!obj[0]) {
                                reject(false);
                                return;
                            }
                            obj[0].modelurl = url;
                            obj[0].baseurl = baseurl;
                            obj[0].index = index;
                            let promiseConvert = convertObj2Mesh.call(self, self, obj, tile, drawArg, tileInfo);
                            if (defined(promiseConvert)) {
                                promiseConvert.then(function (/** @type {Array<U3FParsedObj>} */ param) {
                                    resolve(param);
                                }).catch(function (/** @type {boolean} */ param) {
                                    reject(param);
                                });
                            } else {
                                reject();
                            }
                        }).then(async function (/** @type {Array<U3FParsedObj>} */ results) {
                            count = count + 1;
                            if (defined(results)) objects.push(results);
                            if (count === objs.length) {
                                if (tileInfo.mergeInfos && tileInfo.mergeInfos.length > 0) {
                                    await self.mergeModelMesh(tileInfo.mergeInfos, tile, drawArg);
                                } else if (V25_TEST) {
                                    const test = self.getCache(tile);
                                    if (test)
                                        test.visible = false;
                                }
                                promise.resolve(objects);
                            }

                        }).catch(function (/** @type {unknown} */ criticalReject) {
                            if (criticalReject) { //true 경우 치명적인 reject 라는 뜻으로 바로 종료한다.
                                self._cacheModeles.remove(url);
                                promise.reject(criticalReject);
                                return;
                            }
                            U3dMessage.error(self._classtype, `${tile._key} 타일 로드 중 에러가 발생하였습니다. `, '0831914');
                            count = count + 1;
                            if (count === objs.length) {
                                if (objects.length > 0) {
                                    promise.resolve(objects);
                                } else {
                                    self._cacheModeles.remove(url);
                                    promise.reject();
                                }
                            }
                        })
                    }
                } else {
                    UDEF.createPromise(function (resolve, reject) {
                        //+ chows add (현식아 . index값 안넣으면 시리얼하게 모델이 안 올라간다)
                        objs[0].modelurl = url;
                        objs[0].baseurl = baseurl;
                        objs[0].index = index;
                        let promiseConvert = convertObj2Mesh.call(self, self, objs, tile, drawArg, tileInfo);
                        if (defined(promiseConvert)) {
                            promiseConvert.then(function (/** @type {Array<U3FParsedObj>} */ param) {
                                resolve(param);
                            }).catch(function (/** @type {boolean} */ param) {
                                reject(param);
                            });
                        } else {
                            reject();
                        }
                    }).then(function (/** @type {Array<U3FParsedObj>} */ results) {
                        promise.resolve(results);
                    }).catch(function (/** @type {unknown} */ criticalReject) {
                        self._cacheModeles.remove(url);
                        promise.reject(criticalReject);
                    });
                }
            }).catch(function (/** @type {unknown} */ e) {
                //  self.minusLoadingTile();
                self._cacheModeles.remove(url);
                promise.reject(false);
            });
        } else { //webworker 사용 안할때
            let loader = self._loader;
            //+ 캐쉬여부
            loader.load(
                url,
                //+ onLoad
                function (/** @type {ArrayBuffer} */ data) {
                    //  requestAnimationFrame( function() {
                    if (self.isTileDisposed(tile, drawArg)) {
                        self.disposeTile(tile);
                        promise.reject();
                        return;
                    }

                    //  self.minusLoadingTile();
                    let option = {
                        baseurl: baseurl,
                        index: index,
                        usesplitmodel: self._useSplitModel, //+ 통합된 모델에서 낱개로 쪼개는 기능 사용여부
                        compressmodel: self._compressModel,  //+ 압축모델 사용여부
                        ext: self._ext
                    };

                    let u3fParser = new U3FParser(option);
                    let objs = undefined;

                    UDEF.createPromise(function (resolve, reject) {
                        if (self._compressModel) {
                            //+ gzip 압축풀기
                            let encodedata = (/** @type {Window & KeyValue} */(/** @type {unknown} */(globalThis))).__UNION3D__.pako.inflate(data, {level: 9, memLevel: 9});
                            data = encodedata.buffer;
                        }

                        if (self._makeU3FPackage === UDEF.PACKAGED_MODEL) {
                            let u3fPackageParser = new U3FPackageParser(option);
                            objs = u3fPackageParser.parse(data, self.getInfo(), option, u3fParser);
                        } else
                            objs = u3fParser.parse(data, self.getInfo(), option);
                        resolve(objs)
                        // end.resolve(objs);
                    }).then(function (/** @type {Array<U3FParsedObj>} */ objs) {
                        self._cacheModeles.add(url, true); // 모델 로드가 끝난 후에 넣어야 제대로 작동한다.

                        if (objs === undefined) {
                            promise.reject(false);
                            return;
                        }
                        if (objs.length == 0) {
                            promise.reject(false);
                            return;
                        }
                        if (self._makeU3FPackage === UDEF.PACKAGED_MODEL) {
                            let count = 0;
                            /** @type {Array<U3FParsedObj>} */
                            let objects = [];
                            for (let obj of objs) {
                                UDEF.createPromise(function (resolve, reject) {
                                    //+ chows add (현식아 . index값 안넣으면 시리얼하게 모델이 안 올라간다)
                                    obj[0].modelurl = url;
                                    obj[0].baseurl = baseurl;
                                    obj[0].index = index;
                                    const promiseConvert = convertObj2Mesh.call(self, self, obj, tile, drawArg, tileInfo);
                                    if (defined(promiseConvert)) {
                                        promiseConvert.then(function (/** @type {Array<U3FParsedObj>} */ param) {
                                            resolve(param);
                                        }).catch(function (/** @type {boolean} */ param) {
                                            reject(param);
                                        });
                                    } else {
                                        reject();
                                    }
                                }).then(async function (/** @type {Array<U3FParsedObj>} */ results) {
                                    count = count + 1;
                                    if (defined(results)) objects.push(results);

                                    if (count === objs.length) {
                                        if (tileInfo.mergeInfos && tileInfo.mergeInfos.length > 0) {
                                            await self.mergeModelMesh(tileInfo.mergeInfos, tile, drawArg);
                                        }
                                        promise.resolve(objects);
                                    }

                                }).catch(function (/** @type {unknown} */ criticalReject) {
                                    if (criticalReject) { //true 경우 치명적인 reject 라는 뜻으로 바로 종료한다.
                                        self._cacheModeles.remove(url);
                                        promise.reject(criticalReject);
                                        return;
                                    }
                                    U3dMessage.error(self._classtype, `${tile._key} 타일 로드 중 에러가 발생하였습니다. `, '2333208');
                                    count = count + 1;
                                    if (count === objs.length) {
                                        if (objects.length > 0) {
                                            promise.resolve(objects);
                                        } else {
                                            self._cacheModeles.remove(url);
                                            promise.reject();
                                        }
                                    }
                                })
                            }
                        } else {
                            UDEF.createPromise(function (resolve, reject) {
                                //+ chows add (현식아 . index값 안넣으면 시리얼하게 모델이 안 올라간다)
                                objs[0].modelurl = url;
                                objs[0].baseurl = baseurl;
                                objs[0].index = index;
                                let promiseConvert = convertObj2Mesh.call(self, self, objs, tile, drawArg, tileInfo);
                                if (defined(promiseConvert)) {
                                    promiseConvert.then(function (/** @type {Array<U3FParsedObj>} */ param) {
                                        resolve(param);
                                    }).catch(function (/** @type {boolean} */ param) {
                                        reject(param);
                                    });
                                } else {
                                    reject();
                                }
                            }).then(function (/** @type {Array<U3FParsedObj>} */ results) {
                                promise.resolve(results);
                            }).catch(function (/** @type {unknown} */ criticalReject) {
                                promise.reject(criticalReject);
                                self._cacheModeles.remove(url);
                            });
                        }
                    });
                },
                //+ onProgress
                null,
                //+ error
                function () {
                    self._cacheModeles.remove(url);
                    //  self.minusLoadingTile();
                    promise.reject(false);
                }
            );
        }
        return promise;
    }

    /**
     * 다음 상세 갱신에서 시간 간격 제한을 건너뛸지 설정합니다.
     *
     * @param {boolean} force 시간 간격과 관계없이 갱신할지 여부
     *
     * @ignore
     */
    setForceUpdate(force) {
        this._forceUpdate = force;
    }

    /**
     * 다음 상세 갱신에서 시간 간격 제한을 건너뛸지 반환합니다.
     *
     * @returns {boolean} ForceUpdate 여부
     *
     * @ignore
     */
    getForceUpdate() {
        return this._forceUpdate;
    }

    /**
     * 타일 키에 연결된 요청·모델·텍스처 상태를 해제하고 공유 표시 구간을 복원합니다. <br>
     * 동일 모델을 공유하는 다른 타일의 표시 상태도 갱신됩니다.
     *
     * @override
     *
     * @param {string} key 해제할 타일 키
     */
    disposeTileByKey(key) {
        const self = this;
        if (self.editedList.length > 0) {
            for (let k = 0; k < self.editedList.length; k++) {
                const tempObj = self.getEditedEventById(self.editedList[k]);
                if (defined(tempObj))
                    tempObj._isAdd = false;
            }
        }

        if (self._modelUrlMap[key]) {
            for (let i = 0; i < self._modelUrlMap[key].length; i++) {
                U3dModelU3FLayer.g_TaskProcessor.allExecTask(new UWorkerParameter({
                    type: 'U3fParserTask',
                    subType: 'abort',
                    data: self._modelUrlMap[key][i]
                }))
            }

            delete self._modelUrlMap[key];
        }

        const group = /** @type {any} */(self.getCacheByKey(key));
        if (defined(group)) {
            if (group instanceof THREE.Group) {
                if (defined(group.children)) {
                    for (let k = 0; k < group.children.length; k++) {
                        const mesh = /** @type {ModelMesh} */(group.children[k]);
                        if (defined(mesh._uUrl)) {
                            self._cacheModeles.remove(mesh._uUrl);
                        }
                        if (defined(mesh.hasGizmo)) {
                            mesh.hasGizmo.detach();
                        }
                        if (defined(mesh.geometry) && defined(mesh.geometry.boundsTree))
                            mesh.geometry.disposeBoundsTree();
                    }
                }
            }

            if (group._refine && group._refine === UDEF.TILE_REFINE.REPLACE) {
                if (self._refineCache[UDEF.TILE_REFINE.ADD][key]) {
                    const dividedRefines = [];
                    for (let refineRange of self._refineCache[UDEF.TILE_REFINE.ADD][key]) {
                        refineRange.materialIndex = refineRange.originIndex;

                        if (refineRange.isDivided) {
                            const idx = dividedRefines.findIndex(function (/** @type {KeyValue} */ groups) {
                                return groups.childMeshId === refineRange.childMeshId
                            })
                            if (idx === -1)
                                dividedRefines.push(refineRange)
                        }

                    }
                    for (const refine of dividedRefines) {
                        const gid = refine.gid;
                        const group_ = self._group.children.find(function (child) {
                            return child.uuid === gid;
                        })
                        if (!group_)
                            continue;
                        const colorInfo = self.getEditedEventById(refine.childMeshId)
                        if (!colorInfo || !colorInfo.color) continue;
                        const color = colorInfo.color;
                        const opacity = colorInfo.opacity;

                        group_.traverse(function (/** @type {ModelMesh} */ mesh) {
                            if (mesh.isMesh && !(mesh instanceof USharedMesh)) {
                                const material = mesh.material[refine.materialIndex];
                                if (material && colorInfo.isSetColor) {
                                    setMaterialColor(material, color, /** @type {number} */(opacity));
                                    mesh.setManualUpdate();
                                } else if (colorInfo.color && colorInfo.afterFunction) {
                                    (/** @type {(mesh: import('three').Object3D, drawArg: import('@UDrawArg').UDrawArg | undefined, childMeshId: string) => void} */(colorInfo.afterFunction))(mesh, self._drawArg, refine.childMeshId);
                                }
                            }
                        })
                    }
                }
                delete self._refineCache[UDEF.TILE_REFINE.REPLACE][key];
            }

            if (group._refine && group._refine === UDEF.TILE_REFINE.ADD && group._tileMaxKeys) {
                const keys = Object.keys(group._tileMaxKeys);
                for (let key of keys) {
                    if (self._refineCache[UDEF.TILE_REFINE.ADD][key]) {
                        for (let i = 0; i < self._refineCache[UDEF.TILE_REFINE.ADD][key].length; i++) {
                            if (self._refineCache[UDEF.TILE_REFINE.ADD][key][i].gid === group.uuid) {
                                self._refineCache[UDEF.TILE_REFINE.ADD][key].splice(i--, 1);

                                if (VALIDATION_MODE) {
                                    VALIDATION_TARGET[key] = VALIDATION_TARGET[key] || [];
                                    if (!VALIDATION_TARGET[key].includes(group.uuid))
                                        VALIDATION_TARGET[key].push(group.uuid);
                                }
                                group._tileMaxKeys[key]--;
                                if (group._tileMaxKeys === 0)
                                    break;
                            }
                        }

                        if (self._refineCache[UDEF.TILE_REFINE.ADD][key].length === 0)
                            delete self._refineCache[UDEF.TILE_REFINE.ADD][key];
                    }
                }
            }
            if (self._composedCache[group.uuid]) {
                delete self._composedCache[group.uuid];
            }
        }

        if (defined(self._u3fTiles[key]) && Array.isArray(self._u3fTiles[key])) {
            let u3fTiles = self._u3fTiles[key];
            if (defined(u3fTiles)) {
                let url;
                for (let z = 0; z < u3fTiles.length; z++) {
                    url = u3fTiles[z];
                    self._cacheTiles.remove(url);
                }
            }

            delete self._u3fTiles[key];
        }

        //+ 모델 url 지움
        if (defined(self._cacheModelInTile)) {
            let urlmodels = self._cacheModelInTile.get(key);
            if (defined(urlmodels)) {
                for (let i = 0; i < urlmodels.length; i++) {
                    self._cacheModeles.remove(urlmodels[i]);
                }
            }

            self._cacheModelInTile.remove(key);
        }

        for (let id in self._tileModelMap[key]) {
            self._modelIds[id] = undefined;
            delete self._modelIds[id]
        }
        self._tileModelMap[key] = undefined;
        delete self._tileModelMap[key];

        U3dModelLayer.prototype.disposeTileByKey.call(self, key);
        // console.info('next='+Object.keys(self._cache._items).length);
    }

    /**
     * 보존 목록에 기록된 타일을 순서대로 해제하고 목록을 비웁니다.
     */
    deletekeys() {
        const self = this;
        if (self._keysPreserved.length > 0) {
            for (let i = 0; i < self._keysPreserved.length; i++) {
                self.disposeTileByKey(self._keysPreserved[i]);
            }

            self._keysPreserved = [];
        }
    }

    /**
     * 레이어 레벨 범위에 속하면서 더 이상 사용할 수 없는 타일의 모델을 해제합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일
     */
    disposeTile(tile) {
        const self = this;
        if (!defined(tile)) return;

        if (self._minlevel > tile._rlevel || self._maxlevel < tile._rlevel)
            return;

        if (self.isTileDisposed(tile, tile._drawArg)) {
            let key = self.createKeyByTile(tile);
            self.disposeTileByKey(key);
        }
    }

    /**
     * 부모 레이어 해제를 시작하고 공간 색인 및 이 레이어의 공유 재질을 해제합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 호출부 호환용 인수이며 부모 해제에는 전달하지 않음
     * @returns {Promise<boolean>} 부모 레이어가 반환한 해제 완료 Promise
     */
    dispose(drawArg) {
        const self = this;
        const disposed = U3dModelLayer.prototype.dispose.call(self);
        if (defined(UDEF.RBUSH))
            (/** @type {{clear: () => void, insert: (item: unknown) => void}} */(UDEF.RBUSH)).clear();
        return disposed.then((result) => {
            // 개별 타일/모델은 빌려 쓰기만 한다. 레이어의 정리가 끝난 뒤 공유 재질의 소유권을 닫는다.
            const material = self._sharedMaterial;
            self._sharedMaterial = undefined;
            if (material) UDEF.disposeResource({material});
            return result;
        });
    }

    /**
     * 텍스처를 로드합니다.
     *
     * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self 레이어 인스턴스
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {string} url 텍스처 URL
     * @returns {Promise<import('three').Texture>} 텍스처 promise
     *
     * @ignore
     */
    getTexture(self, tile, url) {
        return UDEF.createPromise(function (resolve, reject) {
            let loader = self._textureLoader;
            loader.load(
                url,
                function (/** @type {import('three').Texture} */ texture) {
                    resolve(texture);
                }
                , null
                , function () {
                    reject();
                }
                , function () {
                    reject();
                }
            );
        });
    }

    /**
     * 부모 레이어의 표시 상태를 변경하며 숨길 때 U3F 메모리를 정리합니다. <br>
     * 부모 호출의 반환값은 전달하지 않습니다.
     *
     * @override
     *
     * @param {boolean} show 표시하면 true, 숨기면 false
     * @param {boolean} [refresh] 부모에게 전달할 화면 갱신 여부
     */
    show(show, refresh) {
        U3dModelLayer.prototype.show.call(this, show, refresh);
        if (!show) {
            this.cleanMemory();
        }
    }

    /**
     * 메모리/캐시를 정리합니다.
     *
     * @ignore
     */
    cleanMemory() {
        const self = this;

        self.cancelAllTile();

        if (defined(self._cache) && self._cache instanceof UCache)
            self._cache.deleteAll(self, self.fncDeleteGroup);
        if (defined(self._cacheModeles) && self._cacheModeles instanceof UCache)
            self._cacheModeles.clear();
        if (defined(self._cacheModelInTile) && self._cacheModelInTile instanceof UCache)
            self._cacheModelInTile.clear();
        if (defined(self._cacheTiles) && self._cacheTiles instanceof UCache)
            self._cacheTiles.clear();

        //그룹 데이터 제거
        if (defined(self._group)) {
            self._group.clear();
        }

        if (defined(self._labelGroup)) {
            self._labelGroup.clear();
            self._labelGroup = undefined
        }

        self._modelIds = {};
        self._tileModelMap = {};
        self._refineCache = {};
        self._refineCache[UDEF.TILE_REFINE.ADD] = {};
        self._refineCache[UDEF.TILE_REFINE.REPLACE] = {};

        self._composedCache = {};
    }

    /**
     * 레이어 업데이트 함수
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {number} [curTime] 현재 시간
     *
     * @ignore
     */
    update(drawArg, curTime) {
        const self = this;
        if (!defined(drawArg))
            return;

        if (!self._visible)
            return;

        let app = drawArg._app;
        if (!defined(app))
            return;

        if (!self._isTextureUpdate) return;
        search: {
            if (self._checkUpdateTime.isUpdate() || self.getForceUpdate()) {
                //+ 정적모델(setStopModel)일때, 일정거리영역밖에 것- 건물삭제
                U3dModelLayer.prototype.update.call(this, drawArg);
                let modelKeys;
                let keys;
                if (self.getForceUpdate()) {
                    self.setForceUpdate(false);
                } else {
                    if ((/** @type {{getWorkingLevel2: () => number}} */(self._workProcess)).getWorkingLevel2() > LIMIT_COUNT) {
                        break search;
                    }
                    if (defined(self._box3) && defined(self._drawArg)) {
                        if (!self._drawArg.intersectsBox(self._box3))
                            break search;
                    }
                    keys = Object.keys(self._tileModelMap);
                    if (keys.length === 0)
                        break search;
                    modelKeys = self._cacheModeles.getKeys();
                    if (self._preUpdateCount
                        && modelKeys.length === self._preUpdateCount
                        && modelKeys[modelKeys.length - 1] === self._preUpdateLastTile) {
                        break search;
                    }
                }
                if (!modelKeys)
                    modelKeys = self._cacheModeles.getKeys();
                if (!keys)
                    keys = Object.keys(self._tileModelMap);

                self._preUpdateCount = modelKeys.length;
                self._preUpdateLastTile = modelKeys[modelKeys.length - 1];
                let useSphere = true;
                const modelimagedistance = self._textureDistance || self._drawArg.getModelImageDistance() || UDEF.MODEL_IMAGE_UPDATE_DISTANCE;
                let key;
                let tileFind;
                /** @type {any} */
                let group;
                for (let i = 0; i < keys.length; i++) {
                    key = keys[i];
                    group = self.getCacheByKey(key);
                    if (!group || !group._useTexture) continue;
                    tileFind = drawArg.getTile(key, UDEF.TILE_TYPE.MODEL);
                    if (defined(tileFind) && !tileFind._disposed) {
                        if ((/** @type {import('@UDrawArg').UDrawArg} */(self._drawArg)).intersectsBox(tileFind._boundingbox) &&
                            !self.isTileDisposed(tileFind, drawArg) &&
                            (tileFind.distanceToCameraPosition(useSphere) <= modelimagedistance) && !defined(self._tileBufferMap[tileFind._key])) {
                            self._tileBuffer.enqueue(tileFind);
                            self._tileBufferMap[tileFind._key] = tileFind;
                        }
                    }
                }
            }
        }
        self._checkUpdateTime.updateTime(10);

        if (defined(self._tileBuffer) && self._tileBuffer._length > 0) {
            if (self._checkUpdateImage.isUpdate()) {
                UDEF.createPromise(async function (resolve, reject) {
                    for (let i = 0; i < MAX_COUNT; i++) {
                        await Yield();
                        if (self._updateCount >= MAX_COUNT) {
                            break;
                        }
                        if (self._tileBuffer._length === 0) break;
                        const tile = self._tileBuffer.dequeue();

                        if (!self.isTileDisposed(tile, drawArg) || drawArg.intersectsBox(tile._boundingbox)) {
                            self._updateCount++;
                            UDEF.createPromise(function (inResolve) {
                                self.updateDetailByFrustum(tile, undefined, curTime, inResolve);
                            }).finally(function () {
                                delete self._tileBufferMap[tile._key];
                                self._updateCount--;
                            });
                        } else {
                            delete self._tileBufferMap[tile._key];
                            i--;
                        }
                    }
                    resolve();
                });
            }
            self._checkUpdateImage.updateTime(5);
        }
    }

    /**
     * 절두체 기준 타일 상세 업데이트 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [opt]
     * @param {boolean | number} [curTime] 현재 시간 또는 force 플래그
     * @param {any} [resolve] resolve 콜백 (.call() 동적 호출 패턴)
     * @returns {any}
     *
     * @ignore
     */
    updateDetailByFrustum(tile, opt, curTime, resolve) {
        const self = this;
        try {
            if (!defined(tile) || self.isTileDisposed(tile, tile._drawArg)) {
                if (defined(resolve)) resolve.call();
                return undefined;
            }

            if (!U3dModelLayer.prototype.updateDetailByFrustum.call(this, tile, opt)) {
                if (defined(resolve)) resolve.call();
                return undefined;
            }

            const group = /** @type {ModelMesh} */(self.getCache(tile));
            if (!defined(group)) {
                if (defined(resolve)) resolve.call();
                return;
            }

            const drawArg = tile._drawArg;
            if (!defined(drawArg)) {
                if (defined(resolve)) resolve.call();
                return;
            }

            if (!defined(group.children) || group.children.length === 0) {
                if (defined(resolve)) resolve.call();
                return;
            }

            //  requestAnimationFrame(function() {
            drawArg.getCameraPosition(CAMERA_POSITION, (/** @type {import('@U3dApp').U3dApp} */(self._app)).getModelUpdateOffset());
            let modelimagedistance = (self._textureDistance || drawArg.getModelImageDistance());
            let defaultImageLevel = tile._drawArg.getModelImageDefaultLevel();
            let meshes = /** @type {Array<ModelMesh>} */(group.children);

            // 타일 주변 거리와 품질 설정으로 이번 갱신의 이미지 선택 상태를 준비합니다.
            const selection = INTERNAL.createImageSelection(tile, CAMERA_POSITION, modelimagedistance, defaultImageLevel);
            let modellevel = 0;
            let mesh;
            let isChangeColor
            let meshChild;
            let meshColor;
            let changeColor;
            for (let i = 0; i < meshes.length; i++) {
                mesh = meshes[i];
                // 선택 결과만 사용하며 텍스처 작업 예약과 완료 콜백은 아래 공개 흐름에서 유지합니다.
                modellevel = INTERNAL.selectModelImageLevel(this, mesh, selection);

                //+ 첨이거나 이미지레벨과 다를때
                isChangeColor = false;
                if (defined(self._meshColor)) {
                    if (mesh instanceof USharedMesh && mesh.children.length > 0) {
                        let meshChildren = /** @type {Array<ModelMesh>} */(mesh.children);
                        for (let j = 0; j < meshChildren.length; j++) {
                            meshChild = meshChildren[j];
                            meshColor = meshChild.material.color.getHexString();
                            changeColor = self._meshColor.split('#')[0];
                            if (defined(changeColor) && !meshColor.equalIgnoreCase(changeColor)) {
                                self.setMaterial(meshChild.material);
                            } else {
                                changeColor = self._meshColor.split('x')[1];
                                if (defined(changeColor) && !meshColor.equalIgnoreCase(changeColor)) {
                                    self.setMaterial(meshChild.material);
                                }
                            }
                        }
                    } else {
                        let meshColor = mesh.material.color.getHexString();
                        let changeColor = self._meshColor.split('#')[0];
                        if (defined(changeColor) && !meshColor.equalIgnoreCase(changeColor)) {
                            isChangeColor = true;
                        } else {
                            changeColor = self._meshColor.split('x')[1];
                            if (defined(changeColor) && !meshColor.equalIgnoreCase(changeColor)) {
                                isChangeColor = true;
                            }
                        }
                    }
                }

                if (modellevel !== mesh._curImagelevel && mesh._changingTexture === false)
                    processChangeTexture(self, mesh, modellevel, tile, false, resolve);
                else {
                    if (defined(resolve)) resolve.call();
                }
                if (isChangeColor)
                    self.setMaterial(mesh.material);
            }
        } catch (e) {
            if (defined(resolve)) resolve.call();
        }
        return undefined;
    }

    /**
     * 입력받은 타일에 속한 모델을 레이어 위에 생성합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @returns {boolean | Promise<unknown> | undefined}
     *
     * @ignore
     */
    createModel(tile) {
        if (this._minlevel > tile._rlevel || this._maxlevel < tile._rlevel) {
            this.resetStateTile(tile);
            return undefined;
        }

        const self = this;
        return /** @type {boolean | Promise<unknown> | undefined} */(self.createModelByFrustum(tile, self._drawArg));

    }

    /**
     * 타일을 씬에 추가합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    addTileFromScene(tile) {
        const self = this;
        const object = /** @type {ModelMesh} */(U3dModelLayer.prototype.addTileFromScene.call(self, tile));
        if (object && object._refine && object._refine === UDEF.TILE_REFINE.REPLACE) {
            if (self._refineCache[UDEF.TILE_REFINE.ADD][tile._key]) {
                for (let refineRange of self._refineCache[UDEF.TILE_REFINE.ADD][tile._key]) {
                    refineRange.materialIndex = 0;
                }
            }
        }
    }

    /**
     * 타일을 씬에서 제거합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    removeTileFromScene(tile) {
        const self = this;
        const object = /** @type {ModelMesh} */(U3dModelLayer.prototype.removeTileFromScene.call(self, tile));
        if (object && object._refine && object._refine === UDEF.TILE_REFINE.REPLACE) {
            if (self._refineCache[UDEF.TILE_REFINE.ADD][tile._key]) {
                for (let refineRange of self._refineCache[UDEF.TILE_REFINE.ADD][tile._key]) {
                    refineRange.materialIndex = refineRange.originIndex;
                }
            }
        }
    }

    /**
     * 절두체 기준 모델 생성 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {boolean} [force]
     * @returns {any}
     *
     * @ignore
     */
    createModelByFrustum(tile, drawArg, force) {
        if (!U3dModelLayer.prototype.createModelByFrustum.call(this, tile, drawArg)) {
            return undefined;
        }
        const self = this;

        //+ 재시작
        if (self.getStateTile(tile) === UDEF.TILE_STATE._failed) {
            self.setStateTile(tile, /** @type {any} */(undefined));
        }

        if (self.getStateTile(tile) === UDEF.TILE_STATE._loading) {
            return undefined;
        }
        self.setStateTile(tile, UDEF.TILE_STATE._loading);

        const gcenter = tile._rectangle3d.centerMap();
        const baseurl = UMathEngine.createUrl3DF(gcenter.x
            , gcenter.y
            , self._proxyurl + self._baseUrl
            , tile._rlevel
            , self._reverseX
            , self._reverseY
        );

        //+ 전체 로딩
        const vlevel = ALL_MODEL_LEVEL;

        const endPromise = deferred();
        if (defined((/** @type {import('@union3d/core/UCache').UCache} */(self._cache)).get(tile._key))) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            endPromise.resolve(false);
            return endPromise;
        }
        //+ u3m load ///////////////////////////
        const tilepromise = self.getTileInfo(tile, tile._x, tile._y, tile._rlevel, baseurl + 'info.u3m');

        tilepromise.then(function (/** @type {{objects: Array<unknown>, levels: Array<number>}} */ results) {
            if (self.isTileDisposed(tile, drawArg)) {
                self.resetStateTile(tile);
                endTileWork(self, tile, [disposeU3FModel], true);
                endPromise.resolve(false);
                return;
            }

            if (!defined(results) || !defined(results.levels)) {
                self.resetStateTile(tile);
                endPromise.resolve(false);
                return;
            }

            const key = (/** @type {import('@union3d/core/UCache').UCache} */(self._cache)).createKeyByTile(tile);
            if (!defined((/** @type {import('@union3d/core/UCache').UCache} */(self._cache)).get(key))) {
                self.createGroupByKey(key);
            }
            self.setStateTile(tile, UDEF.TILE_STATE._end);

            if (self._makeU3FPackage === UDEF.PACKAGED_MODEL) {
                let modelurl = baseurl + self._packageIndex + self._ext + self._packageName;
                if (self._compressModel)
                    modelurl = modelurl + self._compressExt;
                if (self._cacheModeles.get(modelurl)) {
                    endPromise.resolve(true);
                    return endPromise;
                }

                if (!self._modelUrlMap[tile._key])
                    self._modelUrlMap[tile._key] = [];

                self._modelUrlMap[tile._key].push(modelurl); // abort를 하기위해 작업 시작시 기록한다.

                const workPromise = deferred();
                workPromise.finally(() => {
                    delete self._modelUrlMap[tile._key];  // abort를 하기위해 작업 시작시 기록한 작업을 지운다.
                })

                const opt = {
                    self: self
                    , baseurl: baseurl
                    , tile: tile
                    , i: self._packageIndex
                    , max: self._packageIndex
                    , modelurl: modelurl
                    , drawArg: drawArg
                    , endPromise: workPromise
                    , tileInfo: results
                };

                const work = new U3dQuadTileWork({
                    message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
                    , selector: self
                    , callback: modelProcess
                    , parameter: opt
                    , tile: tile
                    , object: undefined
                    , cancel: workPromise.resolve
                    , filter: function () {
                        return !self.isTileDisposed(tile, tile._drawArg);
                    }
                });

                self.addWork(work);

            } else {
                const minmax = INTERNAL.getModelIndexToLevel(vlevel, results);
                const max = minmax[1];
                for (let i = 0; i < max; i++) {
                    let modelurl = baseurl + i + self._ext;
                    if (self._compressModel)
                        modelurl = modelurl + self._compressExt;
                    if (self._cacheModeles.get(modelurl)) {
                        continue;
                    }

                    if (!self._modelUrlMap[tile._key])
                        self._modelUrlMap[tile._key] = [];

                    self._modelUrlMap[tile._key].push(modelurl); // abort를 하기위해 작업 시작시 기록한다.

                    const workPromise = deferred();

                    workPromise.finally(() => { // abort를 하기위해 작업 시작시 기록한 작업을 지운다.
                        if (self._modelUrlMap[tile._key]) {
                            for (let i = 0; i < self._modelUrlMap[tile._key].length; i++) {
                                if (self._modelUrlMap[tile._key][i] === modelurl) {
                                    self._modelUrlMap[tile._key].splice(i, 1);
                                    break;
                                }
                            }

                            if (self._modelUrlMap[tile._key].length === 0)
                                delete self._modelUrlMap[tile._key];
                        }
                    })

                    const opt = {
                        self: self
                        , baseurl: baseurl
                        , tile: tile
                        , i: i
                        , max: max
                        , modelurl: modelurl
                        , drawArg: drawArg
                        , endPromise: workPromise
                        , tileInfo: results
                    };

                    const work = new U3dQuadTileWork({
                        message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
                        , selector: self
                        , callback: modelProcess
                        , parameter: opt
                        , tile: tile
                        , object: undefined
                        , cancel: workPromise.resolve
                        , filter: function () {
                            return !self.isTileDisposed(tile, tile._drawArg);
                        }
                    });
                    self.addWork(work);
                }
            }
            //+ 완료
            endPromise.resolve(true);
            return;
        }).catch(function () {
            self.resetStateTile(tile);
            endPromise.reject(false);
        })

        return endPromise;
    }

    /**
     * 블록 단위로 모델을 로드합니다.
     *
     * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
     * @param {string} baseurl
     * @param {number} startindex
     * @param {number} endindex
     * @param {number} blocksize
     * @param {number} max
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {DeferredObject<boolean>} endPromise
     *
     * @ignore
     */
    loadBlockModel(
        self
        , baseurl
        , startindex
        , endindex
        , blocksize
        , max
        , tile
        , drawArg
        , endPromise) {
        //  var promises = [];
        //   var end      = false;
        for (let i = startindex; i < endindex; i++) {
            if (i === max) {
                //  self._drawArg.addQueueDrawModel({type: UDEF.LAYER_TYPE.MODEL});
                //+ 이미지 업뎃여부
                //  self.addTileBuffer(tile);
                endPromise.resolve(true);
                break;
            }

            if (self.isTileDisposed(tile, drawArg)) {
                self.resetStateTile(tile);
                endTileWork(self, tile, [disposeU3FModel], true);
                endPromise.resolve(false);
                return;
            }

            let modelurl = baseurl + i + self._ext;
            let opt = {
                self: self
                , baseurl: baseurl
                , startindex: startindex
                , endindex: endindex
                , blocksize: blocksize
                , tile: tile
                , i: i
                , max: max
                , modelurl: modelurl
                , drawArg: drawArg
                , endPromise: endPromise
            };

            let work = new U3dQuadTileWork({
                message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
                , selector: self
                , callback: modelProcess
                , parameter: opt
                , tile: tile
                , object: undefined
                , filter: function () {
                    if (self.isTileDisposed(tile, tile._drawArg))
                        return false;

                    return true;
                }
            });

            self.addWork(work)
        }
    }

    /**
     * 메쉬 색상을 설정합니다.
     *
     * @param {string | number} color
     *
     * @ignore
     */
    setMeshColor(color) {
        const self = this;
        if (!defined(color))
            return;

        self._meshColor = /** @type {string} */(color);
        let drawArg = /** @type {import('@UDrawArg').UDrawArg} */(self._drawArg);
        let keys = /** @type {Array<string>} */(self.getCacheKeys());
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let tileFind = drawArg.getTile(key, UDEF.TILE_TYPE.MODEL);
            if (defined(tileFind) && !tileFind._disposed) {
                if (!self.isTileDisposed(tileFind, drawArg) || drawArg.intersectsBox(tileFind._boundingbox)) {
                    self.updateDetailByFrustum(tileFind);
                }
            }
        }
    }

    /**
     * 면 단위로 메쉬를 분할하여 병합합니다.
     *
     * @override
     *
     * @param {ModelMesh} mesh
     * @param {number | function(import('three').Object3D, import('@UDrawArg').UDrawArg): void} [faceIndex] faceIndex 또는 afterFunction
     * @param {function(import('three').Object3D, import('@UDrawArg').UDrawArg, string): void} [onAfterFunction]
     * @returns {any}
     *
     * @ignore
     */
    mergedMeshDivision(mesh, faceIndex, onAfterFunction) {
        const self = this;
        if (!defined(faceIndex) || typeof faceIndex === 'function') {
            const afterFunction = typeof faceIndex === 'function'
                ? /** @type {(mesh: import('three').Object3D, drawArg: import('@UDrawArg').UDrawArg) => void} */(faceIndex)
                : undefined;
            return U3dModelLayer.prototype.mergedMeshDivision.call(self, mesh, afterFunction);
        } else {
            const info = self.divisionMeshFromFace(mesh, faceIndex);
            (/** @type {any} */(self)).addFaceIndexInfo(mesh, info, faceIndex, onAfterFunction)
            return mesh;
        }
    }

    /**
     * 키에 해당하는 모델에 픽 재질을 설정합니다.
     *
     * @param {string} key
     * @param {string | number} color
     * @param {number} opacity
     * @param {string} meshId
     * @param {boolean} [isSetOutline=false]
     * @returns {Array<ModelMesh> | void}
     *
     * @ignore
     */
    setPickMaterial(key, color, opacity, meshId, isSetOutline = false) {
        const self = this;
        if (!self._refineCache[UDEF.TILE_REFINE.ADD] || !self._refineCache[UDEF.TILE_REFINE.ADD][key]) return;
        const list = self._refineCache[UDEF.TILE_REFINE.ADD][key];
        let groupList = [];
        /** @type {any} */
        let composedInfo;
        /** @type {Array<string>} */
        let gidList = [];
        for (let i = 0; i < list.length; i++) {
            const refine = list[i];
            const gid = refine.gid;
            if (gidList.includes(gid)) continue;
            gidList.push(gid);
            const composedInfos = self._composedCache[gid];
            if (composedInfos) {
                composedInfo = [];
                for (let j = 0; j < composedInfos.length; j++) {
                    if (composedInfos[j].id === meshId) {
                        composedInfos[j].color = color;
                        composedInfos[j].opacity = opacity;
                        const index = composedInfo.findIndex(function (/** @type {U3dModelU3FLayerComposedInfo} */ info) {
                            return info.id === meshId
                        })
                        if (index === -1) {
                            composedInfo.push(composedInfos[j]);
                        }
                    }
                }
            }
            if (composedInfo.length > 0 && self._group.children.length > 0) {
                const group = self._group.children.find(child => {
                    return child.uuid === gid
                })
                if (group) {
                    groupList.push({
                        group: group,
                        composedInfo: composedInfo
                    });
                }

            }
        }

        if (groupList.length > 0) {
            /** @type {Array<ModelMesh>} */
            let resultList = [];
            groupList.forEach(function (result) {
                const group = result.group;
                const composedInfo = result.composedInfo;
                group.traverse(function (/** @type {ModelMesh} */ mesh) {
                    if (mesh.isMesh && !(mesh instanceof USharedMesh)) {
                        if (isSetOutline) {
                            resultList.push(mesh)
                        }
                        self.applyPickMaterial(mesh, group, composedInfo, isSetOutline);
                    }
                })
            })
            return resultList;
        }

    }

    /**
     * 재질 인덱스를 제거합니다.
     *
     * @override
     *
     * @param {ModelMesh} object
     * @param {number} materialIndex
     * @returns {any}
     *
     * @ignore
     */
    removeMaterialIndex(object, materialIndex) {
        const self = this;
        let tileKeyList = [];

        if (object.geometry && object.geometry.groups.length > 0) {
            const groupInfo = object.geometry.groups.find(function (/** @type {KeyValue} */ groupInfo) {
                return groupInfo.originIndex === materialIndex
            })
            const info = self.getEditedEventById(object.getUid());
            let tilekey = object._preTile;
            if (info && info.editData['materialColor'])
                tilekey = info.editData['materialColor'].tileMaxKey
            if (groupInfo && groupInfo.tileMaxKey)
                tilekey = groupInfo.tileMaxKey
            if (!tilekey) return;
            tileKeyList.push(tilekey);
        } else {
            const editInfo = self.getEditedEventById(object.getUid());
            if (editInfo && editInfo.editData && editInfo.editData.materialSplit) {
                const materialSplit = editInfo.editData.materialSplit;
                materialSplit.forEach((value) => {
                    tileKeyList.push(value.tileMaxKey);
                })
            } else if (object._preTile) {
                tileKeyList.push(object._preTile)
            }
        }

        if (tileKeyList.length === 0) return false;
        // 2. Material 제거
        let removed = false;
        tileKeyList.forEach(tileKey => {
            const cache = self.getRefineCache(UDEF.TILE_REFINE.ADD, tileKey) || [];
            for (let i = 0; i < cache.length; i++) {
                const refineRange = cache[i];
                if (refineRange.isDivided) {
                    const group_ = self._group.children.find(function (child) {
                        return child.uuid === refineRange.gid;
                    })
                    if (!group_) continue;
                    const childMesh = /** @type {ModelMesh} */(self.getModelById(refineRange.childMeshId, false));
                    if (childMesh) {
                        resetMaterialColor(childMesh.material);
                        const childParent = /** @type {ModelMesh} */(childMesh.parent);
                        if (childParent && childParent._isComposed) {
                            childParent.material.forEach((/** @type {ModelMaterial} */ parentMaterial) => {
                                resetMaterialColor(parentMaterial);
                            })
                        }
                    }
                    const composedInfo = /** @type {U3dModelU3FLayerComposedInfo | undefined} */(self.getComposedInfo(refineRange.gid, refineRange.childMeshId));
                    if (composedInfo) {
                        delete composedInfo.color;
                        delete composedInfo.opacity;
                    }
                    group_.traverse(function (/** @type {ModelMesh} */ mesh) {
                        if (mesh.isMesh && !(mesh instanceof USharedMesh)) {
                            if (mesh.material[refineRange.originIndex]) {
                                const material = mesh.material[refineRange.originIndex];
                                resetMaterialColor(material);
                                mesh.setManualUpdate();
                                if (!defined(materialIndex)) {
                                    mesh._pickMaterials = mesh._pickMaterials || [];
                                    const idx = mesh._pickMaterials.indexOf(refineRange.originIndex);
                                    mesh._pickMaterials.splice(idx, 1);
                                    const meshId = mesh.getUid();
                                    const editInfo = self.getEditedEventById(meshId);
                                    if (editInfo) {
                                        if (editInfo.editData) {
                                            delete editInfo.editData['materialSplit']
                                            delete editInfo.editData['materialColor']
                                            if (Object.values(editInfo.editData).length === 0) {
                                                delete self.editedEvent[meshId];
                                                const ldx = self.editedList.indexOf(meshId);
                                                self.editedList.splice(ldx, 1);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    })
                    removed = true;
                    const id = refineRange.childMeshId;
                    const editInfo = self.getEditedEventById(id);
                    if (editInfo) {
                        if (editInfo.isSetColor) {
                            delete editInfo.isSetColor;
                            delete editInfo.color;
                            delete editInfo.opacity;
                            delete editInfo.exceptTexture;
                        }

                        if (editInfo.editData) {
                            delete editInfo.editData['materialSplit']
                            delete editInfo.editData['materialColor']
                            if (Object.values(editInfo.editData).length === 0) {
                                delete self.editedEvent[id];
                                const ldx = self.editedList.indexOf(id);
                                self.editedList.splice(ldx, 1);
                            }
                        }
                    }
                    delete refineRange.isDivided
                    delete refineRange.childMeshId
                }
            }
        })
        if (defined(materialIndex)) {
            removed = U3dModelLayer.prototype.removeMaterialIndex.call(self, object, materialIndex);
        }

        return removed;
    }

    /**
     * 메쉬의 바운딩 박스 정보를 구합니다.
     *
     * @param {ModelMesh} mesh
     * @returns {Array<{id: string, info: object}> | void}
     *
     * @ignore
     */
    getBoundingBoxInfo(mesh) {
        if (!mesh || !Array.isArray(mesh.material)) return;
        const self = this;
        const composedInfo = self._composedCache;
        const groups = mesh.geometry.groups;
        /** @type {Array<string>} */
        const gidList = []
        const groupList = [];
        if (groups.length > 0) {
            for (let i = 0; i < groups.length; i++) {
                const info = groups[i];
                if (!gidList.includes(info.gid) && info.materialIndex !== 0) {
                    gidList.push(info.gid);
                }
            }
        }

        if (gidList.length > 0) {
            for (let i = 0; i < gidList.length; i++) {
                const gid = gidList[i];
                if (composedInfo[gid]) {
                    const info = composedInfo[gid];
                    for (let j = 0; j < info.length; j++) {
                        const group = info[j];
                        groupList.push({
                            id: group.id,
                            info: group
                        })
                    }
                }
            }
        }
        return groupList

    }

    /**
     * 결합 그룹에서 지정 모델의 편집 정보를 찾습니다. <br>
     * 반환값은 저장된 정보의 원본 참조입니다.
     *
     * @param {string} gid 결합 그룹 식별자
     * @param {string} childId 찾을 모델 식별자
     * @returns {U3dModelU3FLayerComposedInfo | undefined} 해당 모델의 편집 정보, 그룹이나 모델을 찾지 못하면 undefined
     */
    getComposedInfo(gid, childId) {
        const self = this;
        if (!gid || !childId) return;
        if (!self._composedCache[gid]) return;
        return self._composedCache[gid].find(function (/** @type {U3dModelU3FLayerComposedInfo} */ info) {
            return info.id === childId;
        });
    }

    /**
     * 레이어의 영역(Rectangle)과 Box3 를 계산합니다.
     *
     * @ignore
     */
    computeRectangle() {
        if (!defined(this._boundingBox)) {
            U3dMessage.error(this._classtype, U3dMessage.CNT.CMM.NON_BBOX, '3615063');
            return;
        }

        const boundingBox = /** @type {{minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}>} */(this._boundingBox);
        this._rectangle = UMathEngine.createUGeoRect(
            boundingBox.minx,
            boundingBox.miny,
            boundingBox.maxx,
            boundingBox.maxy,
            Math.abs(boundingBox.maxx - boundingBox.minx),
            Math.abs(boundingBox.maxy - boundingBox.miny),
            UDEF.GOOGLE
        );
        this._rectangle3d = this._rectangle;

        if (!defined(this._box3) || !this._box3.isBox3)
            this._box3 = new THREE.Box3();

        this._box3.min.set(boundingBox.minx, boundingBox.miny,/** @type {number} */(boundingBox.minz));
        this._box3.max.set(boundingBox.maxx, boundingBox.maxy,/** @type {number} */(boundingBox.maxz));
    }

    /*
               u3f 이미지 크기순 -> 배열은 역순으로 들어가 있다 []괄호 참조
                *.jpg(원본)[2], *_1.jpg(원본/2)[1], *_2.jpg(원본/4)[0] .. etc
                */

    /**
     * 편집된 텍스처를 타일에 적용합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} level 모델 레벨
     *
     * @ignore
     */
    applyEditedTextures(tile, level) {
        const self = this;
        if (!self.editedList?.length) return;

        const meshes = /** @type {Array<ModelMesh>} */(self.getCache(tile)?.children || []);

        const mergedSet = new Set(); // 병합 Mesh (중복 제거)
        const sharedGroups = [];       // 비병합(shared) 그룹

        for (const container of meshes) {
            const children = /** @type {Array<ModelMesh>} */(container.children);
            if (!children?.length) continue;

            const isEdited = children.some(ch =>
                self.editFilter(ch.userData.id) ||
                self.editFilter(ch.userData.oid) ||
                self.editFilter(ch.getUid())
            );
            if (!isEdited) continue;

            for (const child of children) {
                if (!child?._opt || child._isComposed || child._changingTexture) continue;
                if (!child._uImageUrls?.length && child._opt.images?.length) {
                    child._uImageUrls = child._opt.images.map((/** @type {KeyValue} */ img) => `${img.baseurl}/${img.name}`);
                }
            }

            if (!children[0]._isMerged) {
                sharedGroups.push(children);
            }
            children.forEach(child => {
                if (child._isMerged) mergedSet.add(child);
            });
        }

        // 첫 자식이 휴면일 수도 있다. 갱신이 필요한 사용 중 모델이 그룹의 요청을 대표한다.
        for (const group of sharedGroups) {
            if (group.some(child => child._changingTexture)) continue;
            const child = group.find(child => !child._disposed && !child._sleeping && child._curImagelevel !== level);
            if (child) {
                child.changeSharedTextureImage(level, group);
            }
        }

        // Mesh 단위로 1회만 호출
        mergedSet.forEach((/** @type {ModelMesh} */ mesh) => {
            if (!mesh._disposed && !mesh._sleeping && mesh._curImagelevel !== level) {
                mesh.changeTextureImage(level);
            }
        });
    }

    /**
     * 썸네일 raw 이미지로부터 텍스처를 생성합니다.
     *
     * @param {string | ArrayBuffer} thumbimage 썸네일 이미지 데이터
     * @param {any} promise 완료 promise 객체
     *
     * @ignore
     */
    createTextureFromImageRaw(thumbimage, promise) {
        const self = this;
        if (defined(thumbimage)) {
            self._textureLoader.load(thumbimage,
                function (/** @type {import('three').Texture} */ texture) {
                    if ((/** @type {import('@U3dApp').U3dApp} */(self._app)).getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none']) {
                        UDEF.setTextureImprovement(texture, (/** @type {import('@U3dApp').U3dApp} */(self._app))._renderer);
                    } else {
                        UDEF.noResizeTexture(texture);
                    }

                    if (defined(promise))
                        promise.resolve(texture);
                },
                undefined,
                function () {
                    if (defined(promise)) {
                        promise.reject();
                    }
                });
        } else {
            if (defined(promise))
                promise.resolve();
        }
    }

    /**
     * 머터리얼에 기본 색상/텍스처/스타일을 설정합니다.
     *
     * @param {ModelMaterial} material 머터리얼
     * @param {import('three').Texture} [texture] 재질에 적용할 단일 텍스처
     *
     * @ignore
     */
    setMaterial(material, texture) {
        const self = this;
        self.settingModelLayerMaterial(material);

        const style = self._style;

        if (style) {
            setMaterialStyle(material, style);
        } else {
            //건물의 누런 색감을 없에기 위해 파란 색감을 조금 더한다.
            const DEFAULT_COLOR = defined(self._meshColor) ? self._meshColor : 0xf9f9ff;
            material.color.set(DEFAULT_COLOR);
        }

        if (defined(texture)) {
            material.map = texture;
            //material.map.needsUpdate = true;
        }
    }

    /**
     * 파서의 복원 입력을 타일 그룹의 렌더링 메시로 생성합니다. <br>
     * 입력의 버퍼를 소비하며 공유 재질·타일 경계·편집 상태를 함께 갱신합니다. <br>
     * 타일 그룹·입력·렌더링 문맥이 없으면 생성하지 않습니다. <br>
     * 생성한 개별 메시마다 로드 이벤트를 발행하며 편집 분할로 중단한 경우에는 이후 메시를 생성하지 않습니다. <br>
     * 병합 대기 입력은 타일 정보에 등록하고 여기서는 메시를 반환하지 않습니다.
     *
     * @param {Array<U3FParsedObj>} objs 파서가 전달한 복원 입력
     * @param {import('three').Texture | Array<import('three').Texture> | undefined} texture 모델에 적용할 텍스처이며 배열은 ADD 병합 입력에서 사용
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 등록 대상 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 좌표 변환과 렌더링 문맥
     * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo 타일의 표시 방식과 병합 대기 상태
     * @returns {ModelMesh | undefined} 생성된 루트 메시, 생성하지 않았으면 undefined
     *
     * @ignore
     */
    createModelMesh(objs, texture, tile, drawArg, tileInfo) {
        const self = this;
        const group = /** @type {ModelMesh} */(self.getCache(/** @type {import('@U3dQuadTile').U3dQuadTile} */(tile)));

        if (!defined(group) || !defined(objs) || objs.length === 0 || !defined(drawArg)) {
            return;
        }

        // 복원 결과를 기존 타일 그룹에 등록하며 편집·가시화·이벤트는 공개 연결부를 그대로 사용합니다.
        return INTERNAL.restoreModelMeshes(self, objs, texture, tile, drawArg, tileInfo, group, MODEL_HOOKS, VALIDATION_MODE, VALIDATION_TARGET);
    }

    /**
     * 병합 대기 입력을 타일 그룹의 렌더링 메시로 복원합니다. <br>
     * 입력 버퍼를 소비하며 취소로 중단하면 남은 입력의 텍스처와 버퍼 참조를 정리합니다. <br>
     * 지원하지 않는 복원 입력은 오류로 거부됩니다.
     *
     * @param {Array<U3FParsedObj>} objs 병합 대기 입력
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 등록 대상 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 렌더링 문맥
     * @returns {Promise<ModelMesh | undefined>} 생성된 루트 메시, 중단되었으면 undefined
     *
     * @ignore
     */
    async mergeModelMesh(objs, tile, drawArg) {
        // 호출 시점의 공유 재질을 사용하고 병합 중단·해제·완료 이벤트 순서를 유지합니다.
        return INTERNAL.mergeModelMeshes(this, objs, tile, drawArg, U3dModelU3FLayer, MODEL_HOOKS);
    }

    /**
     * face 인덱스 기준으로 mesh 를 분할합니다.
     *
     * @param {ModelMesh} mesh 대상 mesh
     * @param {number} faceIndex face 인덱스
     * @returns {{materialIndex: number, composedInfo: U3dModelU3FLayerComposedInfo, tileMaxKey: string} | void} 분할 정보
     *
     * @ignore
     */
    divisionMeshFromFace(mesh, faceIndex) {
        const self = this;
        if (!mesh || !mesh.geometry) return;
        if (!defined(faceIndex)) return;
        const groups = mesh.geometry.groups;
        //group index 찾기
        const targetIndex = faceIndex * 3;
        let index = INTERNAL.getGroupsIndex(groups, targetIndex);
        if (defined(index)) {
            const groupInfo = groups[index];
            //결합된 정보 가져오기 (atomic info)
            const composedInfo = self._composedCache[groupInfo.gid];
            let groupsIndex, info;
            if (composedInfo && composedInfo.length > 0) {
                const composedLength = composedInfo.length;
                for (let i = 0; i < composedLength; i++) {
                    groupsIndex = self.setGroupsDivisionRefine(mesh, index, composedInfo[i], targetIndex);
                    if (defined(groupsIndex)) {
                        info = composedInfo[i];
                        break;
                    }
                }
            }
            if (defined(groupsIndex)) {
                mesh._pickMaterials = mesh._pickMaterials || [];
                return {
                    materialIndex: groupsIndex,
                    composedInfo: info,
                    tileMaxKey: groupInfo.tileMaxKey,
                };
            }
        }
    }

    /**
     * geometry group 분할 정보를 갱신합니다.
     *
     * @param {ModelMesh} mesh 대상 mesh
     * @param {number} index group 인덱스
     * @param {U3dModelU3FLayerComposedInfo} composedInfo 합성 메시 정보
     * @param {number} targetIndex 대상 머터리얼 인덱스
     * @returns {number | undefined} 적용한 재질 인덱스, 해당 범위가 없으면 undefined
     *
     * @ignore
     */
    setGroupsDivisionRefine(mesh, index, composedInfo, targetIndex) {
        // 편집 대상 범위만 분리하고 재질 및 복원 캐시를 함께 갱신합니다.
        return INTERNAL.setGroupsDivisionRefine(this, mesh, index, composedInfo, targetIndex);
    }

    /**
     * 합성 메시 정보 기준으로 pick 머터리얼을 적용합니다.
     *
     * @param {ModelMesh} mesh 대상 mesh
     * @param {import('three').Object3D} group group 객체
     * @param {Array<U3dModelU3FLayerComposedInfo>} composedInfo 합성 메시 정보
     * @param {boolean} [isSetOutline=false] 외곽선 설정 여부
     *
     * @ignore
     */
    applyPickMaterial(mesh, group, composedInfo, isSetOutline = false) {
        const self = this;
        if (!mesh || !group || !mesh.geometry) return;
        if (!composedInfo) return;
        mesh._pickMaterials = mesh._pickMaterials || [];
        const groups = mesh.geometry.groups;
        for (let i = 0; i < composedInfo.length; i++) {
            if (composedInfo[i].color) {
                const startIndex = Math.floor(composedInfo[i].start + composedInfo[i].count / 2);
                let index = INTERNAL.getGroupsIndex(groups, startIndex);
                if (!defined(index)) continue;
                let newMaterialIndex = self.setGroupsDivisionRefine(mesh, index, composedInfo[i], startIndex);
                if (defined(newMaterialIndex)) {
                    const info = {
                        materialIndex: newMaterialIndex,
                        composedInfo: composedInfo[i],
                        tileMaxKey: groups[index].tileMaxKey,
                    }
                    const material = mesh.material[newMaterialIndex];
                    if (material && !isSetOutline) {
                        setMaterialColor(material, composedInfo[i].color, composedInfo[i].opacity);
                    }
                    self.addFaceIndexInfo(mesh, info, Math.floor(startIndex / 3))
                }
            }
        }
    }

    /**
     * 합성 메시 정보 기준으로 pick 머터리얼을 설정합니다.
     *
     * @param {ModelMesh} mesh
     * @param {U3dModelU3FLayerComposedInfo} composedInfo 합성 메시 정보
     * @param {string | number | import('three').ColorRepresentation} color
     * @param {number} opacity
     * @param {boolean} [isSetColor=true]
     *
     * @ignore
     */
    setPickMaterialByComposedInfo(mesh, composedInfo, color, opacity, isSetColor = true) {
        const self = this;
        const groups = mesh.geometry.groups;

        const startIndex = Math.floor(composedInfo.start + composedInfo.count / 2);
        let index = INTERNAL.getGroupsIndex(groups, startIndex);
        if (!defined(index)) return;
        let newMaterialIndex = self.setGroupsDivisionRefine(mesh, index, composedInfo, startIndex);
        if (defined(newMaterialIndex)) {
            const info = {
                materialIndex: newMaterialIndex,
                composedInfo: composedInfo,
                tileMaxKey: groups[index].tileMaxKey,
            }
            const material = mesh.material[newMaterialIndex];
            if (material) {
                mesh._pickMaterials = mesh._pickMaterials || [];
                if (!mesh._pickMaterials.includes(newMaterialIndex))
                    mesh._pickMaterials.push(newMaterialIndex);
                if (isSetColor) {
                    setMaterialColor(material, color, opacity);
                    material.visible = false;
                }

                composedInfo.color = color;
                composedInfo.opacity = opacity;
            }
            const faceIndex_ = startIndex / 3;
            self.addFaceIndexInfo(mesh, info, Math.floor(faceIndex_))
        }

    }

    /**
     * refine 캐시를 조회합니다.
     *
     * @param {string} type refine 타입
     * @param {string} key 타일 키
     * @returns {Array<KeyValue> | void} refine 캐시
     *
     * @ignore
     */
    getRefineCache(type, key) {
        const self = this;
        const cache = self._refineCache[type]
        if (cache) {
            return cache[key];
        }

    }

    /**
     * meshInfo 의 유효성을 검증합니다.
     *
     * @param {Array<{id: string | number, oid: string | number}>} meshInfo mesh 정보 배열
     * @param {Array<string>} list 검증 대상 리스트
     * @param {ModelMesh} mesh 대상 mesh
     *
     * @ignore
     */
    validationMeshInfo(meshInfo, list, mesh) {
        // 기존 검사 API를 유지하며 모델 구조 검증만 비공개 구현에 맡깁니다.
        INTERNAL.validationMeshInfo(this, meshInfo, list, mesh);
    }
}

/**
 * U3F 모델 타일을 해제합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
 * @param {import('@U3dQuadTile').U3dQuadTile} tile
 *
 * @ignore
 */
function disposeU3FModel(self, tile) {
    self.disposeTile(tile);
    //   U3dModelLayer.prototype.disposeTile.call(self, tile);
    // self.disposeTile(tile);
    // if (defined(tile)) {
    //     var key = self.createKeyFromTile(tile);
    //
    //     for (var id in self._tileModelMap[key]) {
    //         self._modelIds[id] = undefined;
    //         delete self._modelIds[id]
    //     }
    //     self._tileModelMap[key] = undefined;
    //     delete self._tileModelMap[key];
    //
    //    U3dModelLayer.prototype.disposeTile.call(self, tile);
    // }
}

/**
 * 타일 작업 종료 시 콜백들을 실행합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
 * @param {import('@U3dQuadTile').U3dQuadTile} tile
 * @param {Array<(self: U3dModelU3FLayer, tile: import('@U3dQuadTile').U3dQuadTile) => void>} callbacks
 * @param {boolean} [force]
 *
 * @ignore
 */
function endTileWork(self, tile, callbacks, force) {
    if (defined(callbacks)) {
        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](self, tile);
        }
    }
}

/**
 * 모델 텍스처를 변경합니다.
 *
 * @param {KeyValue} opt
 * @returns {Promise<boolean> | null}
 *
 * @ignore
 */
function changeTexture(opt) {
    //console.info('changeTexture..');
    opt = opt || {};

    let self = opt.self;
    let mesh = opt.mesh;
    let modellevel = opt.modellevel;
    let tile = opt.tile;
    let updateResolve = opt.resolve;

    if (!defined(self) || !defined(mesh) || !defined(modellevel) || !defined(tile)) {
        if (defined(updateResolve)) updateResolve.call();
        return null;
    }

    if (mesh._disposed || mesh._sleeping || !defined(mesh.geometry)) {
        if (defined(updateResolve)) updateResolve.call();
        return null;
    }

    let drawArg = tile._drawArg;
    if (mesh._changingTexture === true) {
        if (defined(updateResolve)) updateResolve.call();
        return null;
    }

    if (mesh._ulayername === self._name) {
        if (mesh._curImagelevel !== modellevel && !mesh._changingTexture) {
            return UDEF.createPromise(function (rootResolve, rootReject) {
                let init = false;
                if (mesh._curImagelevel === -1) {
                    init = true;
                    mesh._initImage = true;
                }

                if (!defined(mesh._uImageUrls) || mesh._uImageUrls.length === 0) {
                    if (defined(updateResolve)) updateResolve.call();
                    rootReject(false);
                    return;
                }

                // 공개 품질 설정을 반영한 이미지 번호를 고른 뒤 기존 URL 검사와 로딩을 계속합니다.
                modellevel = INTERNAL.selectTextureLevel(self, mesh, modellevel, U3dModelU3FLayer);

                let url = mesh._uImageUrls[modellevel];
                if (!defined(url)) {
                    if (defined(updateResolve)) updateResolve.call();
                    rootReject(false);
                    return;
                }
                let group = self.getCache(tile);
                if (!defined(group)) {
                    if (defined(updateResolve)) updateResolve.call();
                    rootReject(false);
                    return;
                }

                // self.plusLoadingTile();
                mesh._changingTexture = true;
                const promise = self.getTexture(self, tile, url);
                if (defined(promise)) {
                    promise.then(function (/** @type {import('three').Texture} */ texture) {
                        UDEF.createPromise(function (resolve, reject) {
                            if (self.isTileDisposed(tile, drawArg)) {
                                mesh._changingTexture = false;
                                deleteTexture(texture);
                                resolve(false);
                                return;
                            }

                            if (mesh._disposed || mesh._sleeping) {
                                mesh._changingTexture = false;
                                deleteTexture(texture);
                                resolve(false);
                                return;
                            }

                            if (defined(mesh.material)) {
                                if (self._app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none']) {
                                    UDEF.setTextureImprovement(texture, self._app._renderer);
                                } else {
                                    UDEF.noResizeTexture(texture);
                                }

                                if (mesh instanceof USharedMesh)
                                    mesh.changeTextures(texture, init, {useboxhelper: self._useBoxHelper}, modellevel);
                                else {
                                    if (defined(mesh.material.map))
                                        mesh.material.map.dispose();

                                    mesh.material.map = texture;

                                    //+ update
                                    //    mesh.material.transparent = false;
                                    mesh.material.needsUpdate = true;
                                }

                                mesh._curImagelevel = modellevel;

                                if (self._useModelAndTexture && init)
                                    mesh.visible = true;

                                if (self.removedList.length > 0) {
                                    if (self.removeFilter(mesh.userData.id) || self.removeFilter(mesh.userData.oid)) {
                                        if (mesh._isMerged)
                                            mesh.visible = false;
                                    }
                                }

                                ////////////////////
                                self.applyEditedTextures(tile, modellevel);
                            }
                            resolve();
                        }).then(function () {
                            if (defined(updateResolve)) updateResolve.call();
                            rootResolve(true);
                            mesh._changingTexture = false;
                        }).catch(function () {
                            if (defined(updateResolve)) updateResolve.call();
                            mesh._changingTexture = false;
                            rootReject(false);
                        })
                    }).catch(function () {
                        if (defined(updateResolve)) updateResolve.call();
                        rootReject(false);
                        mesh._changingTexture = false;
                    })
                }
            }, true);
        }
    }
    return null;
}

/**
 * 모델 데이터를 로드하고 처리합니다.
 *
 * @param {KeyValue} opt
 *
 * @ignore
 */
function modelProcess(opt) {

    opt = opt || {};
    const self = opt.self;
    const baseurl = opt.baseurl;
    const tile = opt.tile;
    const index = opt.i;
    const modelurl = opt.modelurl;
    const drawArg = opt.drawArg;
    const endPromise = opt.endPromise;
    const tileInfo = opt.tileInfo;

    if (self.isTileDisposed(tile, tile._drawArg)) {
        endPromise.resolve(false);
        return endPromise;
    }

    if (tile.getParent() && !tile.getParent().updatePossible()) {
        endPromise.resolve(false);
        return endPromise;
    }

    if (!defined(self) || !defined(baseurl) || !defined(modelurl) || !defined(drawArg)) {
        endPromise.resolve(false);
        return endPromise;
    }

    const modelpromise = self.getModelInfo(tile, index, modelurl, baseurl, drawArg, tileInfo);
    if (!defined(modelpromise)) {
        endPromise.resolve(false);
        return endPromise;
    }
    modelpromise.then(function (/** @type {any} */ objects) {
        if (!defined(objects)) {
            U3dMessage.error(self._classtype, U3dMessage.CNT.CMM.NON_OBJECT_1, "6108255");
            endPromise.resolve(false);
            return endPromise;
        }
        let index = undefined;
        if (defined(objects[0])) {
            if (self._makeU3FPackage === UDEF.PACKAGED_MODEL) {
                index = objects[0][0].index;
            } else {
                index = objects[0].index;
            }
        }

        if (!Array.isArray(objects) || !defined(index)) {
            U3dMessage.error(self._classtype, U3dMessage.CNT.CMM.NON_OBJECT_1, "6108610");
            endPromise.resolve(false);
            return endPromise;
        }

        if (self.isTileDisposed(tile, tile._drawArg)) {
            self.disposeTile(tile);
            endPromise.resolve(false);
            return endPromise;
        }

        const object = self._cache.get(tile._key);

        if (object && object._refine) {
            if (object._refine === UDEF.TILE_REFINE.REPLACE) {
                if (self._refineCache[UDEF.TILE_REFINE.ADD][tile._key]) {
                    for (let refineRange of self._refineCache[UDEF.TILE_REFINE.ADD][tile._key]) {
                        refineRange.materialIndex = 0;
                        if (VALIDATION_MODE) {
                            VALIDATION_TARGET[tile._key] = VALIDATION_TARGET[tile._key] || [];
                            if (!VALIDATION_TARGET[tile._key].includes(refineRange.gid))
                                VALIDATION_TARGET[tile._key].push(refineRange.gid);
                        }
                    }
                }
                self._refineCache[UDEF.TILE_REFINE.REPLACE][tile._key] = true;
            }
        }

        //+ 건물 이미지 거리별 업뎃
        //  self._checkUpdateTime.updateTime();
        endPromise.resolve(true);

    }).catch(function () {
        //+ 실패시 상태완료하면 무한루프걸린다.
        endPromise.resolve(false);
    });

    if (!defined(modelpromise)) {
        endPromise.resolve(false);
        return endPromise;
    }

    return endPromise;
}

/**
 * 썸네일 raw 이미지 배열로부터 텍스처를 생성합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
 * @param {Array<any>} thumbimages
 * @param {any} promLast 완료 promise 객체
 * @returns {Promise<void>}
 *
 * @ignore
 */
async function createTextureFromImageRawArray(self, thumbimages, promLast) {
    UDEF.assert(defined(self._textureLoader)
        && defined(thumbimages)
        && Array.isArray(thumbimages)
        && (thumbimages.length > 0)
        && defined(promLast));

    if (IS_SERIAL) {
        let urlsTemp = thumbimages.slice();
        _LoadImageChainAsync(self, urlsTemp, promLast);
    } else {
        const promiseList = [];
        for (let thumbimage of thumbimages) {
            const promise = deferred();
            promiseList.push(promise);
            self.createTextureFromImageRaw(thumbimage, promise);
        }
        Promise.all(promiseList).then((/** @type {Array<unknown>} */ textures) => {
            if (!textures)
                promLast.reject();
            else if (textures.length === 1)
                promLast.resolve(textures[0]);
            else
                promLast.resolve(textures);
        }).catch(() => {
            promLast.reject();
        })
    }
}

/**
 * 이미지 URL 배열을 체인 방식으로 비동기 로드합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
 * @param {Array<string>} arrayUrl
 * @param {DeferredObject<import('three').Texture | Array<import('three').Texture>>} promLast
 * @param {string} [curUrl]
 * @param {Array<import('three').Texture>} [textures]
 *
 * @ignore
 */
function _LoadImageChainAsync(self, arrayUrl, promLast, curUrl, textures) {
    UDEF.assert(defined(self)
        && defined(arrayUrl)
        && Array.isArray(arrayUrl)
        && defined(promLast)
        && defined(self._textureLoader));

    if (!defined(curUrl))
        curUrl = arrayUrl.shift();

    if (!defined(textures))
        textures = [];

    let prom = self._textureLoader.loadAsync(/** @type {string} */(curUrl));
    prom.then((/** @type {import('three').Texture} */ texture) => {
        if ((/** @type {import('@U3dApp').U3dApp} */(self._app)).getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none']) {
            UDEF.setTextureImprovement(texture, (/** @type {import('@U3dApp').U3dApp} */(self._app))._renderer);
        } else {
            UDEF.noResizeTexture(texture);
        }

        textures.push(texture);

        if (arrayUrl.length == 0) {
            //+ chows
            //+ 텍스처가 한개이면 처리공정상 배열이 아닌 값으로 리턴한다. 중요
            if (textures.length == 1)
                promLast.resolve(textures[0]);
            else
                promLast.resolve(textures);
        }
        else {
            curUrl = arrayUrl.shift();
            _LoadImageChainAsync(self, arrayUrl, promLast, curUrl, textures);
        }
    })
        .catch((/** @type {unknown} */ e) => {
            console.info(e);
            promLast.reject();
            textures.forEach((/** @type {import('three').Texture} */ tex) => {
                tex.dispose();
            });
        })
}

/**
 * 텍스처를 해제합니다.
 *
 * @param {import('three').Texture | Array<import('three').Texture> | undefined} texture 해제할 텍스처 입력
 *
 * @ignore
 */
function deleteTexture(texture) {
    if (!defined(texture))
        return;

    if (texture instanceof Array) {
        for (let item of texture) {
            item.dispose();
        }
    } else {
        texture.dispose();
    }

}

/**
 * 머터리얼에 스타일을 적용합니다.
 *
 * @param {ModelMaterial} material
 * @param {any} style 스타일 객체 (color, emissive 등)
 *
 * @ignore
 */
function setMaterialStyle(material, style) {
    if (!material || !(material.isMaterial)) return;
    if (!style || Object.values(style).length === 0) return;

    const color = style.color;
    if (color)
        material?.color.set(color);

    const emissive = style.emissive;
    if (emissive)
        material?.emissive?.set(emissive, emissive, emissive);

    //추가 속성
}

/**
 * obj 데이터를 메쉬로 변환합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
 * @param {any} objs 파서 결과 (코드 본문에서 단일/배열 모순 사용)
 * @param {import('@U3dQuadTile').U3dQuadTile} tile
 * @param {import('@UDrawArg').UDrawArg} drawArg
 * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo
 * @returns {Promise<Array<U3FParsedObj>> | undefined}
 *
 * @ignore
 */
function convertObj2Mesh(self, objs, tile, drawArg, tileInfo) {
    if (!defined(objs) || !defined(drawArg)) {
        throw new Error('objs or drawArg is null!');
        return;
    }
    return UDEF.createPromise(function (resolve, reject) {
        if (!tile || self.isTileDisposed(tile, tile._drawArg)) {
            self.disposeTile(tile);
            reject(true);
            return;
        }

        let scene = drawArg._scene;
        if (!defined(scene)) {
            U3dMessage.error(self._classtype, 'scene is null!', '6144982');
            reject(true);
            return;
        }
        let group = self.getCache(tile);
        if (!defined(group)) {
            reject(true);
            return;
        }
        // 복원 입력의 위치 정보 유무만 확인하고 입력 구조 해석은 분리합니다.
        if (INTERNAL.isMissingModelCenter(objs)) {
            U3dMessage.info(self._classtype, '객체 중심점 정보가 없습니다.', '7145460');
            reject(true);
            return;
        }
        let key = /** @type {string} */(self.createKeyFromTile(tile));
        self._tileModelMap[key] = self._tileModelMap[key] || {};
        let grouping = true;

        UDEF.createPromise(function (imageResolve, imageReject) {
            // 이미지가 없는 입력의 즉시 완료와 이미지 선택 방식은 기존 계약을 유지합니다.
            if (INTERNAL.hasNoModelImages(objs)) {
                imageResolve();
                return;
            }
            if (grouping && self._useTexture) {

                //+ thumb 이미지 넣기
                if (!defined(INTERNAL.getModelPreview(objs))) {
                    imageResolve();
                    return;
                }

                if (Array.isArray(INTERNAL.getModelPreview(objs))) {
                    // 바로 앞에서 확인한 파서 입력의 배열 형태를 전달하며 원래 조회 시점은 유지합니다.
                    createTextureFromImageRawArray.call(self, self, /** @type {Array<string | ArrayBuffer>} */(INTERNAL.getModelPreview(objs)), {
                        resolve: imageResolve,
                        reject: imageReject
                    });
                }
                else {
                    self.createTextureFromImageRaw(/** @type {string | ArrayBuffer} */(INTERNAL.getModelPreview(objs)), {
                        resolve: imageResolve,
                        reject: imageReject
                    });

                }
            }
        }).then(function (/** @type {import('three').Texture} */ texture) {
            if (self.isTileDisposed(tile, tile._drawArg)) {
                self.disposeTile(tile);
                deleteTexture(texture);
                reject(true);
                return;
            }

            key = /** @type {string} */(self.createKeyFromTile(tile));
            self._tileModelMap[key] = self._tileModelMap[key] || {};
            self.createModelMesh(objs, texture, tile, drawArg, tileInfo);
            resolve(objs);
        }).catch(function () {
            reject(true);
        });
    });
}

/**
 * 텍스처 변경 작업을 처리합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
 * @param {ModelMesh} mesh
 * @param {number} modellevel
 * @param {import('@U3dQuadTile').U3dQuadTile} tile
 * @param {boolean} force3
 * @param {any} [resolve] resolve 콜백 (.call() 동적 호출 패턴)
 * @returns {boolean | void}
 *
 * @ignore
 */
function processChangeTexture(self, mesh, modellevel, tile, force3, resolve) {
    try {
        if (!self._useTexture
            || !defined(tile._drawArg)
            || self.isTileDisposed(tile, tile._drawArg)
        ) {
            if (defined(resolve)) resolve.call();
            return;
        }

        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(self._drawArg);

        if (mesh instanceof USharedMesh && defined(mesh._thumbs) && modellevel < mesh._thumbcount) {
            if (defined(resolve)) resolve.call();
            if (self.isTileDisposed(tile, drawArg)) {
                mesh._changingTexture = false;
                return false;
            }
            mesh._changingTexture = true;
            mesh.changeThumbTextures(modellevel);
            return;
        }

        //+ 건물 메쉬정보는 기본적으로 다 올리도록 한다.
        const work = new U3dQuadTileWork({
            message: UDEF._MSG_WORK._UPDATE_IMAGE_BUILDING
            , force3: force3
            , selector: self
            , callback: changeTexture
            , parameter: {self: self, mesh: mesh, modellevel: modellevel, tile: tile, resolve: resolve}
            , tile: tile
            , object: mesh
            , cancel: resolve
            , filter: function (/** @type {any} */ param) {
                if (defined(force3) && force3 == true) return true;

                if (
                    param.mesh._changingTexture
                    || self.isTileDisposed(tile, tile._drawArg)
                    || param.modellevel === param.mesh._curImagelevel
                    || self._drawArg && !self._drawArg.intersectsSphere(tile._sphere)
                ) return false;

                return true;
            }
        });

        if (defined(force3)) {
            if (UDEF.isImmediateUpdateImageModel || self._immediateUpdateImage) {
                self.addWork(work);
            }
            else {
                self.addWork2(work); //+ 3순위
            }
        } else {
            //+ queue process 수행
            if (mesh._curImagelevel === -1 || UDEF.isImmediateUpdateImageModel || self._immediateUpdateImage)
                self.addWork(work); //+ 1순위 -> 첫번째 이미지와 형상정보 같이 레벨로
            else {
                self.addWork2(work); //+ 3순위
            }
        }
    } catch (e) {
        if (defined(resolve)) resolve.call();
    }
}

/**
 * 머터리얼 색상과 불투명도를 설정합니다.
 *
 * @param {ModelMaterial} material
 * @param {string | number | import('three').ColorRepresentation} color
 * @param {number} opacity
 *
 * @ignore
 */
function setMaterialColor(material, color, opacity) {
    if (!material._oriColor)
        material._oriColor = material.color.clone();
    material.color.set(color);

    if (!material._oriOpacity)
        material._oriOpacity = Number(material.opacity);
    material.opacity = Number(opacity);
    material.transparent = material.opacity < 1;
}

/**
 * 머터리얼 색상과 불투명도를 원래 값으로 되돌리는 함수
 *
 * @param {ModelMaterial} material
 *
 * @ignore
 */
function resetMaterialColor(material) {
    if (material._oriColor) {
        material.color.set(material._oriColor)
        delete material._oriColor
    }
    if (material._oriOpacity) {
        material.opacity = Number(material._oriOpacity);
        delete material._oriOpacity;
        material.transparent = material.opacity < 1;
    }

    if (material._oriMap) {
        material.map = material._oriMap
        delete material._oriMap
    }
}

/**
 * 복원된 메시의 삭제·편집 상태를 반영하고 공간 색인과 로드 이벤트를 갱신합니다.
 *
 * @param {U3FFinishModelOwner} self 메시를 소유한 레이어
 * @param {ModelMesh} mesh 복원된 메시
 * @param {U3FParsedObj} obj 편집 상태를 대조할 복원 입력
 * @returns {boolean | undefined} 편집 메시 분할로 나머지 생성을 중단하면 true
 */
function finishRestoredMesh(self, mesh, obj) {
    // 건물 mesh 생성 후, remove 상태 확인 및 가시화 결정
    if (defined(mesh.isMerged)) {
        let removeCheckId = mesh.getUid() + UDEF.U3F_DETACHED_TOKEN;
        if (self.removeFilter(removeCheckId)) {
            mesh.visible = false;
            if (!mesh.isMerged())
                mesh._sleeping = true;
        }
    } else if (self.removeFilter(mesh.userData.id) || self.removeFilter(mesh.userData.oid)) {
        if (mesh._isMerged)
            mesh.visible = false;
    }
    // 복원 입력과 편집 목록을 대조한 결과로 공개 편집 이벤트 적용 여부를 결정합니다.
    const editIndex = INTERNAL.getEditedModelIndex(self, obj);

    if (self.editFilter(mesh.userData.id) || self.editFilter(mesh.userData.oid) || editIndex > -1) {
        if (mesh._isMerged) {
            mesh.visible = false;
            let editMeshes = mesh.mergedMeshDivision(self.removedList);
            if (editMeshes && editMeshes.children.length > 0) {
                self.setEditEvent(editMeshes.children);
                for (let editMesh of editMeshes.children) {
                    self.setSplitEvent(mesh, editMesh);
                    editMesh.setManualUpdate();
                }
                return true;
            }
        }
    }

    mesh.setManualUpdate();

    if (defined(UDEF.RBUSH)) {
        let rbushBox = mesh._bbox.clone();
        const sphere = new THREE.Sphere();

        rbushBox.getBoundingSphere(sphere)
        let info = {
            box: rbushBox,
            mesh: mesh,
            sphere: sphere
        };
        (/** @type {{clear: () => void, insert: (item: unknown) => void}} */(UDEF.RBUSH)).insert(info);
    }
    if (UDEF.BOUNDING_METHOD === UDEF.BOUNDING_TYPE.TREE) {
        if (!mesh.geometry.boundsTree) {
            mesh.geometry.computeBoundsTree();
        }
        // const bvhHelper = new MeshBVHHelper(mesh);
        // self._scene.add(bvhHelper);
    }

    self.dispatchEvent({type: U3dEvent.MESH.LOADED, data: mesh})
    return undefined;
}

/**
 * 병합 메시의 등록 완료를 기존 이벤트 경로로 통지합니다.
 *
 * @param {Pick<import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer, 'dispatchEvent'>} self 이벤트 발행 레이어
 * @param {ModelMesh} mesh 등록된 메시
 */
function notifyLoadedModel(self, mesh) {
    self.dispatchEvent({type: U3dEvent.MESH.LOADED, data: mesh});
}

/** @type {U3FModelHooks} */
const MODEL_HOOKS = {finishMesh: finishRestoredMesh, deleteTexture, notifyLoadedModel};

export {U3dModelU3FLayer};
