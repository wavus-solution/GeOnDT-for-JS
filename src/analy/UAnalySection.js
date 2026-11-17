// @ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UAnaly} from '@UAnaly';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {UDEF} from '@union3d/core/UDEF';
import {UMesh} from '@UMesh';
import {UGroup} from '@union3d/core/UGroup';
import {U3dCircle} from '@union3d/geometry/U3dCircle';
import {U3DTilesMesh} from '@union3d/core/mesh/U3DTilesMesh';
import {USharedMesh} from '@union3d/core/mesh/USharedMesh';
import {U3dMessage} from '@U3dMessage';
import {U3dLine} from '@union3d/geometry/U3dLine';
import {U3dSelect} from '@union3d/select/U3dSelect';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalySection.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 횡단면·종단면·원형·원기둥 입력 영역으로 모델을 선택하고 측정 라벨을 관리하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 */
class UAnalySection extends UAnaly {
    /**
     * @override
     *
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];
    /**
     * 분석 객체의 이름입니다.
     *
     * @type {string}
     */
    name = 'Section';
    /**
     * 앱에 등록한 클릭 이벤트의 식별자입니다.
     *
     * @type {string|undefined}
     *
     * @ignore
     */
    _clickId = undefined;
    /**
     * 앱에 등록한 더블클릭 이벤트의 식별자입니다.
     *
     * @type {string|undefined}
     *
     * @ignore
     */
    _dblClickId = undefined;
    /**
     * @override
     *
     * 측정점과 미리보기 라벨을 소유하는 그룹입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */
    _poiGroup = new UGroup();
    /**
     * 현재 입력 중인 단면의 월드 좌표(EPSG:3857) 목록입니다.
     *
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _drawPoint = [];
    /**
     * 확정한 영역 형상의 식별자 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    _filteredList = [];
    /**
     * 확정한 영역별 모델·라벨 연결 정보입니다.
     *
     * @type {Record<string, FilteredEntry | undefined>}
     *
     * @ignore
     */
    _filteredObject = {};
    /**
     * 점 라벨과 수직 보조선의 표시 방식을 선택합니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _extension = 'base';
    /**
     * 확정하여 주석 장면에 표시한 영역 형상입니다.
     *
     * @type {Array<import('@UMesh').UMesh>}
     *
     * @ignore
     */
    _pickList = [];
    /**
     * 모델의 선택·외곽선·재로딩 구독을 소유하는 전용 선택기입니다.
     *
     * @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */
    _selector;
    /**
     * 입력 중인 원형 또는 원기둥 형상입니다.
     *
     * @type {import('@union3d/geometry/U3dCircle').U3dCircle | import('@UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _curCircle = undefined;
    /**
     * 모델 영역 판정에 사용할 측정 도형입니다.
     *
     * @type {unknown}
     *
     * @ignore
     */
    _feature = undefined;
    /**
     * 현재 원형 입력의 위경도 측정점 목록입니다.
     *
     * @type {Array<object>}
     *
     * @ignore
     */
    _featurePoints = [];
    /**
     * 이후 생성하는 보조선의 너비입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _lineWidth = 0.1;
    /**
     * 입력점과 도형을 관리하는 측정 레이어입니다.
     *
     * @type {SelectLayerLike | undefined}
     *
     * @ignore
     */
    _selectLayer = undefined;
    /**
     * 이 분석 객체에 바인딩한 마우스 이동 리스너입니다.
     *
     * @type {Function|undefined}
     *
     * @ignore
     */
    _onChange = undefined;
    /**
     * 격자 스프라이트 이미지의 주소입니다.
     *
     * @type {string|undefined}
     *
     * @ignore
     */
    _spriteImageUrl = undefined;
    /**
     * 격자 이미지 로딩이 반환한 텍스처입니다.
     *
     * @type {import('three').Texture|undefined}
     *
     * @ignore
     */
    _spriteMap = undefined;
    /**
     * 격자 스프라이트가 사용하는 머티리얼입니다.
     *
     * @type {import('three').SpriteMaterial|undefined}
     *
     * @ignore
     */
    _spriteMat = undefined;
    /**
     * 화면 좌표를 단면 입력점으로 투영할 스프라이트입니다.
     *
     * @type {import('three').Sprite|undefined}
     *
     * @ignore
     */
    _sprite = undefined;
    /**
     * 마우스 이동에 맞춰 갱신하는 미리보기 라벨입니다.
     *
     * @type {MeasurePOILike | undefined}
     *
     * @ignore
     */
    _prevLine = undefined;
    /**
     * 확정 또는 제거할 측정 도형 참조입니다.
     *
     * @type {unknown}
     *
     * @ignore
     */
    _measureFeature = undefined;
    /**
     * 현재 종단면 입력의 점·거리선을 담은 그룹입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup|undefined}
     *
     * @ignore
     */
    _currentGroup = undefined;
    /**
     * 원형 입력의 시작점 라벨입니다.
     *
     * @type {MeasurePOILike | undefined}
     *
     * @ignore
     */
    _currentPoi = undefined;

