//@ts-check
import * as THREE from 'three';
import { defined } from '@util/defined';
import { defaultValue } from '@util/defaultValue';
import { normalizeOptionKeys } from '@util/normalizeOptionKeys';
import { UMathEngine } from '@UMathEngine';
import { UWfsMesh } from '@union3d/core/mesh/UWfsMesh';
import { UFileLoader } from '@union3d/core/loader/UFileLoader';
import { U3dModelLayer } from '@union3d/3dLayer/U3dModelLayer';
import { UDEF } from '@union3d/core/UDEF';
import { Guid } from '@util/Guid';
import { SLDParser } from '@union3d/util/parser/SLDParser';
import { CQLParser } from '@union3d/util/parser/CQLParser';
import { U3dPOI } from '@union3d/geometry/U3dPOI';
import { U3dEvent } from '@union3d/event/U3dEvent';
import { UCheckTime } from '@union3d/core/UCheckTime';
import { U3dQuadTileWork } from '@union3d/quadtree/U3dQuadTileWork';
import { deferred } from '@util/deferred';
import { UGPoint } from '@UGPoint';
import { __GError__ } from '@U3dMessage';
import { DEFAULT_CONTRAST } from "@union3d/shader/GContrastBlendingShader";
import { DEFAULT_BRIGHTNESS } from "@union3d/shader/GBrightnessBlendingShader";

import { INTERNAL } from '@union3d/3dLayer/U3dModelWFSLayer.internal';

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * WFS 서비스의 피처(feature)를 타일별 3차원 모델로 표시하는 레이어입니다.
 *
 * @group 3dLayer
 * @extends {U3dModelLayer}
 */
class U3dModelWFSLayer extends U3dModelLayer {
    /**
     * 부모 옵션과 WFS 옵션의 대소문자 별칭을 정규화할 기준 키입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [
        ...U3dModelLayer.OPT_KEYS,
        'layerName', 'updateItem', 'useProxy', 'proxyUrl', 'key',
        'drawLine', 'textureUrl', 'defaultHeight', 'defaultZOffset',
        'useTerrain', 'useBox', 'materialType', 'useTexture', 'color',
        'version', 'width', 'height', 'cql', 'floorHeight', 'pipeRadius',
        'fieldPk', 'fieldHeight', 'fieldKind', 'fieldFloor', 'fieldLabel',
        'fieldHeightFloor', 'buildSn', 'featureType', 'sldUrl',
        'styleFunction', 'heightFunction', 'depthFunction', 'labelFunction'
    ];

    /**
     * 현재 생성 경로에서는 호출하지 않는 저장용 피처 필터 콜백입니다.
     *
     * @type {U3dModelWFSLayerFeatureFilterFn|undefined}
     */
    filter;
    /**
     * 피처별 모델 스타일을 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerFeatureStyleFn|undefined}
     */
    styleFunction;
    /**
     * 피처별 모델 밑면 높이를 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerSetterFn|undefined}
     */
    heightFunction;
    /**
     * 폴리곤 돌출 높이 또는 선 파이프 반지름을 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerSetterFn|undefined}
     */
    depthFunction;
    /**
     * 피처별 POI 라벨 옵션을 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerLabelFn|undefined}
     */
    labelFunction;
    /**
     * POI 이름별 라벨 참조를 보관하는 내부 저장소입니다.
     *
     * @type {Map<string | number, import('@union3d/geometry/U3dPOI').U3dPOI>}
     *
     * @ignore
     */
    _labelMap;
    /**
     * URL별로 적재한 텍스처 참조를 보관하는 내부 저장소입니다.
     *
     * @type {Record<string, import('three').Texture>}
     *
     * @ignore
     */
    _textures;
    /**
     * 현재 생성자에서만 초기화하는 재질 저장소입니다.
     *
     * @type {Record<string, any>}
     *
     * @ignore
     */
    _textureMaterials;
    /**
     * SLD 규칙과 규칙별 CQL 파서를 보관합니다.
     *
     * @type {{rules: (Array<Record<string, any>>|undefined)}}
     *
     * @ignore
     */
    _sld;
    /**
     * 현재 생성자에서만 초기화하는 SLD 색상 저장소입니다.
     *
     * @type {Record<string, any>}
     *
     * @ignore
     */
    _sldcolor;
    /**
     * 타일 키별 모델 식별자를 보관합니다.
     *
     * @type {Record<string, any>}
     *
     * @ignore
     */
    _tileModelMap;
    /**
     * 레이어 전체의 모델 중복 생성을 판정할 식별자를 보관합니다.
     *
     * @type {Record<string, boolean | undefined>}
     *
     * @ignore
     */
    _modelIds;
    /**
     * 공개 조회 메서드에 사용할 건물 일련번호를 보관합니다.
     *
     * @type {string | number | undefined}
     *
     * @ignore
     */
    _buildingSn;
    /**
     * 필드와 콜백에서 높이를 얻지 못할 때 사용할 기본 높이입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _defaultHeight;
    /**
     * 층수 기반 돌출 높이 계산에 사용할 층당 높이입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _floorHeight;
    /**
     * 선 피처의 기본 파이프 반지름입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _pipeRadius;
    /**
     * 새 모델에 적용할 밝기 값을 보관합니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _brightness = DEFAULT_BRIGHTNESS;
    /**
     * 새 모델에 적용할 대비 값을 보관합니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _contrast = DEFAULT_CONTRAST;

    /**
     * U3dModelWFSLayer 클래스 생성자입니다.<br>
     * WFS 서비스의 피처(feature)를 타일별 3차원 모델로 표시할 요청·스타일·높이·라벨 옵션을 준비합니다.<br>
     * 소문자 옵션도 camelCase로 정규화하며 false·0을 보존하고 undefined에만 기본값을 적용합니다.<br>
     * baseUrl이 없으면 안내 로그를 남기고 WFS 초기화를 중단합니다.
     *
     * @param {U3dModelWFSLayerCO} [opt={}] 생성·스타일·높이·라벨 설정
     */
    constructor(opt = {}) {
        // 별칭 선택과 기본값 적용을 분리하여 명시한 false·0·빈 문자열을 보존합니다.
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);
        if (!defined(opt.baseUrl)) {
            console.info('U3dImageWMSLayer constructor is failed. because baseurl is null');
            return;
        }

        const self = this;

        self._classtype = 'U3dModelWFSLayer';
        self._name = defaultValue(opt.name, Guid());
        self._layerName = opt.layerName;
        self._updateItem = defaultValue(opt.updateItem, 20);
        self._useProxy = defaultValue(opt.useProxy, false);
        self._proxyUrl = defaultValue(opt.proxyUrl, './proxy.jsp?url=');
        self._key = defaultValue(opt.key, undefined);
        self._drawLine = defaultValue(opt.drawLine, false);
        self._textureUrl = defaultValue(opt.textureUrl, undefined);
        self._defaultHeight = defaultValue(opt.defaultHeight, 20); // 미터 단위
        self._defaultZOffset = defaultValue(opt.defaultZOffset, 0); // 미터 단위
        self._checkTime = new UCheckTime();
        self._useTerrain = defaultValue(opt.useTerrain, true);
        self._useBox = defaultValue(opt.useBox, false);


        self._textures = {};
        self._textureMaterials = {};

        self._materialType = defaultValue(opt.materialType, 'standard');
        // 부모의 _useTexture는 공통 재질 설정용이므로 WFS 기본 텍스처 선택 값과 구분합니다.
        self._useDefaultTexture = defaultValue(opt.useTexture, false);
        self._color = defaultValue(opt.color, 0xeeeeee);

        if (defined(this._textureUrl))
            self.setTexture(this._textureUrl);

        if (self._useProxy === false) self._proxyUrl = '';

        self._baseUrl = opt.baseUrl;

        self._ext = defaultValue(opt.ext, 'application/json');
        self._crs = defaultValue(opt.crs, 'EPSG:3857');
        self._version = defaultValue(opt.version, '1.1.0');
        self._width = defaultValue(opt.width, 256);
        self._height = defaultValue(opt.height, 256);
        self._minlevel = defaultValue(opt.minLevel, 17);
        self._maxlevel = self._minlevel;
        self._cql = opt.cql;
        self._floorHeight = defaultValue(opt.floorHeight, 3);

        self._pipeRadius = defaultValue(opt.pipeRadius, 0.5);
        self._fieldPk = defaultValue(opt.fieldPk, 'gid'); // 모델 식별자 필드
        self._fieldHeight = defaultValue(opt.fieldHeight, undefined); // 높이 필드
        self._fieldKind = defaultValue(opt.fieldKind, undefined); // 저장용 종류 필드
        self._fieldFloor = defaultValue(opt.fieldFloor, undefined); // 층수 필드
        self._fieldLabel = defaultValue(opt.fieldLabel, undefined); // 라벨 필드
        self._fieldFloorHeight = defaultValue(opt.fieldHeightFloor, undefined); // 층당 높이 필드
        self._buildingSn = defaultValue(opt.buildSn, undefined);
        self._featureType = defaultValue(opt.featureType, '3d');
        self._sldUrl = defaultValue(opt.sldUrl, undefined);
        if (defined(self._sldUrl))
            self._sldUrl = self._proxyUrl + self._sldUrl;
        self._sldLoaded = false;
        self._sld = { rules: undefined };
        self._sldcolor = {};

        self.createModel = self.createModel.bind(self);
        if (defined(self._sldUrl))
            self.getSLD(self._sldUrl);
        else
            self._sldLoaded = true;

        self.filter = undefined;
        self.styleFunction = defaultValue(opt.styleFunction, undefined);
        self.heightFunction = defaultValue(opt.heightFunction, undefined);
        self.depthFunction = defaultValue(opt.depthFunction, undefined);
        self.labelFunction = defaultValue(opt.labelFunction, undefined);

        self._tileModelMap = {};
        self._modelIds = {};
        self._loader = new UFileLoader();
        self._loader.setResponseType('json');
        self._labelMap = new Map();