    /**
     * UAnalySection 클래스 생성자입니다. <br>
     * 분석 객체만 생성하며 앱은 setApp()으로 연결합니다.
     *
     * @param {UAnalySectionCO} [opt] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt) {
        super();
        opt = normalizeOptionKeys(opt || {}, new.target);
        const self = /** @type {UAnalySection} */(this);
        self.name = defaultValue(opt.name, 'Section');
        self._clickId = undefined;
        self._dblClickId = undefined;
        self._poiGroup = new UGroup();
        self._drawPoint = [];
        self._filteredList = [];
        self._filteredObject = {};
        self._extension = 'base';
        self._pickList = [];
        self._curCircle = undefined;
        self._feature = undefined;
        self._featurePoints = [];
        self._lineWidth = 0.1;
    }

    /**
     * @override
     *
     * 단면 입력을 처리할 앱과 모델 선택기를 연결합니다. <br>
     * 같은 앱에 다시 연결하면 선택을 유지하고, 다른 앱으로 바꾸면 기존 선택기를 제거합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 단면 분석을 사용할 앱
     */
    setApp(app) {
        if (this._selector && this._app === app) {
            super.setApp(app);
            return;
        }
        this._selector?.remove();
        super.setApp(app);
        // 입력 이벤트는 Section이 소유합니다. 선택기의 active()/setMode()를 호출하지 않아
        // 단면의 클릭·미리보기 흐름에 별도의 클릭 선택이 끼어들지 않게 합니다.
        const selector = new U3dSelect();
        // 데이터 모델은 선택기 공통 puid 정책으로 구분하므로 별도 식별 플래그를 설정하지 않습니다.
        selector.setApp(app);
        this._selector = selector;
    }

    /**
     * 선택기는 즉시 선택을 반영하지만 반환 Promise의 실패도 관찰해야 합니다. <br>
     * 공개 addSelected()의 기존 void 반환은 유지하며 비동기 실패 원본을 기록합니다.
     *
     * @param {unknown} error 선택기가 전달한 실패 원인
     *
     * @ignore
     */
    static #reportSelectionError(error) {
        console.error('UAnalySection selection failed', error);
    }

    /**
     * @override
     *
     * 현재 입력 모드의 단면 분석을 활성화합니다. <br>
     * 앱에 연결한 뒤 호출하며 입력 이벤트·측정 레이어·미리보기를 준비합니다. <br>
     * 기존 앱의 click·dblclick 구독은 현재 모드의 구독으로 교체합니다.
     */
    active() {
        super.active();
        const self = /** @type {UAnalySection} */(this);
        const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        if (self._clickId !== undefined || self._dblClickId !== undefined) {
            self.off();
        }
        app_._mode = UDEF.APP_MODE._SECTION;
        app_.setMode(app_._mode);
        removeEventListener.call(self);
        self._selectLayer = getSelectLayer.call(self);
        addEventListener.call(self, self._type);
        app_.setProperties(UDEF.DEPTH_PREVLINE_TYPE.BASE, defaultValue(self._extension, 'base'));
        // 시작점 생성후 마우스 이동이벤트 추가
        self._onChange = onChange.bind(self);

        // 2D --> 3D값을 추출할때, sprite 픽킹으로 잡아낸다.
        const imageUrl = self._spriteImageUrl;
        if (defined(imageUrl)) {

            self._spriteMap = new THREE.TextureLoader().load(imageUrl,
                function (_e) {
                }
                , function (_e) {
                }
                ,
                function (err) {
                    console.log('Image loader error' + ' // please Use function [setGridSpriteImage(url, size, opacity) ]', err);
                });

            self._spriteMat = new THREE.SpriteMaterial({map: self._spriteMap, color: 0xffffff});

            // 격자 sprite 생성
            self._sprite = new THREE.Sprite(self._spriteMat);
            self._sprite.scale.x = 1000;
            self._sprite.scale.y = 1000;
            self._sprite.scale.z = 1000;
            /** @type {import('three').SpriteMaterial} */(self._sprite.material).depthWrite = false;
            /** @type {import('three').SpriteMaterial} */(self._sprite.material).transparent = true;
            /** @type {import('three').SpriteMaterial} */(self._sprite.material).opacity = 0.7;
        }
        // 마우스 이동시 미리보기 선 생성
        createPrevLine.call(self);
        if (self._prevLine) self._prevLine.visible = false;
        if (this._sceneComment) this._sceneComment.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._poiGroup)));
    }

    /**
     * @override
     *
     * 단면 분석을 비활성화하고 앱의 click·change 이벤트를 해제합니다. <br>
     * 비활성 상태에서 다시 호출하면 아무 작업도 하지 않습니다. <br>
     * 확정한 영역과 선택 결과는 clear()로 별도 제거합니다.
     */
    deactive() {
        const self = /** @type {UAnalySection} */(this);
        if (!self._isActive) {
            return;
        }
        super.deactive();
        const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        app_.unkey('click', self._clickId);
        app_.unkey('change', /** @type {string|undefined} */(/** @type {unknown} */(self._onChange)));
        app_.off('click');
        app_.off('change');
        self._clickId = undefined;
        self._onChange = undefined;
    }

    /**
     * @override
     *
     * 확정한 단면 영역과 라벨·측정 도형을 제거하고 모델 선택과 외곽선을 해제합니다. <br>
     * 앱이 연결된 상태에서 호출하며 분석 객체를 재사용할 수 있습니다.
     */
    clear() {
        const self = /** @type {UAnalySection} */(this);
        const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        self.removeAllFilter();
        if (defined(self._poiGroup)) {
            if (self._poiGroup.children.length > 0) {
                self._poiGroup.traverse(function (poi) {
                    UDEF.disposeObject3D(poi);
                })
                self._poiGroup.clear();
            }
            if (this._sceneComment) this._sceneComment.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(self._poiGroup)));
            self._poiGroup = new UGroup();
            self._filteredObject = {};
            self._filteredList = [];
            if (self._pickList.length > 0) {
                self._pickList.forEach(function (pick) {
                    UDEF.disposeObject3D(pick);
                    if (self._sceneComment) self._sceneComment.remove(pick);
                })
                self._pickList = [];
            }
            if (defined(self._sprite) && this._sceneComment)
                this._sceneComment.remove(/** @type {import('three').Object3D} */(self._sprite));
        }

        self.clearSelect();
        app_._measureLayer.clearDrawFeature();
        clearMeasureFeature.call(self);
        self.removeAllHighlight();
        app_.setUpdateDate();
    }

    /**
     * 이후 생성하는 단면 보조선의 너비를 지정합니다. <br>
     * 이미 생성한 선에는 다시 적용하지 않습니다.
     *
     * @param {number} width 보조선 너비
     */
    setLineWidth(width) {
        const self = /** @type {UAnalySection} */(this);
        self._lineWidth = width;
    }

    /**
     * 이후 생성할 단면 보조선의 너비를 반환합니다.
     *
     * @returns {number} 설정한 보조선 너비
     */
    getLineWidth() {
        const self = /** @type {UAnalySection} */(this);
        return self._lineWidth;
    }

    /**
     * 단면 분석 객체에 완료 또는 선택 이벤트의 구독 함수를 등록합니다. <br>
     * 등록 함수는 분석 객체를 this로 받아 호출됩니다.
     *
     * @param {EventCallBack} func 이벤트를 수신할 함수
     * @param {string} [event] 구독할 이벤트 이름이며 생략하면 click
     */
    passToClickEvent(func, event) {
        const self = /** @type {UAnalySection} */(this);
        if (!defined(func))
            return;
        if (!defined(event))
            self.on('click', func);
        else {
            self.on(event, func);
        }
    }

    /**
     * 화면 위치를 단면 입력점으로 변환할 격자 스프라이트(sprite) 이미지를 지정합니다. <br>
     * 이미지는 비동기로 요청하며 이 호출에서 장면에 추가하지 않습니다. <br>
     * 크기·불투명도를 생략하거나 음수로 지정하면 각각 1000·0.7을 사용하며 0은 유지합니다.
     *
     * @param {string} url 격자 이미지 주소
     * @param {number} [size=1000] 격자 이미지의 세 축 표시 크기
     * @param {number} [opacity=0.7] 격자 이미지의 불투명도
     */
    setGridSpriteImage(url, size, opacity) {
        const self = /** @type {UAnalySection} */(this);
        if (!defined(url)) {
            return;
        }
        if (!defined(size) || size < 0) {
            size = 1000;
        }
        if (!defined(opacity) || opacity < 0) {
            opacity = 0.7;
        }
        self._spriteImageUrl = url;
        self._spriteMap = new THREE.TextureLoader().load(url, function (_e) {
            }
            , function (_e) {
            }
            ,
            function (err) {
                console.log('Image loader error' + ' // please Use function [setGridSpriteImage(url, size, opacity)]', err);
            });
        self._spriteMat = new THREE.SpriteMaterial({
            map: self._spriteMap, color: 0xffffff,
            sizeAttenuation: false
        });

        // 격자 sprite 생성
        self._sprite = new THREE.Sprite(self._spriteMat);
        self._sprite.scale.x = size;
        self._sprite.scale.y = size;
        self._sprite.scale.z = size;
        /** @type {import('three').SpriteMaterial} */(self._sprite.material).depthWrite = false;
        /** @type {import('three').SpriteMaterial} */(self._sprite.material).transparent = true;
        /** @type {import('three').SpriteMaterial} */(self._sprite.material).opacity = opacity;
        //const grid = new InfiniteGridHelper(10, 50, new THREE.Color(0x444444), 2000, 'xyz' );
    }

    /**
     * 식별자에 해당하는 확정 단면 영역과 연결된 선택 모델·라벨을 제거합니다. <br>
     * 형상 식별자는 대소문자를 구분하지 않고 찾습니다.
     *
     * @param {string} id getFilteredList()로 확인한 영역 식별자
     */
    removeFilter(id) {
        const self = /** @type {UAnalySection} */(this);
        const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        if (!self._sceneComment) return;
        const sceneListTarget = self._sceneComment.children;
        const pickTarget = self._pickList;

        id = '' + id;
        if (!defined(id) || sceneListTarget.length === 0) {
            return;
        }

        const childTarget = pickTarget.find((child) => {
            const childId = child.id;
            return id.toUpperCase() === childId.toString().toUpperCase();
        })
        if (childTarget) {
            UDEF.disposeObject3D(childTarget);
        }

        self._pickList = pickTarget.filter(function (item) {
            const itemId = item.id;
            return !(id.toUpperCase() === itemId.toString().toUpperCase());
        });
        const removeTarget = sceneListTarget.find(function (child) {
            if (child instanceof UMesh || child instanceof U3dCircle) {
                const childId = child.id;
                return id.toUpperCase() === childId.toString().toUpperCase();
            }
            return false;
        });
        if (!defined(removeTarget)) {
            return;
        }

        self._filteredList = self._filteredList.filter(function (childId) {
            return !(id.toUpperCase() === childId.toString().toUpperCase());
        });

        const target = self._poiGroup.children.find((child) => {
            const childId = child.name;
            const filteredEntry = self._filteredObject[id];
            return filteredEntry && filteredEntry.poiGroupID.toString().toUpperCase() === childId.toString().toUpperCase();
        })

        if (target) {
            UDEF.disposeObject3D(target);
            self._poiGroup.remove(target);
        }

        const filteredEntry_ = self._filteredObject[id];
        const modelList = filteredEntry_ ? filteredEntry_.arr : [];
        for (let i = 0; i < modelList.length; i++) {
            const obj = modelList[i];
            try {
                removeSelectedObject.call(self, obj);
            } catch (e) {
                console.log('Filter remove fail', e)
            }
        }

        // 삭제 하려는 Mesh와 연결된 modelList 삭제
        self._filteredObject[id] = undefined;
        delete self._filteredObject[id];

        app_._sceneComment.remove(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (pickTarget)));
        app_._sceneComment.remove(removeTarget);
        clearMeasureFeature.call(self);
        self.dispatchEvent({type: 'click'});
        app_.changeUpdate();
    }

    /**
     * 확정 단면 영역을 모두 제거하고 연결된 모델의 선택과 외곽선을 해제합니다. <br>
     * 앱과 주석 장면이 연결된 상태에서 호출합니다.
     */
    removeAllFilter() {
        const self = /** @type {UAnalySection} */(this);
        if (defined(self._pickList))
            self._pickList.forEach(function (filterMesh) {
                self.removeFilter(String(filterMesh.id));
            })
    }

    /**
     * 확정한 단면 영역의 식별자 목록을 반환합니다. <br>
     * 반환 배열은 분석 객체가 사용하는 원본입니다.
     *
     * @returns {Array<string>} 영역 식별자 배열
     */
    getFilteredList() {
        const self = /** @type {UAnalySection} */(this);
        return self._filteredList;
    }

    /**
     * 확정한 각 단면 영역의 모델 목록·입력 모드·라벨 연결 정보를 반환합니다. <br>
     * 반환 사전은 분석 객체가 사용하는 원본입니다.
     *
     * @returns {Record<string, unknown>} 영역 식별자를 키로 하는 결과 사전
     */
    getFilteredObject() {
        const self = /** @type {UAnalySection} */(this);
        return self._filteredObject;
    }

    /**
     * @override
     *
     * 다음 활성화에서 사용할 단면 입력 모드를 지정합니다. <br>
     * 활성 상태의 이벤트 연결을 즉시 바꾸지는 않습니다.
     *
     * @param {string} type 횡단면 crossSection, 종단면 longitudinal, 원형 circle 또는 원기둥 cylinder
     */
    setType(type) {
        const self = /** @type {UAnalySection} */(this);

        if (!defined(type)) {
            return;
        }
        self._type = type;
    }

    /**
     * 두 위경도 좌표의 측정 라벨을 만들고 거리선 생성을 요청합니다. <br>
     * 앱이 연결되어 있어야 하며 거리선은 현재 측정 그룹이 있는 경우에만 추가됩니다.
     *
     * @param {GeoPosition} point1 시작점의 위경도 좌표계(EPSG:4326) 좌표
     * @param {GeoPosition} point2 끝점의 위경도 좌표계(EPSG:4326) 좌표
     */
    getResultFromCoordinate(point1, point2) {
        const self = /** @type {UAnalySection} */(this);

        if (!defined(point1) || !defined(point2))
            return;

        const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(self._drawArg);
        const p1 = new THREE.Vector3(point1.x, point1.y, point1.z);
        const p2 = new THREE.Vector3(point2.x, point2.y, point2.z);

        const coord1 = drawArg_.getGeographicToWorld(p1.x, p1.y, p1.z);
        const coord2 = drawArg_.getGeographicToWorld(p2.x, p2.y, p2.z);

        const coordArray = [];
        coordArray.push(coord1);
        coordArray.push(coord2);

        for (let i = 0; i < coordArray.length; i++) {
            const tempCoodi = coordArray[i];

            const poi = makePoint.call(self, tempCoodi);
            if (!poi) continue;
            const poi1 = /** @type {{material: {size: number} | null | undefined}} */(/** @type {unknown} */ (poi.children[1]));
            if (poi1 && poi1.material) poi1.material.size = 15;

            poi.name = 'measure';
            if (i === 0) {
                self._poiGroup.add(poi);
            } else {
                const poiLen = self._poiGroup.children.length - 1;
                self._poiGroup.children[poiLen].children.push(poi);
            }
            if (self._extension === 'extensions') {
                const position = new THREE.Vector3(tempCoodi.x, tempCoodi.y, tempCoodi.z);
                self.drawVerticalLine(position);
            }
        }

        const start = new THREE.Vector3(coordArray[0].x, coordArray[0].y, coordArray[0].z);
        const end = new THREE.Vector3(coordArray[1].x, coordArray[1].y, coordArray[1].z);
        // 시작점 - 끝점을 잇는 직선 생성
        self.getDistanceLine(start, end);
        (/** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app)).setUpdateDate();
    }

    /**
     * 선택기의 모델 선택과 외곽선을 해제합니다. <br>
     * 단면 영역 자체는 제거하지 않으며 그리기 갱신을 요청합니다.
     */
    clearSelect() {
        // 모델·재로딩 구독·분할 상태의 해제는 선택기의 단일 경로로 처리합니다.
        this._selector?.clearSelect(true);
    }

    /**
     * 모델을 단면 선택 결과에 추가하고 기본 외곽선을 표시합니다. <br>
     * 배열 입력은 각 모델을 순서대로 선택합니다.
     *
     * @param {import('@UMesh').UMesh | Array<import('@UMesh').UMesh>} object 선택할 모델 또는 모델 배열
     */
    addSelected(object) {
        if (object instanceof UMesh) {
            const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
            const hasLayer = defined(app.getLayer(/** @type {string} */ (object.getLayerName())));
            const selector = /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (this._selector);
            selector.addSelected(object).catch(UAnalySection.#reportSelectionError);
            if (!hasLayer) {
                // 목록과 공개 이벤트가 같은 선택 키를 사용한다. 독립 객체도 별도 ID 정책을 만들지 않는다.
                this.dispatchEvent({type: 'select', data: Object.fromEntries(
                    getSelectedModels.call(this).map(model => [selector.getObjectKey(model), model]))});
            }
            return;
        }
        if (Array.isArray(object)) {
            for (const model of object) this.addSelected(model);
        }
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        drawArg.setUpdateDate();
    }

    /**
     * 두 월드 좌표(EPSG:3857)를 잇는 흰 거리선을 생성합니다. <br>
     * getLine을 생략하면 현재 측정 그룹에 선을 추가하며 현재 그룹이 없으면 생성하지 않습니다.
     *
     * @param {WorldPositionVector3} start 시작점의 월드 좌표(EPSG:3857) Vector3
     * @param {WorldPositionVector3} end 끝점의 월드 좌표(EPSG:3857) Vector3
     * @param {boolean} [getLine=false] true이면 현재 측정 그룹 없이 선만 생성할지 여부
     * @returns {import('@union3d/geometry/U3dLine').U3dLine | undefined} 새 거리선이며 입력이 Vector3가 아니거나 필요한 그룹이 없으면 undefined
     */
    getDistanceLine(start, end, getLine) {
        const self = /** @type {UAnalySection} */(this);
        if (!getLine && !self._currentGroup) return;
        const poiID = self._currentGroup ? self._currentGroup.name : '';
        if (!defined(start) || !(start instanceof THREE.Vector3))
            return;
        if (!defined(end) || !(end instanceof THREE.Vector3))
            return;
        if (!defined(poiID))
            return;

        const line = new U3dLine({
            vertices: [start, end],
            linewidth: 0.5,
            color: 0xffffff
        })
        line.material.depthTest = false;
        line.material.depthWrite = false;
        if ((!defined(getLine) || !getLine) && self._currentGroup)
            self._currentGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(line)));
        return line;
    }

    /**
     * 원기둥의 범위와 모델의 높이 구간이 겹치는지 판정합니다. <br>
     * 검사 중 오류는 콘솔에 기록하고 false를 반환합니다.
     *
     * @param {import('@union3d/geometry/U3dCylinder').U3dCylinder} cylinder 선택 범위를 표시하는 원기둥
     * @param {number} bottom 원기둥의 기준 높이
     * @param {number} height 기준 높이에서 검사할 높이 차
     * @param {import('@union3d/core/mesh/UMesh').UMesh} mesh 교차를 검사할 모델
     * @param {boolean} [invert=false] true이면 기준 높이 아래쪽을 검사할지 여부
     * @returns {boolean} 공간 범위와 높이 구간이 모두 겹치면 true
     */
    intersectMesh(cylinder, bottom, height, mesh, invert) {
        if (!defined(cylinder) || !defined((/** @type {import('@union3d/geometry/U3dCylinder').U3dCylinder} */(cylinder)).geometry)) {
            return false;
        }
        if (!defined(bottom) && !defined(height)) {
            return false;
        }
        if (!defined(mesh)) {
            return false;
        }

        try {
            if (!defined(invert)) {
                invert = false;
            }
            return INTERNAL.intersectCylinderMesh(this, cylinder, bottom, height, mesh, invert);
        } catch (e) {
            console.log('Intersect Mesh checking Error ', e);
            return false;
        }
    }

    /**
     * 지정한 지점에서 지형까지의 수직선과 지형 높이 라벨을 표시합니다. <br>
     * 앱이 연결된 상태에서 호출하며 prevLine은 기존 미리보기 라벨을 갱신합니다.
     *
     * @param {import('three').Vector3} dist 수직선 끝점의 월드 좌표(EPSG:3857)
     * @param {string} [name] 라벨 이름 접두어이며 prevLine이면 미리보기 갱신
     */
    drawVerticalLine(dist, name) {
        const self = /** @type {UAnalySection} */(this);

        if (!defined(dist) || !(dist instanceof THREE.Vector3)) {
            return;
        }

        const pickposition = dist.clone();
        pickposition.z += 1000;
        // 해당지점에서 수직으로 내렸을때 만나는 지형의 높이
        const drawArgApp_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(self._drawArg);
        let result = drawArgApp_._app.closestPointAtVector3_(pickposition, true);
        if (!defined(result)) {
            result = {z: 0};
        }

        const bottomPoi = new THREE.Vector3(dist.x, dist.y, result.z);
        const line = INTERNAL.createCylinderFromPoints(bottomPoi, dist, self._lineWidth);

        // 해당 직선의 바닥점을 나타내는 POI 생성
        const text = parseFloat(result.z).toFixed(2) + 'm';
        let poi;
        if (self._prevLine && self._prevLine.userData.verticalPOI) {
            poi = self._prevLine.userData.verticalPOI;
            poi.setPosition(bottomPoi);
            poi.setLabel(text);
            if (poi.userData.line) {
                UDEF.disposeObject3D(poi.userData.line)
                poi.remove(poi.userData.line);
            }
            poi.add(line);
            poi.userData.line = line;
            line.position.set(0, 0, (dist.z - result.z) / 2);

            line.name = name || '';
            poi.name = (name || '') + 'bottom';
        } else {
            poi = U3dBilboard.makeBilboard({
                position: bottomPoi,
                text: text,
            });
            poi.setPointSize(3);
            poi.setPointColor(0x00ff00);
            line.position.set(0, 0, (dist.z - result.z) / 2);
            poi.add(line);
            poi.userData.line = line;
        }


        // 미리보기선과 마우스 클릭시 생성 구분하여 추가하기
        if (name !== 'prevLine') {
            // 미리보기 선이 아닐 경우 poiGroup에 추가
            const lastGroup = self._poiGroup.children[self._poiGroup.children.length - 1];
            if (lastGroup) lastGroup.children.push(poi);
        } else {
            const prePOI = self._prevLine;
            if (defined(prePOI) && prePOI) {
                const childPOI = prePOI.userData.verticalPOI
                if (!defined(childPOI)) {
                    prePOI.add(poi);
                    prePOI.userData.verticalPOI = poi;

                }
            }
        }
    }
}

/**
 * @this {UAnalySection}
 *
 * @param {string} type
 */
function addEventListener(type) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const selectLayer_ = self._selectLayer;
    if (!selectLayer_) return;
    if (type === 'crossSection') {
        app_.off('click');
        app_.off('dblclick');
        self._clickId = app_.on('click', crossSectionClick.bind(self)) ?? undefined;
        self._dblClickId = app_.on('dblclick', crossSectionDblclick.bind(self)) ?? undefined;
        selectLayer_.setMeasureType('Polygon');
    } else if (type === 'longitudinal') {
        app_.off('click');
        app_.off('dblclick');
        self._clickId = app_.on('click', longitudinalClick.bind(self)) ?? undefined;
        self._dblClickId = app_.on('dblclick', longitudinalDblclick.bind(self)) ?? undefined;
        selectLayer_.setMeasureType('Polygon');
    } else if (type === 'circle') {
        app_.off('click');
        app_.off('dblclick');
        self._clickId = app_.on('click', circleClick.bind(self)) ?? undefined;
        selectLayer_.setMeasureType('PointBuffer');
    } else if (type === 'cylinder') {
        app_.off('click');
        app_.off('dblclick');
        self._clickId = app_.on('click', cylinderClick.bind(self)) ?? undefined;
        selectLayer_.setMeasureType('PointBuffer');
    }
}