        if (defined(/** @type{any} */(self).resolve))
            /** @type{any} */(self).resolve(self);
    }

    /**
     * 레이어에서 새 모델에 적용할 밝기(brightness) 값을 반환합니다.
     *
     * @returns {number} 새 모델에 적용할 밝기 값
     */
    getBrightness() { return this._brightness; }

    /**
     * 레이어에서 새 모델에 적용할 대비(contrast) 값을 반환합니다.
     *
     * @returns {number} 새 모델에 적용할 대비 값
     */
    getContrast() { return this._contrast; }

    /**
     * 레이어 밝기(brightness)를 저장하고 기존 모델에도 적용합니다.<br>
     * 기존 모델의 밝기 값이 0이면 해당 모델에는 새 값을 적용하지 않습니다.
     *
     * @param {number} val 설정할 값
     * @returns {this} 연쇄 호출을 위한 현재 레이어
     */
    setBrightness(val) {
        this._brightness = val;

        this._group.traverse(object => {
            const wfsMesh = /** @type {import('@UWfsMesh').UWfsMesh} */(/** @type {unknown} */(object));
            if (wfsMesh.brightness)
                wfsMesh.brightness = val;
        });

        return this;
    }

    /**
     * 레이어 대비(contrast)를 저장하고 기존 모델에도 적용합니다.<br>
     * 기존 모델의 대비 값이 0이면 해당 모델에는 새 값을 적용하지 않습니다.
     *
     * @param {number} val 설정할 값
     * @returns {this} 연쇄 호출을 위한 현재 레이어
     */
    setContrast(val) {
        this._contrast = val;

        this._group.traverse(object => {
            const wfsMesh = /** @type {import('@UWfsMesh').UWfsMesh} */(/** @type {unknown} */(object));

            if (wfsMesh.contrast)
                wfsMesh.contrast = val;
        });

        return this;
    }

    /**
     * 모델 메시(mesh)의 편집 도구와 자동 지형 높이 갱신 연결을 해제한 뒤 부모의 모델 제거를 수행합니다.
     *
     * @override
     *
     * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
     */
    deleteMesh(mesh) {
        if (mesh instanceof THREE.Mesh) {
            const gizmoMesh = /** @type {import('@UWfsMesh').UWfsMesh} */(mesh);
            if (defined(gizmoMesh.hasGizmo)) {
                gizmoMesh.hasGizmo.detach();
            }
            this._app.removeAutoHeightUpdate(mesh.position.x, mesh.position.y, mesh);
        }
        super.deleteMesh(mesh);
    }

    /**
     * 렌더 그룹에서 일부 모델을 순환 선택하여 그림자(shadow) 적용 여부를 갱신합니다.<br>
     * 유휴 렌더에서는 70회, 그 외에는 2회까지 선택하며 갱신 시각에 도달한 모델만 처리합니다.
     *
     * @param {number} updateTime 그림자 갱신 시각의 비교·기록에 사용할 경과 시간
     */
    updateShadow(updateTime) {
        if (this._group.children.length === 0) return;
        const count = this._app.isIdleDraw() ? 70 : 2;
        for (let i = 0; i < count; i++) {
            const meshGroup = /** @type {import('@UGroup').UGroup | undefined} */ (this._group.next());
            const mesh = /** @type {import('@UMesh').UMesh | undefined} */ (meshGroup?.next());
            if (!mesh?.hasReachedShadowTime?.(updateTime)) continue;
            mesh.applyShadow((mesh.visible && this._app._frustum.intersectsObject(mesh)), updateTime);
        }
    }

    /**
     * 부모의 레이어 해제를 시작한 뒤 보관한 텍스처(texture)를 해제합니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 부모 레이어 해제 결과
     */
    dispose() {
        const disposed = super.dispose();

        this.removeAllResource();

        return disposed;
    }

    /**
     * 타일(tile) 키에 연결된 모델 식별자·라벨·작업 버퍼를 정리한 뒤 부모의 타일 해제를 수행합니다.
     *
     * @override
     *
     * @param {string} key 타일 키
     */
    disposeTileByKey(key) {
        const self = this;
        if (!defined(key)) return;

        if (self.editedList.length > 0) {
            for (let k = 0; k < self.editedList.length; k++) {
                const tempObj = /** @type {import('@union3d/3dLayer/U3dModelLayer').EditedEvent} */(self.getEditedEventById(self.editedList[k]));

                if (!defined(tempObj._afterTile)) {
                    tempObj._isAdd = false;
                }
                if (defined(tempObj._afterTile) && tempObj._afterTile._key === key) {
                    tempObj._isAdd = false;
                }

            }
        }

        for (let id in self._tileModelMap[key]) {
            _removePOI.call(self, self, id)
            self._modelIds[id] = undefined;
            delete self._modelIds[id]
        }
        self._tileModelMap[key] = undefined;
        delete self._tileModelMap[key];

        self._workBuffer[key] = undefined;
        delete self._workBuffer[key];

        super.disposeTileByKey(key);
    }

    /**
     * 타일(tile)의 키를 구하여 해당 타일의 모델과 관련 등록 정보를 해제합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
     */
    disposeTile(tile) {
        if (!defined(tile)) return;
        this.disposeTileByKey(/** @type {string} */(this.createKeyFromTile(tile)));
    }

    /**
     * 모델 레이어와 연결된 라벨의 표시 여부를 함께 전환합니다.<br>
     * 앱의 그리기 정보가 연결된 뒤 호출하십시오.
     *
     * @override
     *
     * @param {boolean} show 모델과 라벨 표시 여부
     */
    show(show) {
        const self = this;
        const app = self._drawArg._app;
        if (!defined(app))
            return;

        if (!show) {
            self._labelVisible = false;
        } else {
            self._labelVisible = true;
        }

        updateLabelVisible(this);

        super.show(show);
    }

    /**
     * 피처(feature) 필터 콜백을 저장합니다.<br>
     * 현재 모델 생성 경로는 저장한 필터를 호출하지 않습니다.
     *
     * @param {U3dModelWFSLayerFeatureFilterFn} fnc 저장할 피처 필터 콜백
     */
    setFilterFunction(fnc) {
        if (typeof fnc === 'function') {
            this.filter = fnc;
        }
    }

    /**
     * 이후 모델 생성 시 지형(terrain) 높이를 적용할지 설정합니다.<br>
     * 이미 생성한 모델을 다시 만들거나 자동 높이 갱신 등록을 변경하지는 않습니다.
     *
     * @param {boolean} val 설정할 값
     */
    setUseTerrain(val) {
        this._useTerrain = val;
    }

    /**
     * 이후 모델 생성에 사용할 지형(terrain) 높이 적용 설정을 반환합니다.
     *
     * @returns {boolean} 계산하거나 생성한 결과
     */
    getUseTerrain() {
        return this._useTerrain;
    }

    /**
     * 모델 레이어의 표시 여부와 별개로 연결된 라벨(label)을 표시하거나 숨깁니다.
     *
     * @param {boolean} visible 라벨 표시 여부
     */
    showLabel(visible) {
        const self = this;
        self._labelVisible = visible;
        updateLabelVisible(this);
    }

    /**
     * 기존 라벨(label)의 문자열을 지정한 피처 속성 필드값으로 갱신합니다.<br>
     * 새 라벨을 만들지는 않습니다.
     *
     * @param {string} labelField 기존 라벨 문자열에 사용할 피처 속성 필드명
     * @returns {boolean} 필드명이 있으면 true, 없으면 false
     */
    setLabelField(labelField) {
        const self = this;
        if (!defined(labelField)) {
            return false;
        }

        self._fieldLabel = labelField;
        self._group.traverse(function(mesh) {
            if (mesh instanceof THREE.Mesh) {
                if (mesh.userData.label) {
                    const labelText = (/** @type {U3dModelWFSLayerMesh} */(mesh))._ufeature.properties[self._fieldLabel];
                    mesh.userData.label.setLabel(labelText);
                }
            }
        });

        return true;
    }

    /**
     * 갱신 주기를 통과한 경우 부모의 타일 모델 갱신을 실행합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 앱과 지형 갱신에 사용하는 그리기 정보
     */
    update(drawArg) {
        if (!defined(drawArg)) return;
        if (this._checkTime.isUpdate()) {
            super.update(drawArg);
        }
        this._checkTime.updateTime(20);
    }

    /**
     * 레이어가 보관한 모든 텍스처(texture)를 해제하고 텍스처 저장소를 비웁니다.<br>
     * 기존 모델 재질이 참조하는 텍스처 연결을 교체하지는 않습니다.
     */
    removeAllResource() {
        const self = this;
        const textureKeys = Object.keys(self._textures);
        for (let i = 0; i < textureKeys.length; i++) {
            const texture = self._textures[textureKeys[i]];
            texture.dispose();
        }
        self._textures = {};
    }

    /**
     * 이미지 URL에서 텍스처(texture)를 불러와 이후 모델 스타일에서 선택할 수 있도록 보관합니다.<br>
     * 호출 전에 보관한 텍스처는 해제하며 기본 텍스처 선택 URL은 바꾸지 않습니다.<br>
     * 반환 시점에는 이미지 로딩이 끝나지 않았을 수 있으며 비동기 로딩 실패 콜백은 등록하지 않습니다.
     *
     * @param {string | Array<string>} url 적재할 이미지 URL 또는 URL 목록
     */
    setTexture(url) {
        const self = this;
        self.removeAllResource();
        if (Array.isArray(url)) {
            for (let i = 0; i < url.length; i++) {
                try {
                    const texture = new THREE.TextureLoader().load(url[i]);
                    if (!texture) {
                        console.log(url + "texture is not exist");
                        continue;
                    }
                    UDEF.noResizeTexture(texture);
                    texture.needsUpdate = true;
                    texture.flipY = false;
                    self._textures[url[i]] = texture;
                } catch (e) {
                    console.log(url + "texture load error");
                }
            }
        }
        else {
            try {
                const texture = new THREE.TextureLoader().load(url);
                if (!texture) {
                    console.log(url + "texture is not exist");
                    return;
                }

                UDEF.noResizeTexture(texture);
                texture.needsUpdate = true;
                texture.flipY = false;
                self._textures[url] = texture;
            } catch (e) {
                console.log(url + "texture load error");
            }

        }
    }

    /**
     * 타일(tile) 영역의 WFS 피처(feature)를 요청하고 응답을 모델 생성 작업으로 등록합니다.<br>
     * 반환 Promise의 true는 작업 등록을 뜻하며 모든 모델의 생성·표시 완료를 뜻하지 않습니다.<br>
     * 요청 조건을 통과하지 못하거나 작업 버퍼가 이미 있으면 undefined를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
     * @returns {boolean | Promise<boolean> | undefined} 작업 등록 결과 Promise 또는 요청하지 않은 경우 undefined
     */
    createModel(tile) {
        const self = this;
        if (!super.createModel(tile)) {
            this.resetStateTile(tile);
            return;
        }
        if (!self._sldLoaded) {
            this.resetStateTile(tile);
            return undefined;
        }

        if (!defined(tile) || !defined(self._scene)) {
            this.resetStateTile(tile);
            return undefined;
        }

        if (self.isTileMeshDisposed(tile, tile._drawArg)) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }

        if (!defined(tile._drawArg)) {
            throw new Error('drawarg is null!!');
        }
        const drawArg = tile._drawArg;
        const center = tile._rectangle.centerMap();
        const indexXY = UMathEngine.getGoogleToIndexXY(center.x, center.y, self._minlevel);
        const key = makeTileName(indexXY.x, indexXY.y, self._minlevel);
        const level = tile._rlevel;


        if (self._visible === false
            || (/** @type {number} */(self.getStateTile(tile))) >= UDEF.TILE_STATE._loading
            || level !== self._minlevel) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }
        /** @type {DeferredObject<boolean>} */
        const promise = deferred();
        if (self.getCache(tile)) {
            promise.resolve(false);
            return promise;
        }
        else
            self.createGroup(tile);

        self.setStateTile(tile, UDEF.TILE_STATE._loading);

        const minx = tile._rectangle.ptLeftTop.x;
        const miny = tile._rectangle.ptLeftTop.y;
        const maxx = tile._rectangle.ptRightTop.x;
        const maxy = tile._rectangle.ptRightBottom.y;

        const sService = "?SERVICE=WFS&VERSION=" + self._version;
        const sGetFeature = "&REQUEST=GetFeature&outputformat=" + self._ext;
        const sLayer = "&TYPENAME=" + self._layerName;
        const sCRS = "&SRSNAME=" + self._crs;

        let sBox;
        if (!defined(self._crs))
            sBox = "&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy;
        else
            sBox = "&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy + ',' + self._crs;

        let sCql = "&cql=" + self._cql;
        if (!defined(self._cql)) sCql = '';
        const skey = self._key === undefined ? "" : "&apikey=" + self._key;

        let url;
        if (self._useProxy) {
            url = self._proxyUrl + self._baseUrl + sService + sGetFeature + sLayer + sCRS + skey + sBox + sCql;
        } else {
            url = self._baseUrl + sService + sGetFeature + sLayer + sCRS + skey + sBox + sCql;
        }

        self.plusLoadingTile();

        if (defined(self._workBuffer[key])) {
            return;
        }
        self._loader.load(url, function(/** @type {U3dModelWFSLayerServiceJson} */ json) {
            if (self.isTileDisposed(tile, drawArg)) {
                self.minusLoadingTile();
                promise.resolve(false);
                return;
            }
            parseModel.call(self, self, json, tile, drawArg, promise);
        }
            , null
            , function(/** @type {unknown} */ err) {
                __GError__(self, `${url} 서비스를 로드하는 중 오류가 발생 하였습니다. [ ${err} ]`, '1017982');
                self.minusLoadingTile();
                promise.resolve(false);
            });

        return promise;
    }

    /**
     * 편집한 모델이 속한 타일(tile)의 WFS 피처(feature)를 다시 요청하여 편집 버퍼를 갱신합니다.<br>
     * 반환 Promise는 버퍼 갱신 결과이며 모델 재생성 완료를 뜻하지 않습니다.<br>
     * 요청 오류·중단 콜백이 없어 해당 실패에서는 Promise가 완료되지 않을 수 있습니다.
     *
     * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
     * @returns {Promise<boolean>} 편집 버퍼 갱신 결과 Promise
     */
    addEditModel(mesh, tile) {
        const self = this;
        const drawArg = tile._drawArg;

        /** @type {DeferredObject<boolean>} */
        const promise = deferred();


        if (!defined(tile._drawArg)) {
            throw new Error('drawarg is null!!');
        }

        const center = tile._rectangle.centerMap();
        const indexXY = UMathEngine.getGoogleToIndexXY(center.x, center.y, self._minlevel);
        const key = makeTileName(indexXY.x, indexXY.y, self._minlevel);
        const level = tile._rlevel;


        self.setStateTile(tile, UDEF.TILE_STATE._loading);


        const minx = tile._rectangle.ptLeftTop.x;
        const miny = tile._rectangle.ptLeftTop.y;
        const maxx = tile._rectangle.ptRightTop.x;
        const maxy = tile._rectangle.ptRightBottom.y;

        //  http://119.207.126.69/unionserver/service/wfs?SERVICE=wfs&VERSION=1.1.0&REQUEST=GetFeature&outputformat=application/json&typename=%EC%84%9C%EC%9A%B8%EA%B1%B4%EB%AC%BC%EC%A0%95%EB%B3%B4&srsName=EPSG%3A3857&BBOX=14135820.676296443%2C4517705.455881451%2C14138113.787144996%2C4518852.011305728
        const sService = "?SERVICE=WFS&VERSION=" + self._version;
        const sGetFeature = "&REQUEST=GetFeature&outputformat=" + self._ext;
        const sLayer = "&TYPENAME=" + self._layerName;
        const sCRS = "&SRSNAME=" + self._crs;

        let sBox;
        if (!defined(self._crs))
            sBox = "&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy;
        else sBox = "&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy + ',' + self._crs;

        let sCql = "&cql=" + self._cql;
        if (!defined(self._cql)) sCql = '';
        const skey = self._key === undefined ? "" : "&apikey=" + self._key;

        let url;
        if (self._useProxy) {
            url = self._proxyUrl + self._baseUrl + sService + sGetFeature + sLayer + sCRS + skey + sBox + sCql;
        } else {
            url = self._baseUrl + sService + sGetFeature + sLayer + sCRS + skey + sBox + sCql;
        }


        if (!self.getCache(tile))
            self.createGroup(tile);

        self.plusLoadingTile();

        self._loader.load(url, function(/** @type {U3dModelWFSLayerServiceJson} */ json) {
            // if (self.isTileDisposed(tile, drawArg)) {
            //     self.minusLoadingTile();
            //     promise.resolve(false);
            //     return;
            // }
            parseEditModel.call(self, self, json, tile, mesh, drawArg, promise);
        }
            //+ progress
            , null
            // , function () {
            // } //+ progress에 콜백함수가 들어가면 속도가 엄첨 느려진다.
            // , function () {
            //     if (tile._disposed) {
            //         self.minusLoadingTile();
            //         promise.resolve(false);
            //         //  promise.reject(index);
            //     }
            // }
            //+ error
            // , function (error) {  // console.info(error);
            //     self.minusLoadingTile();
            //
            //     self.resetStateTile(tile);
            //     promise.resolve(false);
            //     // promise.reject(index);
            // }
            // //+ abort
            // , function (error) {  // console.info(error);
            //     self.minusLoadingTile();
            //
            //     self.resetStateTile(tile);
            //     promise.resolve(false);
            //     // promise.reject(index);
            // });
        );
        return promise;


    }

    /**
     * SLD 스타일 파일을 요청하여 모델의 스타일 규칙을 준비합니다.<br>
     * 응답이 200이면 규칙을 적용하고 404이면 규칙 없이 모델 생성을 허용합니다.<br>
     * 다른 응답 코드와 전송 실패에서는 준비 상태를 바꾸지 않습니다.
     *
     * @param {string} baseurl 프록시 접두가 필요하면 이미 붙여 전달하는 SLD 파일 URL
     */
    getSLD(baseurl) {
        const self = this;

        //  var url ='http://119.207.126.69/unionserver/api?api=layer&request=getLayerStyle&layer=%EC%84%9C%EC%9A%B8%EA%B1%B4%EB%AC%BC%EC%A0%95%EB%B3%B4';// baseurl;
        let url = baseurl;
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/xml');

        xhr.onload = function() {
            if (xhr.status === 200) {
                const result = /** @type {{rules: Array<Record<string, any>>}} */(SLDParser.parse(xhr.responseXML));

                self._sldLoaded = true;
                self._sld = result;
                for (let i = 0; i < result.rules.length; i++) {
                    const cp = new CQLParser();
                    const filter = result.rules[i].filter;
                    if (filter !== undefined && filter !== '') {
                        cp.parse(filter);
                        result.rules[i].cql = cp;
                    }
                }


                // for (var i = 0; i < self._sld.length; i++) {
                //     if (defined(self._sld[i].fill) && defined(self._sld[i].fill.color)) {
                //         self._sldcolor[self._sld[i].name] = self._sld[i].fill.color;
                //     }
                // }
                self.updateStyle();
            } else if (xhr.status == 404) {
                // xml 파일이 없을 때
                self._sldLoaded = true;
            }
        };

        xhr.open("GET", url, true);
        xhr.send();
    }

    /**
     * 층당 높이(floorHeight)를 저장하고 레이어를 새로 고쳐 층수 기반 모델을 다시 만들도록 합니다.
     *
     * @param {number} floorHeight 층수 기반 높이 계산에 사용할 층당 높이(m)
     */
    setFloorHeight(floorHeight) {
        this._floorHeight = floorHeight;

        this.refresh();
    }

    /**
     * 이후 모델 생성에서 사용하는 기본 색상을 강조(highlight) 색상으로 바꿉니다.<br>
     * 기존 모델에 즉시 스타일을 다시 적용하지는 않습니다.
     */
    setHighlight() {
        const self = this;
        self._color = 0xfff0000;
    }

    /**
     * 조회용 건물 일련번호(buildingSn)를 저장합니다.
     *
     * @param {string | number} name 조회용 건물 일련번호
     */
    setBuildingSn(name) {
        const self = this;
        self._buildingSn = name;
    }

    /**
     * 저장한 건물 일련번호(buildingSn)를 반환합니다.
     *
     * @returns {string | number | undefined} 저장한 일련번호이며 없으면 undefined
     */
    getBuildingSn() {
        const self = this;
        if (defined(self._buildingSn))
            return self._buildingSn;
        return undefined;
    }

    /**
     * 사용자 스타일(style) 콜백을 선택적으로 교체하고 기존 WFS 모델의 표현을 다시 적용합니다.<br>
     * 콜백을 생략하면 저장한 사용자 콜백 또는 SLD 규칙을 사용합니다.
     *
     * @param {U3dModelWFSLayerFeatureStyleFn} [styleFunction] 교체할 스타일 콜백이며 생략하면 기존 콜백 유지
     */
    updateStyle(styleFunction) {
        const self = this;

        if (defined(styleFunction)) {
            self.styleFunction = styleFunction;
        }

        self._group.traverse(function(mesh) {
            if (mesh instanceof UWfsMesh) {
                setStyle.call(self, self, mesh);
            }
        });
    }

    /**
     * 사용자 라벨(label) 콜백을 선택적으로 교체하고 기존 WFS 모델의 라벨과 위치를 갱신합니다.<br>
     * 라벨 옵션의 visible이 false여도 이미 있는 라벨을 숨기거나 제거하지 않습니다.
     *
     * @param {U3dModelWFSLayerLabelFn} [labelFunction] 교체할 라벨 콜백이며 생략하면 기존 콜백 유지
     */
    updateLabel(labelFunction) {
        const self = this;

        if (defined(labelFunction)) {
            self.labelFunction = labelFunction;
        }

        self._group.traverse(function(mesh) {
            if (mesh instanceof UWfsMesh) {
                setLabel.call(self, self, mesh);
                updateLabel(mesh, self._app._camera, self._app.getCameraRelativeHeight());
            }
        });
    }
}