/**
 * @this {UAnalySection}
 *
 * 지도상에 마우스 클릭시 해당 지점의 POI 생성
 *
 * @param {import('@U3dMouseEvent').U3dMouseEvent} e
 *
 * @ignore
 */
function longitudinalClick(e) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);
    const selectLayer_ = getSelectLayer.call(this);
    if (!selectLayer_) return;
    if (self._measureFeature !== undefined) {
        app_._measureLayer.clearDrawFeature();
        if (self._currentGroup) {
            UDEF.disposeObject3D(self._currentGroup);
            self._currentGroup = undefined;
        }
        clearMeasureFeature.call(self);
        app_.setUpdateDate();
    }
    // 시작점 생성 후 한번더 클릭시 거리측정 및 해당 지점 POI 생성
    if (self._drawPoint.length >= 2) {
        const clientX = e.normalizedX;
        const clientY = e.normalizedY;

        // 격자위 지점 poi 위치 변환 및 생성
        getScreenToWorld_.call(this, /** @type {number} */(clientX), /** @type {number} */(clientY));
        let start;
        let end;
        if (self._drawPoint.length <= 3) {
            start = self._drawPoint[0];
            end = self._drawPoint[1];
        } else {
            start = self._drawPoint[self._drawPoint.length - 2];
            end = self._drawPoint[self._drawPoint.length - 1];
        }
        // 시작점 - 끝점을 잇는 직선 생성
        if (defined(start) && defined(end))
            self.getDistanceLine(start, end);
        if (end) {
            const geo = drawArg_.getWorldToGeographic(end.x, end.y, end?.z ?? 0);
            const feature = selectLayer_.addMeasurePoint(geo);
            if (defined(feature)) {
                self._feature = feature;
            }
        }
        return;
    }


    // 모델을 먼저 탐색하고 없으면 지형을 사용합니다.
    const intersects = self.intersectModel(e);
    let point3d;
    for (let i = 0; i < intersects.length; i++) {
        const intersect = intersects[i];
        if (isNaN(intersect.point.z)) {
            continue;
        }

        point3d = intersect.point;
        break;
    }

    if (!defined(point3d)) {
        // 모델을 먼저 탐색하고 없으면 지형을 사용합니다.
        point3d = self.intersectTerrain(e);
        if (!defined(point3d)) {
            return;
        }
    }
    if (defined(point3d)) {
        self.clearSelect();
        const geo = drawArg_.getWorldToGeographic(point3d.x, point3d.y, point3d.z ??0);
        selectLayer_.addMeasurePoint(geo);
    }

    const poi = makePoint.call(self, point3d);
    if (!self._currentGroup) {
        /** @type {import('@UGroup').UGroup} */
        self._currentGroup = new UGroup();
        self._currentGroup.name = 'measure';
        self._poiGroup.add(self._currentGroup);
        if (poi) self._currentGroup.add(poi);
    }
    self._drawPoint.push(point3d);

    if (defined(self._drawPoint[self._drawPoint.length - 1])) {
        // 시작점 생성시 격자 sprite 위치 이동
        const idx = self._drawPoint.length - 1;
        const lastPosition = self._drawPoint[idx];
        if (self._sprite) {
            self._sprite.position.x = lastPosition.x;
            self._sprite.position.y = lastPosition.y;
            self._sprite.position.z = lastPosition.z;
            self._sprite.visible = true;
        }
        if (self._prevLine) {
            self._prevLine.visible = true;
        } else {
            createPrevLine.call(self);
            const prevLine = /** @type {import('three').Object3D | undefined} */ (self._prevLine);
            if (prevLine) prevLine.visible = true;
        }
        // 마우스 이동 이벤트 활성화
        app_.on('mousemove', /** @type {EventCallBack} */(self._onChange));
    } else {
        if (self._sprite) self._sprite.visible = false;
        if (self._prevLine)
            self._prevLine.visible = false;
        app_.off('mousemove');
    }

    if (self._sprite) {
        self._sprite.updateMatrixWorld();
        app_._sceneComment.add(self._sprite);
    }
    self._poiGroup.name = "analysisSection";
    app_._sceneComment.add(self._poiGroup);

    app_.setUpdateDate();
    self.update();
}

/**
 * @this {UAnalySection}
 *
 * @returns {SelectLayerLike | undefined}
 */
function getSelectLayer() {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    return /** @type {SelectLayerLike | undefined} */ (app_._measureLayer);
}

/**
 * @this {UAnalySection}
 *
 * @param {import('@U3dMouseEvent').U3dMouseEvent} e
 * @returns {boolean|void}
 */
function crossSectionClick(e) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);

    if (!defined(self._sceneComment))
        return false;

    if (self._measureFeature !== undefined) {
        app_._measureLayer.clearDrawFeature();
        if (self._currentGroup) {
            UDEF.disposeObject3D(self._currentGroup);
            self._currentGroup = undefined;
        }

        clearMeasureFeature.call(self);
        app_.setUpdateDate();
    }


    const selectLayer_ = getSelectLayer.call(this);
    if (!selectLayer_) return;

    let point3d = undefined;
    const intersects = app_.intersectAtPixel(e, true);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        if (isNaN(intersect.point.z) || intersect.point.z < 0)
            intersect.point.z = 0;

        point3d = intersect.point;
    }

    if (!defined(point3d)) {
        if (UDEF.debug) console.info('picking is null');
        return;
    }
    const poi = U3dBilboard.makePoint({
        position: point3d,
    });
    if (self._poiGroup.children.length === 0 || !self._currentGroup) {
        /** @type {import('@UGroup').UGroup} */
        const group = new UGroup();
        group.add(poi);
        self._currentGroup = group;
        self._poiGroup.add(group);
    } else {
        self._currentGroup.add(poi);
    }


    app_._sceneComment.add(self._poiGroup);
    self._drawPoint.push(point3d);
    if (defined(point3d)) {
        self.clearSelect();
        const geo = drawArg_.getWorldToGeographic(point3d.x, point3d.y, point3d.z ?? 0);
        const feature = selectLayer_.addMeasurePoint(geo);
        if (defined(feature)) {
            self._feature = feature;
        }
    }
}

/**
 * @this {UAnalySection}
 */
function crossSectionDblclick() {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);

    const height = window.prompt('높이를 입력하세요.', 10 + "");
    /** @type {import('@UMesh').UMesh | undefined} */
    let drawMesh;
    if (self._drawPoint.length > 2) {
        /** @type {Array<import('@union3d/geometry/U3dLine').U3dLine | undefined>} */
        const lines = [];
        self._drawPoint.push(self._drawPoint[0]);
        for (let l = 0; l < self._drawPoint.length - 1; l++) {
            const start = new THREE.Vector3(self._drawPoint[l].x, self._drawPoint[l].y, Number(height) * 1);
            const end = new THREE.Vector3(self._drawPoint[l + 1].x, self._drawPoint[l + 1].y, Number(height) * 1);
            lines.push(self.getDistanceLine(start, end, true));
        }
        drawMesh = INTERNAL.makeShape(self._drawPoint);
        if (defined(drawMesh)) {
            drawMesh.position.z = Number(height);
            const array = drawMesh.geometry.attributes.position.array;
            for (let ii = 0; ii < self._drawPoint.length; ii++) {
                if (defined(self._drawPoint[ii] && array[ii * 3])) {
                    array[(ii * 3)] = self._drawPoint[ii].x - drawMesh.position.x;
                    array[(ii * 3) + 1] = self._drawPoint[ii].y - drawMesh.position.y;
                    array[(ii * 3) + 2] = 0;
                } else {
                    self._drawPoint = [];
                    if (self._sprite) self._sprite.visible = false;
                    if (self._prevLine) {
                        self._prevLine.visible = false;
                        self._prevLine.children.forEach(function (child) {
                            child.visible = false;
                        })
                    }
                    removePrevLine.call(self);
                    app_.off('mousemove');
                    break;
                }
            }
        }
        if (defined(drawMesh) && drawMesh) {
            const drawMesh_ = drawMesh;
            drawMesh_.geometry.attributes.position.needsUpdate = true;
            drawMesh_.geometry.computeBoundingBox();
            drawMesh_.geometry.computeBoundingSphere();
            lines.forEach(line => {
                if (!line) return;
                const lineObject = /** @type {import('three').Object3D} */(/** @type {unknown} */(line));
                lineObject.position.sub(drawMesh_.position);
                drawMesh_.add(lineObject);
            });
            app_._sceneComment.add(drawMesh_);
        }
    }

    const arr = getIntersectMesh.call(self, Number(height));
    if (defined(arr) && arr.length > 0) {
        self.addSelected(arr);
    }
    if (defined(drawMesh)) {
        const parentGroup = self._poiGroup.children;
        if (parentGroup.length > 0) {
            self._pickList.push(drawMesh);
            // 이 메시는 데이터 모델이 아닌 현재 분석의 임시 절단 볼륨이다.
            parentGroup[parentGroup.length - 1].name = String(drawMesh.id);
            self._filteredList.push(String(drawMesh.id));
            self._filteredObject[drawMesh.id] = {
                arr: arr ?? [],
                height: height !== null ? Number(height) : undefined,
                type: self._type,
                poiGroupID: parentGroup[parentGroup.length - 1].name
            };
        }
    }
    commitFeature.call(self);
    self._drawPoint = [];
    self.dispatchEvent({type: 'click'});
    return true;
}

/**
 * @this {UAnalySection}
 *
 * @param {import('three').Vector3 | {x: number, y: number, z: number}} point
 * @param {MeasurePOILike} [prevObj]
 * @returns {MeasurePOILike | undefined}
 */
function makePoint(point, prevObj) {
    const self = /** @type {UAnalySection} */(this);
    if (!defined(point))
        return;

    const text = parseFloat(String(point.z)).toFixed(1) + 'm';
    /** @type {MeasurePOILike | undefined} */
    let poi;
    if (self._extension === 'base') {
        if (prevObj) {
            if (prevObj.setPosition) prevObj.setPosition(point);
            poi = prevObj;
        } else {
            poi = U3dBilboard.makePoint({
                position: point,
            });
        }
    } else {
        if (prevObj) {
            if (prevObj.setPosition) prevObj.setPosition(point);
            if (prevObj.setLabel) prevObj.setLabel(text);
            poi = prevObj;
        } else {
            poi = U3dBilboard.makeBilboard({
                position: point,
                text: text
            });
        }
    }
    if (!defined(poi))
        return;
    if (poi.setPointSize) poi.setPointSize(3);

    return /** @type {MeasurePOILike} */(poi);
}

/**
 * @this {UAnalySection}
 */
function longitudinalDblclick() {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);

    if (self._drawPoint.length <= 3) {
        return;
    }

    self.getDistanceLine(self._drawPoint[self._drawPoint.length - 1], self._drawPoint[0]);
    self._drawPoint.push(self._drawPoint[0]);
    self._drawPoint.splice(1, 1);

    const drawMesh = INTERNAL.makeShape(self._drawPoint);
    if (!drawMesh) return;
    const array = drawMesh.geometry.attributes.position.array;
    for (let i = 0; i < self._drawPoint.length; i++) {
        if (defined(self._drawPoint[i] && array[i * 3])) {
            array[(i * 3)] = self._drawPoint[i].x - drawMesh.position.x;
            array[(i * 3) + 1] = self._drawPoint[i].y - drawMesh.position.y;
            array[(i * 3) + 2] = self._drawPoint[i].z - drawMesh.position.z;
        } else {
            self._drawPoint = [];
            if (self._sprite) self._sprite.visible = false;
            if (self._prevLine) {
                self._prevLine.visible = false;
                self._prevLine.traverse(function (child) {
                    child.visible = false;
                })
            }
            removePrevLine.call(self);

            app_.off('mousemove');
            break;
        }
    }

    drawMesh.geometry.attributes.position.needsUpdate = true;
    drawMesh.geometry.computeBoundingBox();
    drawMesh.geometry.computeBoundingSphere();
    app_._sceneComment.add(drawMesh);
    self._pickList.push(drawMesh);

    let arr = getIntersectMesh.call(self, 0);
    if (defined(arr) && arr.length > 0) {
        /** @type {Array<import('@UMesh').UMesh>} */
        const resultArray = [];
        arr.forEach(function (mesh) {
            if (INTERNAL.collisionMesh(drawMesh, mesh)) {
                self.addSelected(mesh);
                resultArray.push(mesh);
            }
        })
        if (resultArray.length > 0) {
            arr = resultArray;
        }
    }


    self._drawPoint = [];
    if (self._sprite) {
        self._sprite.visible = false;
        app_._sceneComment.remove(self._sprite);
    }


    removePrevLine.call(self);
    // 마우스 이동 이벤트 종료
    app_.off('mousemove');

    if (self._currentGroup) self._currentGroup.name = String(drawMesh.id);
    self._filteredList.push(String(drawMesh.id));
    self._filteredObject[drawMesh.id] = {
        arr: arr ?? [],
        type: self._type,
        poiGroupID: self._currentGroup ? self._currentGroup.name : ''
    };
    commitFeature.call(self);
    self.dispatchEvent({type: 'click'});
    self._currentGroup = undefined;
}

/**
 * @this {UAnalySection}
 *
 * @param {import('@U3dMouseEvent').U3dMouseEvent} e
 */
function circleClick(e) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);
    let terainPosition;
    const selectLayer_ = getSelectLayer.call(this);
    if (!selectLayer_) return;
    // 모델을 먼저 탐색하고 없으면 지형을 사용합니다.
    terainPosition = self.intersectTerrain(e);
    if (!defined(terainPosition)) {
        return;
    }
    if (self._measureFeature !== undefined) {
        self._feature = self._measureFeature;
        app_._measureLayer.clearDrawFeature();
        clearMeasureFeature.call(self);
        app_.setUpdateDate();
    }

    if (self._prevLine) {
        self._prevLine.visible = true;
    } else {
        createPrevLine.call(self);
        const prevLine = /** @type {import('three').Object3D | undefined} */ (self._prevLine);
        if (prevLine) prevLine.visible = true;
    }

    const poi = makePoint.call(self, terainPosition);
    if (poi) poi.name = 'circleType_startPoint';
    self._currentPoi = poi;
    self._drawPoint.push(terainPosition);
    const geo = drawArg_.getWorldToGeographic(terainPosition.x, terainPosition.y, terainPosition.z ?? 0);
    self._featurePoints.push(geo);
    self._measureFeature = selectLayer_.addMeasurePoint(geo);

    if (defined(terainPosition)) {
        app_.on('mousemove', /** @type {EventCallBack} */(self._onChange));
    }
    if (self._drawPoint.length > 1) {
        app_.off('mousemove', self._onChange);
        if (defined(self._curCircle)) {
            const curCircle = /** @type {import('@union3d/geometry/U3dCircle').U3dCircle & import('@UMesh').UMesh} */(self._curCircle);

            self.clearSelect();
            const arr = getIntersectMesh.call(self, 0);
            if (defined(arr) && arr.length > 0) {
                arr.forEach(function (mesh) {
                    self.addSelected(mesh);
                })
            }
            self._featurePoints = [];

            self._curCircle = undefined;
            if (curCircle.parent) {
                curCircle.parent.remove(curCircle);
                if (self._prevLine) curCircle.position.add(self._prevLine.position);
            }
            if (self._prevLine && self._prevLine.userData.distanceLabel) {
                const label = self._prevLine.userData.distanceLabel;
                label.position.add(self._prevLine.position);
                label.position.sub(curCircle.position);
                curCircle.add(label)
                self._prevLine.userData.distanceLabel = undefined;
            }
            self._pickList.push(/** @type {import('@UMesh').UMesh} */(curCircle));
            self._filteredList.push(String(curCircle.getUid()));
            curCircle.name = String(curCircle.getUid());
            const list = /** @type {Array<import('@UMesh').UMesh | {layerName: string, id: unknown}>} */ (getSelectedModels.call(self));
            self._filteredObject[String(curCircle.getUid())] = {
                arr: list,
                type: self._type,
                poiGroupID: curCircle.getUid()
            };
            clearMeasureFeature.call(self);
            removePrevLine.call(self);
            app_._sceneComment.add(curCircle);
            self._feature = undefined
        }

        self._drawPoint = [];
        if (self._currentPoi) {
            UDEF.disposeObject3D(self._currentPoi);
            self._currentPoi = undefined;
        }
        self.dispatchEvent({type: 'click'});
    }

    if (self._sprite) self._sprite.updateMatrixWorld();
    app_._sceneComment.add(self._poiGroup);
    self.update();
}

/**
 * @this {UAnalySection}
 *
 * @param {import('@U3dMouseEvent').U3dMouseEvent} e
 */