/**
 * 타일 인덱스와 레벨을 밑줄로 연결한 타일 키를 반환합니다.
 *
 * @param {number} x 타일 가로 인덱스
 * @param {number} y 타일 세로 인덱스
 * @param {number} level 타일 레벨
 * @returns {string} 계산하거나 생성한 결과
 *
 * @ignore
 */
function makeTileName(x, y, level) {
    return x + '_' + y + '_' + level;
}

//+ 지형처리
/**
 * 모델 밑면에 지형 높이와 보정값을 적용하고 자동 높이 갱신을 등록한 뒤 모델 로드 이벤트를 발생시킵니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
 *
 * @ignore
 */
function onAfterWork(self, mesh) {
    if (!mesh || !self._drawArg) return;
    if (self.getUseTerrain() && !self.heightFunction) {
        let renderZ = self._drawArg.getRenderHeightAtPoint(mesh._uvecBottom.x, mesh._uvecBottom.y); //확인됨
        if (!defined(renderZ) || renderZ === UDEF.INVALID || renderZ === UDEF.TERRAIN_NO_DATA) {
            renderZ = 0;
        }

        mesh.position.z = renderZ;

        if (self._defaultZOffset) {
            if (!mesh.userData.defaultScalingZoffset) {
                const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(mesh._uvecBottom.y);
                mesh.userData.defaultScalingZoffset = self._defaultZOffset * googleScale;
            }
            mesh.position.z += mesh.userData.defaultScalingZoffset;
        }
        updateLabel(mesh);

        self._app.addAutoHeightUpdate(
            mesh.position.x,
            mesh.position.y,
            mesh,
            function(/** @type {U3dModelWFSLayerMesh} */ mesh, /** @type {import('@U3dQuadTile').U3dQuadTile} */ tile, /** @type {number} */ z) {
                mesh.position.z = (z + (mesh.userData?.defaultScalingZoffset ?? 0));
                if (mesh.geometry.userData?.center?.z)
                    mesh.geometry.userData.center.z = mesh.position.z;
                updateLabel(mesh);
            });
    }
    if (defined(self))
        self.dispatchEvent({ type: U3dEvent.MESH.LOADED, data: mesh });
}

/**
 * 피처 묶음을 기하 종류별로 처리하고 작업 버퍼의 남은 처리 수를 갱신합니다.
 *
 * @param {{self: U3dModelWFSLayer, key: string, buffer: Record<string, any>, tile: import('@U3dQuadTile').U3dQuadTile, features: Array<U3dModelWFSLayerFeature>}} option 레이어·타일·피처 묶음과 남은 작업 수
 * @returns {Promise<unknown> | undefined} 계산하거나 생성한 결과
 *
 * @ignore
 */