function cylinderClick(e) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);
    const selectLayer_ = getSelectLayer.call(this);
    if (!selectLayer_) return;
    if (self._measureFeature !== undefined) {
        self._feature = self._measureFeature;
        app_._measureLayer.clearDrawFeature();
        clearMeasureFeature.call(self);
        app_.setUpdateDate();
    }

    // 시작점 생성 후 한번더 클릭시 거리측정 및 해당 지점 POI 생성
    if (self._drawPoint.length >= 1) {
        const clientX = e.origin.clientX;
        const clientY = e.origin.clientY;

        try {
            // 격자위 지점 poi 위치 변환 및 생성
            getCylinderToWorld_.call(this, clientX, clientY);
        } catch (e) {
            console.log('Cylinder Create Fail', e);
        }
        // 시작점 - 끝점을 잇는 직선 생성
        // 가이드라인 생성시 필요한 격자 sprite / 미리보기 선 가시화 off
        if (self._sprite) self._sprite.visible = false;
        if (self._prevLine) {
            self._prevLine.visible = false;

            if (self._prevLine.userData.cylinder) {
                const cylinder = self._prevLine.userData.cylinder;
                self._prevLine.remove(cylinder);
                cylinder.position.add(self._prevLine.position);
                self._prevLine.userData.cylinder = undefined;
            }

            self._prevLine.traverse(function (child) {
                child.visible = false;
            })
        }
        removePrevLine.call(self);
        app_.off('mousemove');

        if (defined(self._curCircle)) {
            const curCylinder = /** @type {import('@UMesh').UMesh} */(self._curCircle);
            self._curCircle = undefined;
            self._pickList.push(curCylinder);
            self._filteredList.push(String(curCylinder.id));
            const parentGroup = self._poiGroup.children;
            parentGroup[parentGroup.length - 1].name = String(curCylinder.id);


            self.clearSelect();
            const arr = getIntersectMesh.call(self, 0);

            if (defined(arr) && arr.length > 0) {
                const start = self._drawPoint[0];
                const end = self._drawPoint[1];
                if (start && end) {
                    const height = end.z - start.z
                    let invert = false;
                    if (start.z > end.z) {
                        invert = true;
                    }
                    arr.forEach(function (mesh) {
                        const mesh_ = /** @type {import('@UMesh').UMesh & {_isPicked: unknown}} */ (mesh);
                        if (self.intersectMesh(/** @type {import('@union3d/geometry/U3dCylinder').U3dCylinder} */(/** @type {unknown} */(curCylinder)), start.z, Math.abs(height), mesh, invert) && !defined(mesh_._isPicked)) {
                            self.addSelected(mesh);
                        } else {
                            if (isSelected.call(self, mesh)) {
                                removeSelectedObject.call(self, mesh);
                            }
                        }
                    })
                }
            }
            self._featurePoints = [];
            const list = /** @type {Array<import('@UMesh').UMesh | {layerName: string, id: unknown}>} */ (getSelectedModels.call(self));
            self._filteredObject[curCylinder.id] = {
                arr: list,
                type: self._type,
                poiGroupID: parentGroup[parentGroup.length - 1].name
            };
            self._feature = undefined;
            clearMeasureFeature.call(self);
            app_._sceneComment.add(curCylinder);
            self._drawPoint = [];
        }
        self.dispatchEvent({type: 'click'});
        return;
    }

    // 모델을 먼저 탐색하고 없으면 지형을 사용합니다.
    const intersects = self.intersectModel(e);
    let point3d;
    for (let i = 0; i < intersects.length; i++) {
        const intersect = intersects[i];
        if (isNaN(intersect.point.z)) {
            continue;
        }
        point3d = intersect.point;
        break;
    }

    if (!defined(point3d)) {
        // 모델을 먼저 탐색하고 없으면 지형을 사용합니다.
        point3d = self.intersectTerrain(e);
        if (!defined(point3d)) {
            return;
        }
    }
    const geo = drawArg_.getWorldToGeographic(point3d.x, point3d.y, point3d.z?? 0);
    self._featurePoints.push(geo);
    self._measureFeature = selectLayer_.addMeasurePoint(geo);
    //selectLayer_.addMeasurePoint(geo);
    const poi = makePoint.call(self, point3d);
    if (!defined(poi))
        return;
    poi.name = 'measure';
    self._drawPoint.push(point3d);
    self._poiGroup.add(poi);

    if (self._drawPoint.length === 1) {
        // 시작점 생성시 격자 sprite 위치 이동
        if (self._sprite) {
            self._sprite.position.x = self._drawPoint[0].x;
            self._sprite.position.y = self._drawPoint[0].y;
            self._sprite.position.z = self._drawPoint[0].z;
            self._sprite.visible = true;
        }
        if (self._prevLine)
            self._prevLine.visible = true;
        else {
            createPrevLine.call(self);
            const prevLine = /** @type {import('three').Object3D | undefined} */ (self._prevLine);
            if (prevLine) prevLine.visible = true;
        }

        // 마우스 이동 이벤트 활성화
        app_.on('mousemove', /** @type {EventCallBack} */(self._onChange));
    }

    if (self._sprite) {
        self._sprite.updateMatrixWorld();
        app_._sceneComment.add(self._sprite);
    }
    self._poiGroup.name = "CylinderArea";
    app_._sceneComment.add(self._poiGroup);
    self.dispatchEvent({type: 'click'});
    self.update();
}

/**
 * @this {UAnalySection}
 *
 * @param {import('@UMesh').UMesh | {layerName: string, id: unknown}} object
 * @returns {boolean}
 */
function isSelected(object) {
    return defined(findSelectedObject.call(this, object));
}

/**
 * @this {UAnalySection}
 */
function removeEventListener() {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    if (defined(self._clickId)) {
        app_.unkey('click', self._clickId);
        self._clickId = undefined;
    }
    if (defined(self._dblClickId)) {
        app_.unkey('dblclick', self._dblClickId);
        self._dblClickId = undefined;
    }
}

/**
 * @this {UAnalySection}
 */
function clearMeasureFeature() {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    commitFeature.call(self);
    if (defined(self._measureFeature)) {
        app_.removeMeasureFeature(self._measureFeature);
        self._measureFeature = undefined;
    }
}

/**
 * @this {UAnalySection}
 */
function commitFeature() {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const feature = app_.commitMeasurePoint();
    if (defined(feature)) {
        self._measureFeature = feature;
    }
}

/**
 * @this {UAnalySection}
 *
 * 격자 Sprite 위에 2D 좌표를 3D 좌표로 변환하여 계산하는 함수
 *
 * @param {number} x          - 해당 지점의 마우스 x 값
 * @param {number} y          - 해당 지점의 마우스 y 값
 * @param {string} [name]       - 해당 함수를 호출한 유형의 이름 / 미리보기선 [ prevLine ], 클릭시 생성 되는 POI [ measure ]
 * @param {MeasurePOILike} [prevObj]         - 해당 함수로 결과로 POI가 생성 되지 못 했을 경우 가장 최근 POI를 반환합니다.
 * @returns {MeasurePOILike | undefined}          - 해당 마우스 지점의 2D 좌표를 3D 좌표로 변환시 나온 결과 POI
 *
 * @ignore
 */
function getScreenToWorld_(x, y, name, prevObj) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);

    const raycast = INTERNAL.setSpriteRay(app_, self, x, y);
    const position = new THREE.Vector3();
    const intersects = self._sprite ? raycast.intersectObject(self._sprite) : [];
    let poi;
    let line;
    if (intersects.length > 0) {
        position.copy(intersects[0].point);

        // 이름이 없을 경우 설정
        if (!defined(name) || name !== 'prevLine') {
            name = 'measure';
        }
        if (self._drawPoint.length >= 1 && name === 'measure') {
            self._drawPoint.push(position);
        }
        // 시작점이 생성 된 후라면 미리보기선의 거리직선 생성
        if (self._drawPoint.length >= 2) {
            let start = self._drawPoint[self._drawPoint.length - 2];
            let end = self._drawPoint[self._drawPoint.length - 1];
            if (self._drawPoint.length > 3) {
                start = end
                end = position;
            }

            if (self._prevLine && self._prevLine.userData.line) {
                UDEF.disposeObject3D(self._prevLine.userData.line);
            }

            line = INTERNAL.createCylinderFromPoints(start, end, self._lineWidth);
            line.name = (name ?? '') + 'distance';
        }
        poi = makePoint.call(self, position, prevObj);
        if (poi) poi.name = name;
        // 마우스 이동시 생성되는 미리보기 선과 클릭시 생성되는 POI 구분
        if (name === 'measure') {
            // 클릭시 생성되는 POI
            if (self._currentGroup && poi) self._currentGroup.add(poi);
            if (self._extension === 'extensions')
                self.drawVerticalLine(position);
        } else {

            if (line && self._prevLine) {
                if (!self._prevLine.userData.line || self._prevLine.userData.line !== line) {
                    line.position.sub(self._prevLine.position);
                    self._prevLine.add(line);
                    self._prevLine.userData.line = line;
                }
            }

            self.drawVerticalLine(position, 'prevLine');
            if (prevObj) {
                const verticalPOI = prevObj.userData.verticalPOI;
                if (verticalPOI && self._prevLine)
                    verticalPOI.position.sub(self._prevLine.position);
            }

        }
        self._drawPoint[1] = position;
    } else
        console.log("intersect is null")

    if (defined(poi))
        return poi;
    else {
        return prevObj;
    }
}

/**
 * @this {UAnalySection}
 *
 * 격자 Sprite 위에 2D 좌표를 3D 좌표로 변환하여 계산하는 함수
 *
 * @param {number} x          - 해당 지점의 마우스 x 값
 * @param {number} y          - 해당 지점의 마우스 y 값
 * @param {string} [name]       - 해당 함수를 호출한 유형의 이름 / 미리보기선 [ prevLine ], 클릭시 생성 되는 POI [ measure ]
 * @param {MeasurePOILike} [prevObj]         - 해당 함수로 결과로 POI가 생성 되지 못 했을 경우 가장 최근 POI를 반환합니다.
 * @returns {MeasurePOILike | undefined}          - 해당 마우스 지점의 2D 좌표를 3D 좌표로 변환시 나온 결과 POI
 *
 * @ignore
 */
function getCylinderToWorld_(x, y, name, prevObj) {
    const raycast_ = new THREE.Raycaster();
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);
    const dx = x;
    const dy = y;
    let cylinder;
    const container = app_.container();
    const camera = /** @type {import('three').Camera} */(/** @type {unknown} */(app_.getCamera()));
    camera.updateMatrixWorld();

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (self._sprite) self._sprite.updateMatrixWorld();

    const calcX = (dx / width) * 2 - 1;
    const calcY = -(dy / height) * 2 + 1;

    const position = new THREE.Vector3();
    const vec2d = new THREE.Vector2(calcX, calcY);
    raycast_.setFromCamera(vec2d, camera);

    const intersects = self._sprite ? raycast_.intersectObject(self._sprite) : [];
    let poi;
    if (intersects.length > 0) {
        position.x = intersects[0].point.x;
        position.y = intersects[0].point.y;
        position.z = intersects[0].point.z;

        // 이름이 없을 경우 설정
        if (!defined(name) || name !== 'prevLine') {
            name = 'measure';
        }
        // 시작점이 생성 된 후라면 미리보기선의 거리직선 생성

        const start = self._drawPoint[0];
        const end = position;
        const endBot = new THREE.Vector3(position.x, position.y, start.z);
        const dist = start.distanceTo(endBot);
        const height_ = end.z - start.z

        const distanceLine = INTERNAL.createCylinderFromPoints(start, endBot, self._lineWidth);
        distanceLine.name = (name ?? '') + 'distance';
        const distTextLabel = dist.toFixed(2) + 'm'
        const infoDist = {
            position: {x: 0, y: 0, z: 0},
            text: distTextLabel
        }

        if (prevObj) {
            if (prevObj.userData.distanceLabel) {
                const distLabel = prevObj.userData.distanceLabel;
                distLabel.setLabel(dist.toFixed(2) + 'm');

            } else {
                const disText = U3dBilboard.makeText(infoDist);
                disText.name = (name ?? '') + 'centerTextPOI';
                prevObj.userData.distanceLabel = disText;
                prevObj.add(disText)
            }
            prevObj.userData.distanceLabel.setPosition(distanceLine.position);
            prevObj.userData.distanceLabel.position.sub(prevObj.position);

        } else {
            const disText = U3dBilboard.makeText(infoDist);
            disText.name = (name ?? '') + 'centerTextPOI';
            distanceLine.add(disText);
        }

        const startPos = new THREE.Vector3(end.x, end.y, start.z);
        const heightLine = INTERNAL.createCylinderFromPoints(startPos, end, self._lineWidth);
        heightLine.name = (name ?? '') + 'heightDistance';

        const heightTextLabel = Math.abs(height_).toFixed(2) + 'm';
        const info = {
            position: {x: 0, y: 0, z: 0},
            text: heightTextLabel
        }

        if (prevObj) {
            if (prevObj.userData.verticalLabel) {
                const distLabel = prevObj.userData.verticalLabel;
                distLabel.setLabel(heightTextLabel);
            } else {
                const heightText = U3dBilboard.makeText(info);
                heightText.name = (name ?? '') + 'heightTextPOI';

                prevObj.userData.verticalLabel = heightText;
                prevObj.add(heightText)
            }
            prevObj.userData.verticalLabel.setPosition(heightLine.position);
            prevObj.userData.verticalLabel.position.sub(prevObj.position);
        } else {
            const heightText = U3dBilboard.makeText(info);
            heightText.name = (name ?? '') + 'heightTextPOI';
            heightLine.add(heightText);
        }


        cylinder = INTERNAL.createCylinderVolume(start, dist, height_, name);
        cylinder.children.push(distanceLine);
        cylinder.children.push(heightLine);

        if (prevObj) {
            if (prevObj.userData.cylinder) {
                UDEF.disposeObject3D(prevObj.userData.cylinder)
                if (prevObj.userData.cylinder.parent)
                    prevObj.userData.cylinder.parent.remove(prevObj.userData.cylinder);
            }
            prevObj.userData.cylinder = cylinder;
            cylinder.position.sub(prevObj.position);
        }


        const geo = drawArg_.getWorldToGeographic(end.x, end.y, end.z ?? 0);
        geo.z = end.z;

        if (self._featurePoints.length === 1) {
            app_._measureLayer.addMeasurePoint(geo);
        }
        app_._measureLayer.updateLastPosition(end);
        self._featurePoints.push(geo);

        poi = makePoint.call(self, position, prevObj);
        if (poi) poi.name = name;
        if (!prevObj && poi && cylinder)
            poi.children.push(cylinder);

        // 마우스 이동시 생성되는 미리보기 선과 클릭시 생성되는 POI 구분
        if (name === 'measure') {
            // 클릭시 생성되는 POI
            if (poi) self._poiGroup.add(poi);
            self._drawPoint.push(position)
            self._curCircle = cylinder;
            if (self._extension === 'extensions')
                self.drawVerticalLine(position);
        } else {
            // 마우스 이동 이벤트 활성화시 미리보기 선
            self.drawVerticalLine(position, 'prevLine');
            if (prevObj) {
                const verticalPOI = prevObj.userData.verticalPOI;
                if (verticalPOI && self._prevLine)
                    verticalPOI.position.sub(self._prevLine.position);
            }
            if (defined(cylinder) && self._prevLine) {
                self._prevLine.add(cylinder);

            }
        }
    } else
        console.log("intersect is null")

    if (defined(poi))
        return poi;
    else {
        return prevObj;
    }
}

/**
 * @this {UAnalySection}
 *
 * 격자 Sprite 위에 2D 좌표를 3D 좌표로 변환하여 계산하는 함수
 *
 * @param {import('@U3dMouseEvent').U3dMouseEvent} e          - 해당 지점의 마우스 위치 값
 * @param {string} [name]       - 해당 함수를 호출한 유형의 이름 / 미리보기선 [ prevLine ], 클릭시 생성 되는 POI [ measure ]
 * @param {MeasurePOILike} [prevObj]    - 해당 함수로 결과로 POI가 생성 되지 못 했을 경우 가장 최근 POI를 반환합니다.
 * @returns {MeasurePOILike | undefined}          - 해당 마우스 지점의 2D 좌표를 3D 좌표로 변환시 나온 결과 POI
 *
 * @ignore
 */
function getCircleToWorld_(e, name, prevObj) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    if (self._featurePoints.length === 0) return prevObj;
    if (!defined(e)) {
        if (UDEF.debug) console.info('picking is null');
        return undefined;
    }
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);

    const worldPos = self.intersectTerrain(e);
    if (!defined(worldPos)) {
        return prevObj;
    }

    const geo = drawArg_.getWorldToGeographic(worldPos.x, worldPos.y, worldPos.z ?? 0);
    if (!defined(geo)) {
        return prevObj;
    }
    if (self._featurePoints.length === 1) {
        app_._measureLayer.addMeasurePoint(geo);
    }
    app_._measureLayer.updateLastPosition(worldPos);
    self._featurePoints.push(geo)
    worldPos.z = Math.max(self._drawPoint[0].z, worldPos.z);

    let distanceLine;
    const start = self._drawPoint[0]
    const end = worldPos;
    const length = start.distanceTo(end);

    distanceLine = INTERNAL.createCylinderFromPoints(start, end, self._lineWidth);
    distanceLine.name = (name || '') + 'distance';
    distanceLine.position.sub(start);
    const centerPos = new THREE.Vector3();
    centerPos.x = (end.x - start.x) / 2 + start.x;
    centerPos.y = (end.y - start.y) / 2 + start.y;
    centerPos.z = (end.z - start.z) / 2 + start.z;

    const info = {
        position: {x: 0, y: 0, z: 0},
        text: length.toFixed(2) + 'm'
    }

    if (prevObj) {
        if (prevObj.userData.distanceLabel) {
            const distanceLabel = prevObj.userData.distanceLabel;
            distanceLabel.setLabel(length.toFixed(2) + 'm');
        } else {
            const disText = U3dBilboard.makeText(info);
            disText.name = (name ?? '') + 'textPOI';
            prevObj.userData.distanceLabel = disText;
            prevObj.add(disText)
        }
        prevObj.userData.distanceLabel.setPosition(centerPos);
        prevObj.userData.distanceLabel.userData.centerPos = centerPos;
        prevObj.userData.distanceLabel.position.sub(prevObj.position);
    } else {
        const disText = U3dBilboard.makeText(info);
        disText.name = (name ?? '') + 'textPOI';
        distanceLine.add(disText);
    }

    const circle = INTERNAL.createCircleVolume(start, worldPos, length, name, distanceLine);

    self._curCircle = circle;

    if (!prevObj) {
        const poi = U3dBilboard.makePoint({
            position: worldPos,
        });
        poi.name = name || '';
        poi.add(circle);
        if (self._currentPoi) {
            circle.add(self._currentPoi);
            if (self._currentPoi.setPosition) self._currentPoi.setPosition({x: 0, y: 0, z: 0});
        }
        self._poiGroup.add(poi);
        return poi
    } else {

        if (prevObj.setPosition) prevObj.setPosition(worldPos);
        if (prevObj.userData.circle) {
            UDEF.disposeObject3D(prevObj.userData.circle);
            prevObj.remove(prevObj.userData.circle);
        }
        prevObj.userData.circle = circle;
        prevObj.add(circle);
        return prevObj
    }
}