function parseFeature(option) {
    const self = option.self;
    const key = option.key;
    let buffer = option.buffer;
    if (!defined(buffer) || !defined(buffer[key])) return;
    let tile = option.tile;
    let features = option.features;
    if (!Array.isArray(features))
        option.features = [features];
    let processCount = 0;

    return (/** @type {(...args: Array<unknown>) => Promise<unknown>} */(UDEF.createPromise))(function(/** @type {function(unknown=): void} */ resolve, /** @type {function(unknown=): void} */ reject) {
        for (let i = 0; i < features.length; i++) {
            let feature = features[i];
            (/** @type {(...args: Array<unknown>) => Promise<unknown>} */(UDEF.createPromise))(function(/** @type {function(unknown=): void} */ inResolve, /** @type {function(unknown=): void} */ inReject) {
                try {
                    // 부모의 캐시 반환 선언은 메시지만, 이 레이어는 createGroup()이 넣은 UGroup을 꺼낸다.
                    const groupWFS = /** @type {import('@UGroup').UGroup} */(/** @type {unknown} */(self.getCacheByKey(key)));
                    if (!defined(groupWFS)) {
                        inReject();
                        return;
                    }

                    self._tileModelMap[key] = self._tileModelMap[key] || {};
                    let prop = feature.properties;
                    let id = undefined;
                    if (defined(prop)) {
                        id = prop[self._fieldPk] || feature.id;
                    } else {
                        id = feature.id;
                    }

                    let editCheck = -1;
                    checkEditWork: {
                        if (defined(self._editWorkBuffer[key]) && self._editWorkBuffer[key].length > 0) {
                            editCheck = self._editWorkBuffer[key].findIndex(function(/** @type {U3dModelWFSLayerFeature} */ buffer) {
                                let isAdd = Object.values(self.editedEvent).findIndex(function(event) {
                                    if (event.id === id && event._isAdd === false) {
                                        return true;
                                    }
                                    return false;
                                })
                                return buffer.id === id && isAdd !== -1;
                            })
                        }
                    }

                    if (defined(self._modelIds[id]) && editCheck === -1) {
                        inResolve();
                        return;
                    }

                    const coordType = self._featureType;

                    if (feature.geometry.type === "Point" || feature.geometry.type === "PointZ") {
                        parsePoint.call(self, self, feature, coordType, tile, id, key, groupWFS);
                    } else if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
                        parseString.call(self, self, feature, coordType, tile, id, key, groupWFS);
                    } else if (feature.geometry.type === "Polygon" ||
                        feature.geometry.type === "MultiPolygon") {
                        parsePolygon.call(self, self, feature, coordType, tile, id, key, groupWFS);
                    } else if (feature.geometry.type === "MultiPolygonZM") {
                        inReject();
                        return;
                    }
                    inResolve();
                } catch (e) {
                    inReject(e);
                }
            }, true)
                .catch(function(/** @type {unknown} */ error) {
                    if (error !== undefined)
                        console.error(error);
                }).finally(function() {
                    if (defined(buffer) && defined(buffer[key])) {
                        buffer[key] = buffer[key] - 1;
                    }
                    if (features.length === ++processCount) {
                        resolve();
                    }
                });
        }
    }, true).finally(function() {
        if (defined(buffer) && defined(buffer[key]) && buffer[key] <= 0) {
            delete buffer[key];
        }
    });
}


/**
 * 모델의 기존 POI 라벨 위치를 현재 경계 상자 중심과 저장한 높이 보정값으로 갱신합니다.
 *
 * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
 * @param {import('three').Camera} [camera] 현재 사용하지 않는 카메라 인수
 * @param {number} [height] 현재 사용하지 않는 높이 인수
 *
 * @ignore
 */
function updateLabel(mesh, camera, height) {
    if (!(mesh instanceof THREE.Mesh) || !defined(mesh.userData.label)) {
        return
    }
    const label = mesh.userData.label;

    if (label) {
        const center = (/** @type {U3dModelWFSLayerMesh} */(mesh)).getBBox().getCenter(new THREE.Vector3());
        if (defined(mesh.userData.labelZoffset)) {
            center.z += mesh.userData.labelZoffset;
        }
        label.setPosition(center);
    }
}

/**
 * WFS 응답을 피처 4개 단위 작업으로 등록하고 요청 완료 대상과 타일 상태를 갱신합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerServiceJson} json WFS GetFeature 응답
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
 * @param {import('@UDrawArg').UDrawArg} drawArg 앱과 지형 갱신에 사용하는 그리기 정보
 * @param {DeferredObject<boolean>} promise 응답 처리를 완료할 대상
 * @returns {Promise<boolean>  | void} 계산하거나 생성한 결과
 *
 * @ignore
 */
function parseModel(self, json, tile, drawArg, promise) {
    self.minusLoadingTile();
    const groupWFS = self.getCache(tile);
    if (!defined(json)
        || !defined(groupWFS)
        || self.isTileMeshDisposed(tile, tile._drawArg)) {
        self.setStateTile(tile, UDEF.TILE_STATE._end);
        promise.resolve(false);
        return promise;
    }

    //+ 참조
    if (!defined(json) || !defined(json.features)) {
        self.setStateTile(tile, UDEF.TILE_STATE._end);
        promise.resolve(false);
        return promise;
    }

    const key = self.createKeyByTile(tile);
    let features = json.features;
    let buffer = self._workBuffer;

    buffer[key] = json.features.length;
    if (Array.isArray(features)) {
        let maxCount = 4;
        let doCount = 0;
        let doList = [];
        let option;
        let work;
        for (let index = 0; index < features.length; index++) {
            doList.push(features[index]);
            doCount = doCount + 1;
            if (doCount === maxCount || index + 1 === features.length) {
                option = {
                    self: self,
                    features: doList,
                    key: key,
                    tile: tile,
                    buffer: buffer
                }
                work = new U3dQuadTileWork({
                    message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
                    , selector: self
                    , callback: parseFeature
                    , parameter: option
                    , tile: tile
                    , object: undefined
                    , filter: function(/** @type {{tile: import('@U3dQuadTile').U3dQuadTile}} */ param) {
                        return !self.isTileDisposed(param.tile, param.tile._drawArg);

                    }
                });
                self.addWork(work);

                doCount = 0;
                doList = [];
            }
        }
    } else {
        let option = {
            self: self,
            features: features,
            key: key,
            tile: tile,
            buffer: buffer
        }
        let work = new U3dQuadTileWork({
            message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
            , selector: self
            , callback: parseFeature
            , parameter: option
            , tile: tile
            , object: undefined
            , filter: function(/** @type {{tile: import('@U3dQuadTile').U3dQuadTile}} */ param) {
                if (self.isTileDisposed(tile, tile._drawArg))
                    return false;
                return true;
            }
        });
        self.addWork(work);

    }
    self.setStateTile(tile, UDEF.TILE_STATE._end);
    promise.resolve(true);
}

/**
 * 편집 모델의 피처를 응답과 대조하여 작업 버퍼와 편집 대기 버퍼를 갱신합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerServiceJson} json WFS GetFeature 응답
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
 * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
 * @param {import('@UDrawArg').UDrawArg} drawArg 앱과 지형 갱신에 사용하는 그리기 정보
 * @param {DeferredObject<boolean>} promise 응답 처리를 완료할 대상
 * @returns {Promise<boolean>  | void} 계산하거나 생성한 결과
 *
 * @ignore
 */
function parseEditModel(self, json, tile, mesh, drawArg, promise) {
    self.minusLoadingTile();
    //+ 참조
    if (!defined(json) || !defined(json.features)) {
        self.setStateTile(tile, UDEF.TILE_STATE._end);
        promise.resolve(false);
        return promise;
    }

    const key = self.createKeyByTile(tile);

    let keys = Object.keys(self._editWorkBuffer);
    for (let editKey in keys) {
        let key_ = keys[editKey];
        if (defined(self._editWorkBuffer[key_]) && self._editWorkBuffer[key_].length > 0) {
            let check = self._editWorkBuffer[key_].findIndex(function(/** @type {U3dModelWFSLayerFeature} */ feature) {
                return feature.id === mesh._ufeature.id;
            })
            if (check !== -1) {
                self._editWorkBuffer[key_][check] = undefined;
                self._editWorkBuffer[key_].splice(check, 1);
            }
        }

        if (self._editWorkBuffer[key_].length === 0) {
            self._editWorkBuffer[key_] = undefined;
            delete self._editWorkBuffer[key_]
        }
    }

    if (json.features.length > 0)
        self._workBuffer[key] = json.features;
    else {
        let opt = mesh._ufeature
        if (defined(opt)) {
            let features = {
                geometry: opt.geometry,
                geometry_name: opt.geometry_name,
                id: opt.id,
                properties: opt.properties,
                type: opt.type
            }

            self._editWorkBuffer[key] = self._editWorkBuffer[key] || [];
            self._editWorkBuffer[key].push(features);

        }
    }


    self.setStateTile(tile, UDEF.TILE_STATE._end);
    promise.resolve(true);
}

/**
 * 두 점 사이의 보간 점을 결과 배열에 추가합니다.<br>
 * 거리와 maxDist의 비율을 반올림해 구간 수를 정하므로 실제 점 간격이 maxDist보다 클 수 있습니다.<br>
 * 양의 maxDist를 전달하십시오.
 *
 * @param {Array<import('three').Vector3>} array 보간 점을 추가할 배열
 * @param {import('three').Vector3} vec1 시작점
 * @param {import('three').Vector3} vec2 끝점
 * @param {number} [maxDist=8] 구간 수 계산의 기준 간격이며 양수 필요
 */
function lerpVector(array, vec1, vec2, maxDist = 8) {
    //U3dCustomModel에서 import 받아서 쓰고 있다.
    if (!vec1.distanceTo) {
        vec1 = new THREE.Vector3(vec1.x, vec1.y, vec1.z);
    }

    const dist = vec1.distanceTo(vec2);
    if (dist <= maxDist) {
        array.push(vec2);
        return;
    }

    const ncount = Math.round(dist / maxDist);
    for (let k = 1; k <= ncount; k++) {
        array.push(new THREE.Vector3().lerpVectors(vec1, vec2, ((1 / ncount) * k)));
    }
}

/**
 * 좌표 목록을 중심 기준 지역 좌표의 평면 Shape로 만듭니다.
 *
 * @param {Array<import('three').Vector3>} aryOrigin 원본 좌표 목록
 * @param {import('three').Vector3} center 지역 좌표 원점으로 사용할 중심
 * @param {number} [maxSegment=8] 보간 간격이며 0이면 원본 좌표 사용
 * @returns {import('three').Shape | undefined} 계산하거나 생성한 결과
 *
 * @ignore
 */
function buildShape(aryOrigin, center, maxSegment = 8) {
    /** @type {Array<import('three').Vector3>} */
    let ary = [];
    if (maxSegment === 0) {
        ary = aryOrigin;
    } else {
        for (let i = 1; i < aryOrigin.length; i++) {
            lerpVector(ary, aryOrigin[i - 1], aryOrigin[i], maxSegment);
        }
    }
    if (ary.length <= 1) {
        return undefined;
    }

    const shape = new THREE.Shape();
    shape.moveTo(ary[0].x - center.x, ary[0].y - center.y);
    for (let i = 1; i < ary.length; i++) {
        shape.lineTo(ary[i].x - center.x, ary[i].y - center.y);
    }

    return shape;
}


/**
 * 점 피처에 스타일·높이·라벨을 적용한 모델을 만들고 타일 그룹에 연결합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerFeature} feature WFS 피처와 속성
 * @param {string} coordType 좌표 종류
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
 * @param {string | number} id 모델 중복 판정과 타일별 기록에 사용할 식별자
 * @param {string} key 타일 키
 * @param {import('@UGroup').UGroup} groupWFS 모델을 연결할 타일 캐시 그룹
 *
 * @ignore
 */
function parsePoint(self, feature, coordType, tile, id, key, groupWFS) {
    let height = undefined;
    if (self.heightFunction) {
        height = self.heightFunction.call(self, feature);
    }
    const coordinates = feature.geometry.coordinates;
    const position = new UGPoint(coordinates[0], coordinates[1], coordinates[2] ?? 0);
    const color = self._color;
    let geometry;
    let material;
    let centroid = undefined;
    let useSphere = true;
    /** @type {string | undefined} */
    let type = 'point';
    let pNew = null;

    if (useSphere) {
        type = undefined;
        let radius = 1;
        let widthSegments = 4;
        let heightSegments = 2;
        geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        material = new THREE.MeshBasicMaterial({ color: color });
        centroid = position;
    }
    else {
        type = 'point';
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([position.x, position.y, position.z], 3));
        material = new THREE.PointsMaterial({ color: color });
    }

    // 기하·재질을 WFS 모델로 묶어 이후 높이·라벨 처리에 넘긴다.
    pNew = INTERNAL.createMesh(self, geometry, material, centroid, feature, tile, type);
    pNew.renderOrder = self._renderOrder;

    const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(position.y);
    if (self.heightFunction && defined(height)) {
        pNew.position.z = height * googleScale;
    }
    if (self._defaultZOffset) {
        pNew.userData.defaultScalingZoffset = self._defaultZOffset * googleScale;
        pNew.position.z += pNew.userData.defaultScalingZoffset;
    }

    //+ 지형처리
    onAfterWork.call(self, self, pNew);

    //+ 스타일 처리
    setStyle.call(self, self, pNew);

    setLabel.call(self, self, pNew);

    //+ 외곽선
    if (self._drawLine)
        // 외곽선을 모델의 자식으로 붙여 모델과 함께 관리한다.
        INTERNAL.createEdgeLine(pNew);

    self._tileModelMap[key][id] = true;
    self._modelIds[id] = true;
    if (self.removeFilter(feature.properties.gid)) {
        pNew.visible = false;
        if (defined(pNew.userData.label)) {
            pNew.userData.label.visible = false;
        }
    }

    groupWFS.add(pNew);
}

/**
 * 선 피처를 지역 좌표 곡선의 파이프 모델로 만들어 타일 그룹에 연결합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerFeature} feature WFS 피처와 속성
 * @param {string} coordType 좌표 종류
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
 * @param {string | number} id 모델 중복 판정과 타일별 기록에 사용할 식별자
 * @param {string} key 타일 키
 * @param {import('@UGroup').UGroup} groupWFS 모델을 연결할 타일 캐시 그룹
 *
 * @ignore
 */
function parseString(self, feature, coordType, tile, id, key, groupWFS) {
    let height = undefined;
    if (self.heightFunction) {
        height = self.heightFunction.call(self, feature);
    }
    const coordinates = feature.geometry.coordinates;
    const pts = [];

    if (feature.geometry.type === "LineString") {
        let tempArray = [];
        for (let z = 0; z < coordinates.length; z++) {
            const google = coordinates[z];
            tempArray.push(new UGPoint(google[0], google[1], google[2] ?? 0));
        }
        pts.push(tempArray);
    } else if (feature.geometry.type === "MultiLineString") {
        let googles;
        let google;
        let tempArray = [];
        for (let z = 0; z < coordinates.length; z++) {
            googles = coordinates[z];
            for (let k = 0; k < googles.length; k++) {
                google = googles[k];
                tempArray.push(new UGPoint(google[0], google[1], google[2] ?? 0));
            }
            if (tempArray.length > 0) {
                pts.push(tempArray);
                tempArray = [];
            }
        }
    } else {
        return;
    }
    let pNew = undefined;
    for (let j = 0; j < pts.length; j++) {
        const tmp = pts[j];
        //+ 파이프
        let sumX = 0
        let sumY = 0;
        let sumZ = 0;
        for (let point of tmp) {
            sumX += point.x;
            sumY += point.y;
            sumZ += point.z;
        }
        //커브 만들기 전에 로컬 좌표 변환을 해주어야한다.
        const centroid = new THREE.Vector3();
        centroid.set(sumX / tmp.length, sumY / tmp.length, sumZ / tmp.length);
        for (let i = 0; i < tmp.length; i++) {
            tmp[i].sub(centroid);
        }

        const res = new THREE.CatmullRomCurve3(tmp);
        const pathSegments = 24 * 4;
        let pipeRadius = self._pipeRadius;
        if (defined(self.depthFunction)) {
            pipeRadius = self.depthFunction.call(self, feature);
        }
        const radiusSegments = 8;
        const closed = false;
        const geometry = new THREE.TubeGeometry(
            res,
            pathSegments,
            pipeRadius,
            radiusSegments,
            closed);

        // 현재 레이어 설정을 새 모델 재질에 적용한다.
        const material = INTERNAL.createMaterial(self);

        // 지오메트리 바운딩박스 계산
        geometry.computeBoundingBox();

        //+ 메쉬 생성, 프로퍼티 처리
        // 기하·재질을 WFS 모델로 묶어 이후 높이·라벨 처리에 넘긴다.
        pNew = INTERNAL.createMesh(self, geometry, material, centroid, feature, tile);
        const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(centroid.y);
        if (self.heightFunction && defined(height)) {
            pNew.position.z = height * googleScale;
        }

        if (self._defaultZOffset) {
            pNew.userData.defaultScalingZoffset = self._defaultZOffset * googleScale;
            pNew.position.z += pNew.userData.defaultScalingZoffset;
        }

        //+ 스타일 처리
        setStyle.call(self, self, pNew);

        //+ 지형처리
        onAfterWork.call(self, self, pNew);

        setLabel.call(self, self, pNew);

        //+ 외곽선
        if (self._drawLine)
            // 외곽선을 모델의 자식으로 붙여 모델과 함께 관리한다.
            INTERNAL.createEdgeLine(pNew);

        groupWFS.add(pNew);

        self._tileModelMap[key][id] = true;
        self._modelIds[id] = true;
        if (self.removeFilter(feature.properties.gid)) {
            pNew.visible = false;
            if (defined(pNew.userData.label)) {
                pNew.userData.label.visible = false;
            }
        }
    }
}