/**
 * @this {UAnalySection}
 *
 * 병합 모델을 분리한 뒤 같은 영역 교차 판정과 최소 높이 조건으로 후보를 추가합니다.
 *
 * @param {import('@UMesh').UMesh} mesh 검사할 모델입니다.
 * @param {Pick<OLGeometry, 'intersectsExtent'>} region 교차 판정을 담당하는 선택 영역 형상입니다.
 * @param {number} height 선택할 모델의 최소 높이입니다.
 * @param {Array<import('@UMesh').UMesh>} arr 현재까지 선택한 후보입니다.
 * @returns {Array<import('@UMesh').UMesh>|undefined} 후보 목록이며 모델이 없으면 반환하지 않습니다.
 */
function getMergedMeshDivision(mesh, region, height, arr) {
    const self = /** @type {UAnalySection} */(this);
    const app_ = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);

    if (!defined(mesh))
        return

    if (!defined(height))
        height = 0;

    const mesh__ = /** @type {import('@union3d/core/mesh/UMesh').UMesh & {_isMerged: unknown}} */(mesh);
    if (defined(mesh__._isMerged) && mesh__._isMerged) {
        const layer = app_.getLayerByName(mesh.getLayerName());
        const modelLayer = /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/(layer);
        if (defined(layer) && defined(modelLayer.mergedMeshDivision)) {
            const resultMesh = modelLayer.mergedMeshDivision(mesh) ?? [];
            if (defined(resultMesh) && resultMesh.length > 0) {
                for (let j = 0; j < resultMesh.length; j++) {
                    const mesh_ = /**@type{import('@union3d/core/mesh/UMesh').UMesh & {_isPicked:boolean}}*/(resultMesh[j]);
                    if(!mesh_) continue
                    if (isSelected.call(self, mesh_))
                        continue;
                    if (INTERNAL.isMergedCandidateEligible(drawArg_, region, mesh_, height)) {
                        arr.push(mesh_);
                    }
                }
            }
        }
    } else {
        const bbox = mesh.getBBox();
        const modelHeight = bbox.max.z - bbox.min.z;
        if (modelHeight >= height) {
            arr.push(mesh);
        }
    }
    return arr;
}

/**
 * @this {UAnalySection}
 *
 * @param {import('@U3dMouseEvent').U3dMouseEvent} e
 */
function onChange(e) {
    const self = /** @type {UAnalySection} */(this);
    const clientX = e.origin.clientX;
    const clientY = e.origin.clientY;
    if (!defined(self._app)) {
        return;
    }
    try {
        if ((self._type === 'longitudinal' || self._type === 'crossSection') && self._sprite && self._sprite.visible && defined(self._prevLine) && self._prevLine.visible) {
            const x = e.normalizedX;
            const y = e.normalizedY;
            self._prevLine = getScreenToWorld_.call(self, /** @type {number} */(x), /** @type {number} */(y), 'prevLine', self._prevLine);
        } else if (self._type === 'circle') {
            self._prevLine = getCircleToWorld_.call(self, e, 'prevLine', self._prevLine);
        } else if (self._type === 'cylinder') {
            self._prevLine = getCylinderToWorld_.call(self, clientX, clientY, 'prevLine', self._prevLine);
        }
        if (defined(self._prevLine) && self._prevLine instanceof UGroup)
            self._prevLine.updateMatrixWorld();
    } catch (e) {
        console.log('Mouse Move onChange Event Error', e);
    }
}

/**
 * @this {UAnalySection}
 *
 * 원은 표시 시의 높이 보정을 반영한 반경, 원통은 평면 반경으로 일반·병합 모델의 교차 후보를 구합니다. <br>
 * 원형 영역은 검사마다 하나의 독립 OL Circle로 만들며, 나머지 유형은 원본 형상의 교차 메서드를 그대로 사용합니다.
 *
 * @param {number} [height=0] 선택할 모델의 최소 높이입니다.
 * @returns {Array<import('@UMesh').UMesh> | undefined} 교차 후보이며 선택 피처가 없으면 반환하지 않습니다.
 *
 * @ignore
 */
function getIntersectMesh(height) {
    const self = /** @type {UAnalySection} */(this);
    const drawArg = self._drawArg;
    const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);

    if (!defined(height))
        height = 0;

    const scenes = drawArg_.getInstanceScenesFromModelLayers();
    /** @type {Array<import('@UMesh').UMesh>} */
    let arr = [];
    let isTiles = false;
    if (!self._feature) return;
    const feature = /** @type {import('@UMeasureFeature').UMeasureFeature} */ (self._feature);
    /** @type {Pick<OLGeometry, 'intersectsExtent'>} */
    let region = feature.getGeometry();
    if (feature.getType?.() === UDEF.MEASURE_TYPE.POINTBUFFER) {
        const bufferRegion = INTERNAL.createPointBufferRegion(feature, drawArg_, self);
        if (!bufferRegion) return arr;
        region = bufferRegion;
    }

    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        scene.traverse(function (/** @type {import('@union3d/core/mesh/UMesh').UMesh} */mesh) {
            let isIntersect = false;
            if ((mesh instanceof UMesh && !(mesh instanceof USharedMesh)) || mesh instanceof U3DTilesMesh) {
                const mesh_ = /** @type {import('@union3d/core/mesh/UMesh').UMesh & {isBIM: Function | undefined, _isPicked: unknown}} */(mesh);

                if (defined(mesh_.isBIM) && !mesh_.isBIM()) {
                    isTiles = true;
                    return;
                }

                const bbox = mesh_.getBBox();
                if (!defined(bbox)) return;

                const lb_ = drawArg_.getWorldToGoogle(bbox.min.x, bbox.min.y);
                const rt_ = drawArg_.getWorldToGoogle(bbox.max.x, bbox.max.y);
                isIntersect = region.intersectsExtent([lb_.x, lb_.y, rt_.x, rt_.y]);
                if (isIntersect && !defined(mesh_._isPicked) && !isSelected.call(self, mesh_)) {
                    const result = getMergedMeshDivision.call(self, mesh_, region, height, arr);
                    if (result) arr = result;
                }
            }
        });
    }
    if (isTiles) {
        U3dMessage.info('U3dSelect', '3DTiles models do not support multiple selection.');
    }
    return arr;
}

/**
 * @this {UAnalySection}
 */
function removePrevLine() {
    const self = /** @type {UAnalySection} */(this);
    if (self._prevLine) {
        UDEF.disposeObject3D(self._prevLine);
        if (self._prevLine.parent)
            self._prevLine.parent.remove(self._prevLine);
    }
    self._prevLine = undefined;
}

/**
 * @this {UAnalySection}
 *
 * @returns {MeasurePOILike | undefined}
 */
function createPrevLine() {
    const self = /** @type {UAnalySection} */(this);

    if (self._extension === 'base') {
        self._prevLine = U3dBilboard.makePoint({
            position: {x: 0, y: 0, z: 0},
        });
    } else {
        self._prevLine = U3dBilboard.makeBilboard({
            position: {x: 0, y: 0, z: 0},
        });
    }
    if (self._prevLine) {
        self._prevLine.name = 'prevLine';
        self._poiGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(self._prevLine)));
    }

    return self._prevLine;
}


export {UAnalySection};

/**
 * @this {UAnalySection}
 *
 * 선택기의 현재 모델을 읽어 확정 영역의 결과 목록을 만듭니다.
 *
 * @returns {Array<import('@UMesh').UMesh>} 현재 선택한 단면 모델 참조
 *
 * @ignore
 */
function getSelectedModels() {
    return (this._selector?.getSelected() ?? []).filter(model => model instanceof UMesh);
}

/**
 * @this {UAnalySection}
 *
 * 선택 상태 조회와 해제가 같은 선택기 키 규칙을 사용하게 합니다. <br>
 * 이전 결과 사전에 넣을 수 있던 레이어·ID 기술자도 읽기 전용으로 해석합니다.
 *
 * @param {import('@UMesh').UMesh | {layerName: string, id: unknown}} object 모델 또는 결과 기술자
 * @returns {USelect | undefined} 선택기가 현재 보관한 원본 모델
 *
 * @ignore
 */
function findSelectedObject(object) {
    const selector = this._selector;
    if (!selector) return;
    if (object instanceof UMesh) {
        const key = selector.getObjectKey(object);
        return typeof key === 'string' ? selector.getSelectedAsKey(key) : undefined;
    }
    return selector.getSelected().find(model => model instanceof UMesh
        && model.getLayerName() === object.layerName && UMesh._getObjectId(model) === object.id);
}

/**
 * @this {UAnalySection}
 *
 * 확정 영역에 속한 모델의 선택을 공통 선택기에서 해제합니다. <br>
 * 재로딩 뒤에는 선택기가 보관한 최신 객체를 사용하여 구독과 외곽선을 함께 해제합니다.
 *
 * @param {import('@UMesh').UMesh | {layerName: string, id: unknown}} object 제거할 결과 모델
 *
 * @ignore
 */
function removeSelectedObject(object) {
    const selected = findSelectedObject.call(this, object);
    if (selected) this._selector?.removeSelected(selected);
}