/**
 * 폴리곤의 각 고리를 돌출 모델로 만들어 스타일·높이·라벨을 적용하고 타일 그룹에 연결합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerFeature} feature WFS 피처와 속성
 * @param {string} coordType 좌표 종류
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
 * @param {string | number} id 모델 중복 판정과 타일별 기록에 사용할 식별자
 * @param {string} key 타일 키
 * @param {import('@UGroup').UGroup} groupWFS 모델을 연결할 타일 캐시 그룹
 *
 * @ignore
 */
function parsePolygon(self, feature, coordType, tile, id, key, groupWFS) {
    let height = undefined;

    let pNew;
    if (self.heightFunction) {
        height = self.heightFunction.call(self, feature);
    }
    const coordinates = feature.geometry.coordinates;
    const pts = [];
    for (const googleCoordArray of coordinates) {
        if (feature.geometry.type === "Polygon") {
            // 고리 좌표를 모델 생성에 사용할 중심과 좌표 묶음으로 바꾼다.
            const result = INTERNAL.transWorldPosition(googleCoordArray);
            if (result) pts.push(result);
        } else if (feature.geometry.type === "MultiPolygon") {
            for (const googleCoords of googleCoordArray) {
                // 고리 좌표를 모델 생성에 사용할 중심과 좌표 묶음으로 바꾼다.
                const result = INTERNAL.transWorldPosition(googleCoords);
                if (result) pts.push(result);
            }
        }
    }

    const style = createStyle.call(self, self, feature);
    if (!defined(style) || !style.visible) {
        return;
    }
    // 보관한 이미지를 사용하는 스타일인지 판정한다.
    const setTextureStyle = INTERNAL.isSetStyle(self, style);

    const materialInfo = setMaterial.call(self, self, feature, style, setTextureStyle);
    if (!materialInfo) return;

    const { material, imgUrl, styleInfo } = materialInfo;
    if (!material) return;

    for (let j = 0; j < pts.length; j++) {
        const pt = pts[j];
        const positions = pt.positions;
        const positionType = pt.type;
        const center = pt.center;
        const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(center);

        // 좌표·높이·이미지 설정에 맞는 모델 기하를 준비한다.
        const geometry = INTERNAL.createPolygonGeometry(self, buildShape, feature, positions, center, googleScale, positionType, setTextureStyle); //2d or 3d coordinate
        if (!geometry) continue;

        //+ 메쉬 생성
        // 기하·재질을 WFS 모델로 묶어 이후 높이·라벨 처리에 넘긴다.
        pNew = INTERNAL.createMesh(self, geometry, material, center, feature, tile);
        pNew.renderOrder = self._renderOrder;
        pNew.userData.id = id;
        pNew.userData.setTextureStyle = setTextureStyle;
        pNew.userData.center = center;
        pNew.userData.coordinates = positions;
        pNew.userData.coordinatesType = positionType;
        pNew.userData.googleScale = googleScale;
        if (imgUrl)
            pNew.userData.refimgurl = imgUrl;

        if (styleInfo)
            pNew.userData.styleinfo = styleInfo;

        if (self.heightFunction && defined(height))
            pNew.position.z = height * googleScale;

        if (self._defaultZOffset) {
            pNew.userData.defaultScalingZoffset = self._defaultZOffset * googleScale;
            pNew.position.z += pNew.userData.defaultScalingZoffset;
        }
        //+ 색상 처리
        // setStyle.call(self, self,pNew);

        //+ 지형처리
        onAfterWork.call(self, self, pNew);

        setLabel.call(self, self, pNew);

        //+ 외곽선
        if (self._drawLine)
            // 외곽선을 모델의 자식으로 붙여 모델과 함께 관리한다.
            INTERNAL.createEdgeLine(pNew);

        if (self.removeFilter(pNew.userData.id) || self.removeFilter(pNew.userData.oid)) {
            pNew.visible = false;
        }

        if (self.editFilter(pNew.userData.id) || self.editFilter(pNew.userData.oid)) {
            //pNew.visible = false;
            self.setEditEvent([pNew])
        }
        groupWFS.add(pNew);
    }

    self._tileModelMap[key][id] = true;
    self._modelIds[id] = true;
    if (self.removeFilter(feature.properties.gid)) {
        const lastMesh = /** @type {U3dModelWFSLayerMesh} */(pNew);
        lastMesh.visible = false;
        if (defined(lastMesh.userData.label)) {
            lastMesh.userData.label.visible = false;
        }
    }
}

/**
 * 기존 모델 라벨을 해제한 뒤 표시 문자열이 있을 때 새 POI를 생성하여 모델·라벨 맵·그룹에 연결합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
 * @param {Record<string, any>} opt 재질·외곽선 또는 라벨 입력 설정
 *
 * @ignore
 */
function _createPOI(self, mesh, opt) {
    _removePOI.call(self, self, mesh);

    const center = mesh.getBBox().getCenter(new THREE.Vector3());
    const zOffset = opt.zOffset;
    if (defined(zOffset)) {
        mesh.userData.labelZoffset = zOffset;
        center.z += zOffset;
    }

    if (opt.textLabel) { // textLabel 있을 경우에만 생성
        let poi = new U3dPOI({
            name: defaultValue(mesh._ufeature.id, mesh.uuid),
            position: center,
            label: defaultValue(opt.textLabel, undefined),
            image: defaultValue(opt.imgLabel, undefined),
            imageSize: defaultValue(opt.imgSize, undefined),
            color: defaultValue(opt.color, undefined),
            depthTest: false
        });
        mesh.userData.label = poi;
        self._labelMap.set(poi.name, poi);
        self._labelGroup?.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(poi)));
    }
}

/**
 * 모델 또는 라벨 키로 POI를 찾아 해제하고 해당 경로의 그룹·맵 연결을 정리합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerMesh | string | number} item 모델 객체 또는 라벨 맵 키
 *
 * @ignore
 */
function _removePOI(self, item) {
    if (item instanceof UWfsMesh || item instanceof THREE.Mesh) {
        const label = (/** @type {U3dModelWFSLayerMesh} */(item)).userData.label;
        if (label) {
            UDEF.disposeObject3D(label);
            self._labelGroup?.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(label)));
        }
    } else {
        const key = /** @type {string | number} */(item);
        const label = self._labelMap.get(key);
        if (label) {
            UDEF.disposeObject3D(label);
            self._labelGroup?.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(label)));
            self._labelMap.delete(key);
        }
    }

}

/**
 * 사용자 콜백 또는 SLD 규칙이 정한 스타일 객체에 레이어 색상·투명도·가시성 기본값을 채웁니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerFeature} feature WFS 피처와 속성
 * @returns {U3dModelWFSLayerFeatureStyle} 계산하거나 생성한 결과
 *
 * @ignore
 */
function createStyle(self, feature) {
    /** @type {U3dModelWFSLayerFeatureStyle} */
    let style;
    if (defined(feature) && self.styleFunction && typeof self.styleFunction === 'function') {
        style = self.styleFunction(feature); //style 확인
    } else if (defined(self._sld.rules)) {
        // SLD 조건으로 선택한 표현값에 이후 레이어 기본값을 채운다.
        style = INTERNAL.getSLDStyle(self._sld.rules, feature);
    }
    style = style || {};

    style.color = defaultValue(style.color, self._color);
    style.opacity = defaultValue(style.opacity, self._opacity);

    let visible = defaultValue(style.visible, self._visible);
    visible = style.opacity === 0 ? false : visible;
    style.visible = visible;
    return style;
}

/**
 * 모델의 스타일을 계산하여 기하·재질·라벨·가시성을 갱신합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
 *
 * @ignore
 */
function setStyle(self, mesh) {
    let feature = mesh._ufeature;
    let properties = mesh._uproperties;
    if (!defined(properties))
        return;

    const geometry = mesh.geometry;
    if (!defined(geometry))
        return;


    const style = createStyle.call(self, self, feature);
    let color = style.color;
    let opacity = style.opacity;
    let visible = style.visible;

    //sphere 타입 스타일 설정
    if (geometry instanceof THREE.SphereGeometry) {
        let size = defaultValue(style.size, geometry.parameters.radius);
        let widthSegments = defaultValue(style.widthSegments, geometry.parameters.widthSegments);
        let heightSegments = defaultValue(style.heightSegments, geometry.parameters.heightSegments);

        geometry.dispose(); // 기존 geometry 해제
        mesh.geometry = new THREE.SphereGeometry(size, widthSegments, heightSegments);
    }

    if (visible) {
        let label = style.label;
        if (label) {
            _createPOI.call(self, self, mesh, label); // mesh 생성 후에 추가 하기
        }
        // 보관한 이미지를 사용하는 스타일인지 판정한다.
        if (INTERNAL.isSetStyle(self, style)) {
            let texture;
            let materials;

            if (defined(mesh.userData.setTextureStyle) && !mesh.userData.setTextureStyle) {
                const coordinates = mesh.userData.coordinates;
                const coordType = mesh.userData.coordinatesType;
                const center = mesh.userData.center;
                const googleScale = mesh.userData.googleScale;
                const setTextureStyle = true;
                // 좌표·높이·이미지 설정에 맞는 모델 기하를 준비한다.
                const geometry = INTERNAL.createPolygonGeometry(self, buildShape, feature, coordinates, center, googleScale, coordType, setTextureStyle); //2d or 3d coordinate
                if (geometry) {
                    mesh.geometry.dispose();
                    mesh.geometry = geometry;
                    mesh.userData.setTextureStyle = true;
                    mesh.userData.styleinfo = undefined
                }
            }

            if (defined(style.imgurl) && style.imgvisible) {
                texture = self._textures[style.imgurl];
                mesh.userData.refimgurl = style.imgurl;
            } else {
                let textureUrl;
                if (Array.isArray(self._textureUrl)) {
                    textureUrl = self._textureUrl[0];
                } else {
                    textureUrl = self._textureUrl;
                }
                texture = self._textures[textureUrl];
                mesh.userData.refimgurl = textureUrl;
            }

            if (geometry instanceof THREE.SphereGeometry) {
                let label = mesh.userData.label;

                const img = mesh.userData.refimgurl;
                const imgsize = style.imgsize;
                const opt = {
                    imgLabel: img,
                    imgSize: imgsize
                }
                if (label) {
                    if (label instanceof U3dPOI) {
                        label.image = img;
                        label.imageSize = defaultValue(imgsize, label.imageSize);
                        label.setImage(img);
                    }
                } else {
                    _createPOI.call(self, self, mesh, opt);
                }

            } else {
                // 현재 레이어 설정을 새 모델 재질에 적용한다.
                let sideM = INTERNAL.createMaterial(self, { side: THREE.FrontSide, map: texture });
                // 현재 레이어 설정을 새 모델 재질에 적용한다.
                let topM = INTERNAL.createMaterial(self, { side: THREE.FrontSide, map: texture });
                materials = [sideM, topM];

                UDEF.assert(defined(materials) && Array.isArray(materials));
                if (defined(mesh.material)) {
                    if (Array.isArray(mesh.material))
                        for (let mat of mesh.material) {
                            mat.dispose();
                        }
                    else
                        mesh.material.dispose();
                }
                mesh.material = materials;
            }
        }
        else {
            if (!Array.isArray(mesh.material)) {
                if (mesh.material)
                    mesh.material.dispose();
            } else if (Array.isArray(mesh.material)) {
                for (let mat of mesh.material) {
                    mat.dispose();
                }
            }
            // 현재 레이어 설정을 새 모델 재질에 적용한다.
            mesh.material = INTERNAL.createMaterial(self, { premultipliedAlpha: false });

            if (mesh.userData.setTextureStyle) {
                const coordinates = mesh.userData.coordinates;
                const coordType = mesh.userData.coordinatesType;
                const center = mesh.userData.center;
                const googleScale = mesh.userData.googleScale;
                const setTextureStyle = false;
                // 좌표·높이·이미지 설정에 맞는 모델 기하를 준비한다.
                const geometry = INTERNAL.createPolygonGeometry(self, buildShape, feature, coordinates, center, googleScale, coordType, setTextureStyle); //2d or 3d coordinate
                if (geometry) {
                    mesh.geometry.dispose();
                    mesh.geometry = geometry;
                    mesh.userData.setTextureStyle = false;
                }
            }
        }
    }

    if (!Array.isArray(mesh.material)) {
        if (defined(mesh.material)) {

            let material = mesh.material;
            if (material._oriColor) {
                material._oriColor.set(color);
            } else {
                material.color.set(color);
            }
            if (material._oriOpacity) {
                material._oriOpacity = opacity;
            } else {
                material.opacity = opacity;
            }
            mesh.material.transparent = mesh.material.opacity < 1;
            //mesh.material.needsUpdate = true;
            //+ 스타일 정보
            mesh.userData.styleinfo = {
                color: color,
                opacity: opacity,
                visible: visible,
                transparent: mesh.material.transparent
            };
        }
    }

    mesh.visible = visible;
}

/**
 * 폴리곤 생성에 사용할 재질과 선택한 이미지 URL·스타일 정보를 반환합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerFeature} feature WFS 피처와 속성
 * @param {U3dModelWFSLayerFeatureStyle} style 적용할 스타일
 * @param {boolean} [setStyle=false] 텍스처 재질 사용 여부
 * @returns {{material: ModelMaterial | Array<ModelMaterial> | undefined, imgUrl: string | undefined, styleInfo: Record<string, any>} | undefined} 계산하거나 생성한 결과
 *
 * @ignore
 */
function setMaterial(self, feature, style, setStyle = false) {
    let properties = feature.properties;
    if (!defined(properties))
        return;

    let color = style.color;
    let opacity = style.opacity;
    let visible = style.visible;

    let imgUrl, material;
    if (visible) {
        if (setStyle) {
            let texture;
            if (defined(style.imgurl) && style.imgvisible) {
                texture = self._textures[style.imgurl];
                imgUrl = style.imgurl;
            } else {
                let textureUrl;
                if (Array.isArray(self._textureUrl)) {
                    textureUrl = self._textureUrl[0];
                } else {
                    textureUrl = self._textureUrl;
                }
                texture = self._textures[textureUrl];
                imgUrl = textureUrl;
            }

            // 현재 레이어 설정을 새 모델 재질에 적용한다.
            let sideM = INTERNAL.createMaterial(self, { side: THREE.FrontSide, map: texture });
            // 현재 레이어 설정을 새 모델 재질에 적용한다.
            let topM = INTERNAL.createMaterial(self, { side: THREE.FrontSide, map: texture });
            material = [sideM, topM];

        }
        else {
            // 현재 레이어 설정을 새 모델 재질에 적용한다.
            material = INTERNAL.createMaterial(self, { premultipliedAlpha: false });
            if (material._oriColor) {
                material._oriColor.set(color);
            } else {
                material.color.set(color);
            }
        }
    }
    const styleInfo = {
        color: color,
        opacity: opacity,
        visible: visible,
        transparent: opacity < 1
    };
    return { material, imgUrl, styleInfo };
}

/**
 * 사용자 라벨 콜백과 라벨 가시성 설정으로 모델의 POI 생성을 시도합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
 *
 * @ignore
 */
function setLabel(self, mesh) {
    const feature = mesh._ufeature;
    const properties = mesh._uproperties;
    if (!defined(properties)) return;

    /** @type {Record<string, any>} */
    let labelOpt;
    if (defined(feature) && self.labelFunction && typeof self.labelFunction === 'function') {
        labelOpt = self.labelFunction(feature);
    }
    labelOpt = labelOpt || {};

    const visible = defaultValue(labelOpt.visible, self._labelVisible);
    if (visible) {
        _createPOI.call(self, self, mesh, labelOpt);
    }
}


/**
 * 라벨 표시 설정에 따라 라벨 그룹을 주석 장면에 연결하고 각 라벨의 표시를 전환합니다.
 *
 * @param {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer} self 처리 대상 WFS 레이어
 *
 * @ignore
 */
function updateLabelVisible(self) {
    if (self._labelVisible) {
        self._app._sceneComment.add(/** @type {import('three').Object3D} */(/** @type {unknown} */((/** @type {import('@UGroup').UGroup} */(self._labelGroup)))));
    }
    (/** @type {import('@UGroup').UGroup} */(self._labelGroup)).children.forEach(function(label) {
        const poi = /** @type {{show: () => void, hide: () => void}} */(/** @type {unknown} */(label));
        if (self._labelVisible)
            poi.show();
        else if (!self._labelVisible)
            poi.hide();
    })
}


export { U3dModelWFSLayer, lerpVector };
