//@ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UAnaly} from '@UAnaly';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {UGroup} from '@union3d/core/UGroup';
import {UMathEngine} from '@UMathEngine';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalyDepth.internal';

const TEMP_POSITION = new THREE.Vector3();
const TEMP_VECTOR2 = new THREE.Vector2();
const raycast = new THREE.Raycaster();
const LINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false, depthWrite: false});

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 *
 * 고도·심도와 두 지점 사이의 거리를 측정하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.activeAnalysis('Depth');
 * analy.active();
 */
class UAnalyDepth extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name', 'intersectColor1', 'intersectColor2', 'labelVisibilityList'];

    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */ _poiGroup;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */ _drawPoint;
    /**
     * @type {Array<string | number>}
     *
     * @ignore
     */ _distanceList;
    /**
     * @type {Record<string | number, UAnalyDepthResult | undefined>}
     *
     * @ignore
     */ _distanceObject;
    /**
     * @type {string}
     *
     * @ignore
     */ _extension;
    /**
     * @type {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)}
     *
     * @ignore
     */ _intersectFuntion;
    /**
     * @type {Array<import('three').Object3D> | undefined}
     *
     * @ignore
     */ _target;
    /**
     * @type {import('three').Mesh | undefined}
     *
     * @ignore
     */ _helperSphere;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _isIntersect;
    /**
     * @type {Array<UAnalyDepthPointData>}
     *
     * @ignore
     */ _infos;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _bottomLabelList;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _verticalLabelList;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _baseLabelList;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _distanceLabelList;
    /**
     * @type {number}
     *
     * @ignore
     */ _intersectColor1;
    /**
     * @type {number}
     *
     * @ignore
     */ _intersectColor2;
    /**
     * @type {Array<boolean>}
     *
     * @ignore
     */ _labelVisibilityList;
    /**
     * @type {number}
     *
     * @ignore
     */ _lineWidth;
    /**
     * @type {import('three').Sprite | undefined}
     *
     * @ignore
     */ _sprite;
    /**
     * @type {import('three').SpriteMaterial | undefined}
     *
     * @ignore
     */ _spriteMat;
    /**
     * @type {import('three').Texture | undefined}
     *
     * @ignore
     */ _spriteMap;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _spriteImageUrl;
    /**
     * @type {undefined|function(import('@U3dMouseEvent').U3dMouseEvent): void}
     *
     * @ignore
     */ _onChange;
    /**
     * @type {import('three').Object3D | undefined}
     *
     * @ignore
     */ _currentPoi;
    /**
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     *
     * @ignore
     */ _prevLine;

    /**
     * UAnalyDepth 클래스 생성자입니다. <br>
     * 고도·심도 측정의 표시 옵션을 초기화하며 앱 연결은 부모의 별도 설정을 따릅니다.
     *
     * @param {UAnalyDepthCO} [opt={}] 이름·교차 표시 색상·라벨 가시화 옵션
     */
    constructor(opt) {
        super();
        const originalOption = opt || {};
        opt = normalizeOptionKeys(originalOption, new.target);
        // 정규화가 복사본을 만들더라도 기존 상속 옵션 읽기의 의미를 보존한다.
        if (opt !== originalOption && typeof originalOption === 'object') {
            Object.setPrototypeOf(opt, Object.getPrototypeOf(originalOption));
        }
                this.name = defaultValue(opt.name, 'Depth');
        this._poiGroup = new UGroup();
        this._drawPoint = [];
        this._distanceList = [];
        this._distanceObject = {};
        this._extension = 'extensions';
        this._intersectFuntion = undefined;
        this._target = undefined;
        this._helperSphere = undefined;
        this._isIntersect = false;
        this._infos = [];
        this._bottomLabelList = [];
        this._verticalLabelList = [];
        this._baseLabelList = [];
        this._distanceLabelList = [];
        this._intersectColor1 = defaultValue(opt.intersectColor1, 0x000066);
        this._intersectColor2 = defaultValue(opt.intersectColor2, 0x660000);
        this._labelVisibilityList = defaultValue(opt.labelVisibilityList, [true, true, true, true]);
        this._lineWidth = 0.15;
        this._sprite = undefined;
        this._spriteMat = undefined;
        this._spriteMap = undefined;
        this._spriteImageUrl = undefined;
        this._onChange = undefined;
        this._currentPoi = undefined;
        this._prevLine = undefined;
    }

    /**
     * 심도 측정을 활성화하고 클릭·더블클릭 입력을 연결합니다. <br>
     * 이미 활성화된 경우 다시 등록하지 않으며 마우스 이동은 첫 지점 선택 후 연결합니다.
     *
     * @override
     */
    active() {
        if (this._isActive) return;
        UAnaly.prototype.active.call(this);
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (this._clickId !== undefined || this._dblClickId !== undefined) {
            this.off();
        }
        app.setMode(UDEF.APP_MODE._DEPTH);
        app.setBoundingTree(true);
        this._clickId = app.on('click', this.#click.bind(this));
        this._dblClickId = app.on('dblclick', this.#dblClick.bind(this));

        app.setProperties(UDEF.DEPTH_PREVLINE_TYPE.EXTENSIONS, defaultValue(this._extension, 'extensions'));
        //+ 시작점 생성후 마우스 이동이벤트 추가
        if (!this._onChange)
            this._onChange = this.#onChange.bind(this);
        else {
            app.off('mousemove', this._onChange);
        }
        //+ 2D --> 3D값을 추출할때, sprite 픽킹으로 잡아낸다.
        if (!defined(this._sprite)) {
            this._spriteMat = new THREE.SpriteMaterial({color: 0xffffff});
            //+ 격자 sprite 생성
            this._sprite = new THREE.Sprite(this._spriteMat);
            this._sprite.scale.x = 5000;
            this._sprite.scale.y = 5000;
            this._sprite.scale.z = 5000;
            this._sprite.material.depthWrite = false;
            this._sprite.material.transparent = true;
            this._sprite.material.opacity = 0.0;
        }
        if (!this._poiGroup) {
            this._poiGroup = new UGroup();
        }

        this._poiGroup.name = 'anlaysisDepth';

        if (!this._helperSphere) {
            const geometry = new THREE.SphereGeometry(1, 32, 16);
            const material = new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.3, transparent: true});
            this._helperSphere = new THREE.Mesh(geometry, material);
        }

        const sceneComment = app.getSceneComment();
        if (sceneComment && sceneComment.children.indexOf(this._poiGroup) === -1)
            sceneComment.add(this._poiGroup);
        const helperSphere = this._helperSphere;
        if (helperSphere && this._poiGroup.children.indexOf(helperSphere) === -1)
            this._poiGroup.add(helperSphere);
        if (this._prevLine && this._poiGroup.children.indexOf(this._prevLine) === -1)
            this._poiGroup.add(this._prevLine);
        const sprite = this._sprite;
        if (sprite && this._poiGroup.children.indexOf(sprite) === -1)
            this._poiGroup.add(sprite);
    }

    /**
     * 진행 중 측정을 종료하고 입력 연결과 미리보기 자원을 해제합니다. <br>
     * 완료된 결과와 격자 스프라이트는 유지합니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) {
            return;
        }
        UAnaly.prototype.deactive.call(this);
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (this._drawPoint.length > 0) {
            this.#dblClick();
            app._scene.children = app._scene.children.filter(/** @type {(prev: import('three').Object3D) => boolean} */ (prev => prev.name !== 'prevMesh'));
            this._drawPoint = [];
        }
        app.setBoundingTree(false);

        app.unkey('click', this._clickId ?? undefined);
        app.unkey('dblclick', this._dblClickId ?? undefined);
        app.off('mousemove', this._onChange);
        app.off('click');
        app.off('change');

        if (this._helperSphere) {
            this._poiGroup.remove(this._helperSphere);
            UDEF.disposeObject3D(this._helperSphere);
            this._helperSphere = undefined;
        }

        if (this._prevLine) {
            this._poiGroup.remove(this._prevLine);
            UDEF.disposeObject3D(this._prevLine);
            this._prevLine = undefined;
        }

        this._clickId = undefined;
        this._dblClickId = undefined;
        this._onChange = undefined;
        this._currentPoi = undefined;
    }

    /**
     * 측정 결과·표시 객체·라벨 추적 목록을 비웁니다. <br>
     * 진행 중 측정의 종료 이벤트를 처리한 뒤 삭제 알림을 보냅니다.
     *
     * @override
     */
    clear() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (defined(this._poiGroup)) {
            this.#dblClick();
            this._poiGroup.children.forEach(function (child) {
                if (child.name === 'measure')
                    UDEF.disposeObject3D(child);
            });
            this._poiGroup.clear();
            this._distanceObject = {};
            this._distanceList = [];
            this._drawPoint = [];
            this._infos = [];
            if (this._sprite)
                this._poiGroup.remove(this._sprite);
        }
        if (this._helperSphere)
            this._helperSphere.visible = false;

        if (this._prevLine) {
            UDEF.disposeObject3D(this._prevLine);
            this._prevLine.visible = false;
            if (this._prevLine.parent)
                this._prevLine.parent.remove(this._prevLine);
            this._prevLine = undefined;
        }

        if (this._drawPoint.length > 0) {
            app._scene.children = app._scene.children.filter(/** @type {(prev: import('three').Object3D) => boolean} */ (prev => prev.name !== 'prevMesh'));
            this._drawPoint = [];
        }

        this.#clearLabelList();

        app.setUpdateDate();
        app.off('mousemove', this._onChange);

        this.dispatchEvent({type: 'click'});
    }

    /**
     * 격자 스프라이트의 이미지·크기·투명도를 설정합니다. <br>
     * 크기와 투명도는 누락·null·음수일 때 기본값을 사용하며 0은 유지합니다. <br>
     * 기존 스프라이트의 장면 교체나 자원 해제는 수행하지 않습니다.
     *
     * @param {string} url 격자 이미지 주소
     * @param {number} [size=1000] 월드 좌표(EPSG:3857)에서 적용할 스프라이트 크기
     * @param {number} [opacity=0.7] 재질 투명도
     */
    setGridSpriteImage(url, size, opacity) {
        if (!defined(url)) {
            return;
        }
        if (!defined(size) || size < 0) {
            size = 1000;
        }
        if (!defined(opacity) || opacity < 0) {
            opacity = 0.7;
        }

        this._spriteImageUrl = url;
        this._spriteMap = new THREE.TextureLoader().load(url, function (_e) {
        }, function (_e) {
        }, function (err) {
            console.log('Image loader error' + ' // please Use Function [ setGridSpriteImage(url, size, opacity) ]', err);
        });
        this._spriteMat = new THREE.SpriteMaterial({map: this._spriteMap, color: 0xffffff});

        //+ 격자 sprite 생성
        this._sprite = new THREE.Sprite(this._spriteMat);
        this._sprite.scale.x = /** @type {number} */ (size);
        this._sprite.scale.y = /** @type {number} */ (size);
        this._sprite.scale.z = /** @type {number} */ (size);
        this._sprite.material.depthWrite = false;
        this._sprite.material.transparent = /** @type {boolean} */ (/** @type {unknown} */ (opacity));
        this._sprite.material.opacity = /** @type {number} */ (opacity);
    }

    /**
     * 이후 생성할 측정선의 반지름을 설정합니다. <br>
     * 이미 생성된 선을 즉시 다시 만들지는 않습니다.
     *
     * @param {number} width 월드 좌표(EPSG:3857) 기준 원기둥 반지름
     */
    setLineWidth(width) {
        this._lineWidth = width;
    }

    /**
     * 설정된 측정선 반지름을 반환합니다.
     *
     * @returns {number} 월드 좌표(EPSG:3857) 기준 원기둥 반지름
     */
    getLineWidth() {
        return this._lineWidth;
    }

    /**
     * ID에 해당하는 측정 객체와 연결된 라벨·결과를 삭제합니다. <br>
     * 객체를 찾지 못하면 변경하지 않으며 ID는 객체 조회 시 숫자로 변환합니다.
     *
     * @param {string} id 삭제할 측정 객체 ID
     */
    removePOI(id) {
        const app =   /** @type {import('@U3dApp').U3dApp} */(this._app);
        if (!this._poiGroup) return;

        /** @type {Array<import('three').Object3D>} */
        const templist = this._poiGroup.children;
        if (!defined(id)) {
            return;
        }
        /** @type {import('three').Object3D | undefined} */
        const removeTarget =  templist.find(function (poi) {
            return poi.id === Number(id);
        })

        if (!defined(removeTarget)) {
            return;
        }
        this._distanceObject[id] = undefined;
        delete this._distanceObject[id];

        const distTarget = this._distanceList.indexOf(Number(id));
        if (defined(distTarget) && distTarget > -1) {
            this._distanceList.splice(distTarget, 1);
        }

        //+ 삭제 하려는 POI와 연결된 POI 삭제
        const findGroup = app._sceneComment.children.find(function (/** @type {import('three').Object3D} */ group) {
            return group.name === 'anlaysisDepth';
        });
        if (defined(findGroup)) {
            const findIndex = findGroup.children.findIndex(function (/** @type {import('three').Object3D} */ ind) {
                return ind.id === removeTarget.id;
            });
            const childTarget = findGroup.children[findIndex];
            if (defined(childTarget)) {
                findGroup.remove(childTarget);
                this._poiGroup.remove(childTarget);
            }
        }

        app._sceneComment.remove(removeTarget);
        this._poiGroup.remove(removeTarget);
        this.#removeLabelList(removeTarget);
        UDEF.disposeObject3D(removeTarget);
        this.dispatchEvent({type: 'click'});
        app.setUpdateDate();
    }

    /**
     * 완료된 측정 객체 ID 목록을 반환합니다. <br>
     * 반환 배열은 내부 목록과 같은 참조이므로 호출자가 수정하면 내부 상태도 변경됩니다.
     *
     * @returns {Array<string | number>} 측정 객체 ID 목록
     */
    getDistanceList() {
        return this._distanceList;
    }

    /**
     * ID별 측정 결과 또는 전체 결과 저장소를 반환합니다. <br>
     * ID 생략 시 저장소 자체를 반환하며 결과 객체와 메시 참조를 복사하지 않습니다.
     *
     * @param {string} [id] 조회할 측정 객체 ID
     * @returns {UAnalyDepthResult | Record<string | number, UAnalyDepthResult | undefined> | undefined} 측정 결과·전체 저장소 또는 결과 부재
     */
    getDistanceObject(id = undefined) {
        if (!defined(id))
            return this._distanceObject;
        else {
            return this._distanceObject[/** @type {string} */ (id)];
        }
    }

    /**
     * 라벨 종류별 가시화 설정을 저장하고 기존 추적 라벨에 적용합니다. <br>
     * 배열 순서는 지형 고도·수직 거리·지점 고도·지점 간 거리입니다. <br>
     * 입력 배열을 복사하지 않으며 미리보기 갱신 시 일부 라벨은 다시 표시됩니다.
     *
     * @param {Array<boolean>} [valueList=[true,true,true,true]] 종류별 라벨 표시 여부
     */
    setLabelVisibility(valueList = [true, true, true, true]) {
        this._labelVisibilityList = valueList;
        /** @type {Record<string, Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>>} */
        const labelListMap = {
            bottom: this._bottomLabelList,
            vertical: this._verticalLabelList,
            base: this._baseLabelList,
            distance: this._distanceLabelList
        };

        /** @type {Record<string, boolean>} */
        const labelValueMap = {
            bottom: valueList[0],
            vertical: valueList[1],
            base: valueList[2],
            distance: valueList[3]
        };

        const targets = Object.keys(labelListMap);
        for (const key of targets) {
            const labelList = labelListMap[key];
            if (!labelList) continue;

            for (const label of labelList) {
                if (label)
                    label.visible = labelValueMap[key];
            }
        }
    }

    /**
     * 라벨 종류별 가시화 설정 배열을 반환합니다. <br>
     * 반환값은 내부 설정과 같은 배열 참조입니다.
     *
     * @returns {Array<boolean>} 지형 고도·수직 거리·지점 고도·지점 간 거리의 표시 여부
     */
    getLabelVisibility() {
        return this._labelVisibilityList;
    }

    /**
     * 가이드라인 유형을 설정합니다. <br>
     * 'extensions'는 수직 정보 표시를 사용하고 그 외 문자열은 기본 유형으로 처리합니다.
     *
     * @override
     *
     * @param {string} type 가이드라인 유형: 'extensions' 또는 'base'
     */
    setType(type) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!defined(type)) {
            return;
        }
        this._extension = type;
        if (type === 'extensions') {
            app.setProperties(UDEF.DEPTH_PREVLINE_TYPE.EXTENSIONS, true);
            app.setProperties(UDEF.DEPTH_PREVLINE_TYPE.BASE, false);
        } else {
            app.setProperties(UDEF.DEPTH_PREVLINE_TYPE.EXTENSIONS, false);
            app.setProperties(UDEF.DEPTH_PREVLINE_TYPE.BASE, true);
        }
    }

    /**
     * 두 위경도 좌표를 월드 좌표(EPSG:3857)로 변환하여 측정 결과와 표시 객체를 등록합니다. <br>
     * 결과 저장 후 click·end 이벤트를 순서대로 보내고 진행 중 지점 상태를 초기화합니다.
     *
     * @param {GeoPosition} point1 첫 지점의 경도·위도(도)와 고도(m)
     * @param {GeoPosition} point2 끝 지점의 경도·위도(도)와 고도(m)
     */
    getResultFromCoordinate(point1, point2) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);

        if (!defined(point1) || !defined(point2))
            return;

        point1 = new THREE.Vector3(point1.x, point1.y, point1.z);
        point2 = new THREE.Vector3(point2.x, point2.y, point2.z);

        const coord1 = app._drawArg.getGeographicToWorld(point1.x, point1.y, point1.z);
        const coord2 = app._drawArg.getGeographicToWorld(point2.x, point2.y, point2.z);
        const coordArray = /** @type {Array<import('three').Vector3>} */ ([]);
        coordArray.push(coord1);
        coordArray.push(coord2);
        const verticalLength = /** @type {Array<number>} */ ([]);
        for (let i = 0; i < coordArray.length; i++) {
            const tempCoodi = coordArray[i];

            const poi = this.#getBasicPoint(tempCoodi);
            if (!poi) return;
            poi.name = 'measure';
            if (i === 0) {
                const group = new UGroup();
                this._currentPoi = group;
                group.add(poi);
                this._poiGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._currentPoi)));
            } else {
                (/** @type {import('three').Object3D} */ (this._currentPoi)).add(poi);
            }
            if (this._extension === 'extensions') {
                const position = new THREE.Vector3(tempCoodi.x, tempCoodi.y, tempCoodi.z);
                const line = /** @type {undefined|import('@UMesh').UMesh & {_verticalLength: number}} */ (this.drawVerticalLine(position));
                if (line) {
                    poi.add(/** @type {import('three').Object3D} */ (line.parent));
                    verticalLength.push(line._verticalLength);
                }
            }
        }

        const start = new THREE.Vector3(coordArray[0].x, coordArray[0].y, coordArray[0].z);
        const end = new THREE.Vector3(coordArray[1].x, coordArray[1].y, coordArray[1].z);
        const geoStart = app.vector3ToGeoGraphic(start) ?? new THREE.Vector3();
        const geoEnd = app.vector3ToGeoGraphic(end) ?? new THREE.Vector3();
        const length = UMathEngine.getMeterDistanceByGooglePoints(start,end);//미터 스케일로 길이 구하기
        const dataStart = {
            x: geoStart.x,
            y: geoStart.y,
            z: geoStart.z,
            fromTerrain: verticalLength[0],
            fromPrePoint: 0,
            mesh: undefined
        };
        const dataEnd = {
            x: geoEnd.x,
            y: geoEnd.y,
            z: geoEnd.z,
            fromTerrain: verticalLength[1],
            fromPrePoint: length,
            mesh: undefined
        };
        this._infos.push(dataStart);
        this._infos.push(dataEnd);
        //+ 시작점 - 끝점을 잇는 직선 생성
        this.getDistanceLine(start, end);
        this.dispatchEvent({type: 'click', data: this._distanceObject[(/** @type {import('three').Object3D} */ (this._currentPoi)).id]});
        this.dispatchEvent({type: 'end', data: this._distanceObject[(/** @type {import('three').Object3D} */ (this._currentPoi)).id]});

        app.setUpdateDate();
        this._drawPoint = [];
        this._currentPoi = undefined;
    }

    /**
     * 두 위경도 좌표를 월드 좌표(EPSG:3857)로 변환하여 실제 거리를 구합니다. <br>
     * 표시 객체나 측정 결과 목록은 생성하지 않습니다.
     *
     * @param {GeoPosition} point1 첫 지점의 경도·위도(도)와 고도(m)
     * @param {GeoPosition} point2 끝 지점의 경도·위도(도)와 고도(m)
     * @returns {number | undefined} 두 지점 사이 거리(m), 지점 누락 시 undefined
     */
    getDistanceFromCoordinate(point1, point2) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);

        if (!defined(point1) || !defined(point2))
            return undefined;

        const start = app._drawArg.getGeographicToWorld(point1.x, point1.y, point1.z);
        const end = app._drawArg.getGeographicToWorld(point2.x, point2.y, point2.z);

        return UMathEngine.getMeterDistanceByGooglePoints(start, end);
    }

    /**
     * 두 지점 사이의 측정선과 거리 라벨을 생성합니다. <br>
     * visible이 참이면 표시 그룹에만 추가하고 거짓이면 진행 중 결과를 집계·등록합니다. <br>
     * 입력은 Vector3 인스턴스여야 하며 선은 공유 재질을 사용합니다.
     *
     * @param {WorldPositionVector3} start 시작 월드 좌표(EPSG:3857)
     * @param {WorldPositionVector3} end 끝 월드 좌표(EPSG:3857)
     * @param {boolean} [visible] 표시 전용 등록 여부
     * @returns {import('@UMesh').UMesh | undefined} 생성된 선, 입력 부적합 시 undefined
     */
    getDistanceLine(start, end, visible) {
        if (!defined(this._currentPoi)) {
            const poiGroupChildren = this._poiGroup.children;
            if (poiGroupChildren[poiGroupChildren.length - 1])
                this._currentPoi = poiGroupChildren[poiGroupChildren.length - 1];
            else {
                this._currentPoi = new UGroup();
            }
        }
        const poiID = this._currentPoi.id;
        if (!defined(start) || !(start instanceof THREE.Vector3))
            return;
        if (!defined(end) || !(end instanceof THREE.Vector3))
            return;
        if (!defined(poiID))
            return;

        const line = this.#getDistanceLine_(start, end);
        if (visible) {
            this._poiGroup.add(line);
        } else {
            this.#setResultInfo(poiID);
            this._distanceList.push(poiID);
            this._currentPoi.add(line);
        }
        return line;
    }

    /**
     * 해당 지점과 지형 사이의 수직선·거리·고도 라벨을 생성합니다. <br>
     * 지형 높이가 없거나 무효이면 0을 사용하며 수직 거리는 부호를 유지합니다. <br>
     * visible이 참이면 바닥 POI를 표시 그룹에 등록하고, 거짓이면 그 POI의 자식 선을 반환합니다.
     *
     * @param {WorldPositionVector3} position 측정 지점의 월드 좌표(EPSG:3857)
     * @param {boolean} [visible=false] 바닥 POI의 표시 그룹 등록 여부
     * @param {boolean} [addList=true] 생성 라벨의 가시화 추적 목록 등록 여부
     * @returns {import('three').Object3D | undefined} 바닥 POI 또는 수직선, 지점 누락 시 undefined
     */
    drawVerticalLine(position, visible = false, addList = true) {
        const drawArg = this._drawArg;
        const drawArg_ = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */(drawArg);
        if (!defined(position) && !((/** @type {unknown} */ (position)) instanceof THREE.Vector3)) {
            return;
        }

        const pickposition = position.clone();
        pickposition.z += 1000;
        //+ 해당지점에서 수직으로 내렸을때 만나는 지형의 높이
        const realScale = UMathEngine.getRealScaleAtGoogle(position);
        let result = drawArg_._app.getRenderHeightAtPoint(position); //확인됨. 3857 스케일
        if (!defined(result) || result === UDEF.INVALID || result === UDEF.TERRAIN_NO_DATA)
            result = 0;

        const end = new THREE.Vector3(position.x, position.y, result);
        // 지형 높이까지의 선을 조립하며 라벨·장면 등록은 아래에서 연결한다.
        const line = INTERNAL.createCylinderFromPoints(position, end, LINE_MATERIAL, this._lineWidth);
        const lineLen = (position.z - (result)) * realScale; //미터 스케일 적용
        (/** @type {{_verticalLength: (number|undefined)}} */ (/** @type {unknown} */ (line)))._verticalLength = lineLen; //미터 스케일 적용

        const distText = parseFloat(String(lineLen)).toFixed(2) + 'm';
        const distancePOI = U3dBilboard.makeText({
            position: {x: 0, y: 0, z: 0},
            text: distText
        });
        distancePOI.visible = this._labelVisibilityList[1];
        line.add(distancePOI);
        line.position.set(0, 0, (position.z - result) / 2);

        if (addList)
            this._verticalLabelList.push(distancePOI);

        //+ 해당 직선의 바닥점을 나타내는 POI 생성
        const text = parseFloat(String(result * realScale)).toFixed(2) + 'm'; //미터 스케일 적용
        const poi = U3dBilboard.makePoint({
            position: {x: 0, y: 0, z: result - position.z},
        });
        poi.setPointColor(0x00ff00);
        const bottomPOI = U3dBilboard.makeText({
            position: {x: 0, y: 0, z: 0},
            text: text
        });
        poi.add(bottomPOI);
        bottomPOI.visible = this._labelVisibilityList[0];
        if (addList)
            this._bottomLabelList.push(bottomPOI);
        poi.setPointSize(3);
        line.userData.distancePOI = distancePOI;
        line.userData.bottomPOI = poi;
        line.userData.bottomLabel = bottomPOI;
        /** @type {THREE.Material} */ (line.material).depthWrite = false;
        poi.add(line);

        if (visible) {
            const basePoi = U3dBilboard.makeBilboard({
                position: {x: 0, y: 0, z: 0},
                text: (position.z  * realScale).toFixed(1) + 'm' //미터 스케일 적용
            });
            bottomPOI.position.z = -poi.position.z;

            poi.position.x = position.x;
            poi.position.y = position.y;
            poi.position.z += position.z;
            poi.add(basePoi);

            this._poiGroup.add(poi);
            return poi;
        }

        return line;
    }

    /**
     * 분석 이벤트 콜백을 등록합니다. <br>
     * 이벤트 종류를 생략하면 click에 등록합니다.
     *
     * @param {EventCallBack} func 이벤트 처리 함수
     * @param {string} [event] 이벤트 종류
     */
    passToClickEvent(func, event) {
        if (!defined(func))
            return;
        if (!defined(event))
            this.on('click', func);
        else {
            this.on(event, func);
        }
    }

    /**
     * 교차 검사 대상을 설정합니다. <br>
     * 배열은 복사하지 않으며 단일 객체는 배열로 감쌉니다. <br>
     * null 또는 undefined를 전달하면 대상을 해제합니다.
     *
     * @param {import('three').Object3D | Array<import('three').Object3D> | null | undefined} target 교차 검사 대상, null·undefined이면 해제
     */
    setIntersectTarget(target) {
        if (!defined(target)) {
            this._target = undefined;
            return;
        }
        if (Array.isArray(target)) {
            this._target = target;
        } else {
            this._target = [target];
        }
    }

    /**
     * 클릭 시 교차 목록에서 측정 지점을 선택할 콜백을 설정합니다. <br>
     * 콜백은 분석 객체를 this로 사용하며 point가 있는 결과를 반환해야 지점을 추가합니다. <br>
     * undefined를 전달하면 선택 콜백을 해제합니다.
     *
     * @param {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)} func 교차점 선택 함수 또는 해제
     */
    setIntersectFunction(func) {
        this._intersectFuntion = func;
    }

    /**
     * 설정된 교차점 선택 콜백을 반환합니다.
     *
     * @returns {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)} 교차점 선택 함수 또는 미설정
     */
    getIntersectFunction() {
        return this._intersectFuntion;
    }

    /**
     * 마우스 클릭 이벤트를 처리합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 이벤트 객체
     *
     * @ignore
     */
    #click(e) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!this._isActive) return;
        // 사용자 지정 대상이 없으면 부모의 모델 교차 조회를 사용합니다.
        /** @type {Array<import('three').Intersection>} */ let intersects = [];
        const camera = app._camera;
        if(!camera) return;
        TEMP_VECTOR2.set(/** @type {number} */ (e.normalizedX), /** @type {number} */ (e.normalizedY));
        raycast.setFromCamera(TEMP_VECTOR2, camera);
        if (this._target && this._target.length > 0) {
            intersects = raycast.intersectObjects(this._target);
            if (this._helperSphere) {
                const idx = this._poiGroup.children.indexOf(this._helperSphere);
                if (idx === -1)
                    this._poiGroup.add(this._helperSphere);
            }
            if (!intersects || intersects.length === 0) return;
        } else {
            intersects = this.intersectModel(e);
        }
        /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} */ let poi;
        /** @type {import('three').Vector3 | undefined} */ let point3d;
        if (this._intersectFuntion) {
            const result = this._intersectFuntion(intersects);
            if (!result) return;
            point3d = result.point;
        } else {
            // 교차점의 선택·보정만 맡기며 대체 조회와 측정 상태 전이는 여기서 결정한다.
            point3d = INTERNAL.selectIntersectionPoint(intersects);
            if (!defined(point3d)) {
                if (!this._target) {
                    if (this._sprite) {
                        this._sprite.updateMatrixWorld();
                        intersects = raycast.intersectObject(this._sprite);
                        if (intersects.length > 0) {
                            point3d = intersects[0].point;
                        }
                    }

                    if (!defined(point3d)) {
                        //+ 지형 탐색
                        point3d = this.intersectTerrain(e);
                    }
                }
            }
        }

        if (!defined(point3d)) {
            return;
        }

        poi = this.#getBasicPoint(point3d);
        if (!poi) return;
        poi.name = 'measure';
        if (!this._currentPoi) {
            this._currentPoi = poi;
            this._poiGroup.add(poi);
        } else {
            const offset = new THREE.Vector3().subVectors(/** @type {import('three').Vector3} */ (point3d), this._currentPoi.position);
            this._currentPoi.add(poi);
            poi.setPosition(offset);
        }
        if (!poi) return;
        this._drawPoint.push(/** @type {import('three').Vector3} */ (point3d));
        let verticalLineLength = 0;
        let distance = 0;
        if (this._extension === 'extensions') {
            const verticalLine = /** @type {undefined|import('@UMesh').UMesh & {_verticalLength: number}} */ (this.drawVerticalLine(/** @type {import('three').Vector3} */ (point3d)));
            if (verticalLine) {
                poi.add(/** @type {import('three').Object3D} */ (verticalLine.parent));
                verticalLineLength = verticalLine._verticalLength;
            }
        }

        if (defined(point3d)) {
            if (!defined(this._target)) {
                //+ 시작점 생성시 격자 sprite 위치 이동
                if (this._sprite) this._sprite.visible = true;
            }
            if (this._sprite) {
                this._sprite.position.set(/** @type {import('three').Vector3} */ (point3d).x, /** @type {import('three').Vector3} */ (point3d).y, /** @type {import('three').Vector3} */ (point3d).z);
                if (this._poiGroup.children.indexOf(this._sprite) === -1) {
                    this._poiGroup.add(this._sprite);
                }
            }
            //+ 마우스 이동 이벤트 활성화
            if (this._drawPoint.length === 1 && this._onChange)
                app.on('mousemove', this._onChange);
        }
        if (this._drawPoint.length > 1) {
            const start = this._drawPoint[this._drawPoint.length - 2];
            const end = this._drawPoint[this._drawPoint.length - 1];
            const line = this.#getDistanceLine_(start, end);
            if (line) {
                line.position.sub(/** @type {import('three').Vector3} */ (point3d));
                line.name = poi.name + 'distance';
                poi.add(line);
                distance = (/** @type {{_distance: number}} */ (/** @type {unknown} */ (line)))._distance; // _distance는 미터 단위입니다.
            }
        }

        this.update();
        const geo = app.vector3ToGeoGraphic(point3d) ?? new THREE.Vector3();
        const object = intersects[0] ? intersects[0].object : undefined;
        const data = {x: geo.x, y: geo.y, z: geo.z, fromTerrain: verticalLineLength, fromPrePoint: distance, mesh: object};
        this._infos.push(data);
        this.dispatchEvent({type: 'click', data: data});
        this.dispatchEvent({type: 'change', data: data});
    }

    /**
     * 더블클릭 이벤트를 처리합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} [e] 이벤트 객체
     *
     * @ignore
     */
    #dblClick(e) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        //+ 시작점 생성 후 한번더 클릭시 거리측정 및 해당 지점 POI 생성
        if (this._drawPoint.length > 1) {
            const start = this._drawPoint[this._drawPoint.length - 2];
            const end = this._drawPoint[this._drawPoint.length - 1];
            //+ 시작점 - 끝점을 잇는 직선 생성
            this.getDistanceLine(start, end);
        } else if (this._drawPoint.length === 1) {
            const poiID = (/** @type {import('three').Object3D} */ (this._currentPoi)).id;
            const lonlat1 = app.vector3ToGeoGraphic(this._drawPoint[0]);
            this._distanceObject[poiID] = {
                length: 0,
                points: [/** @type {UAnalyDepthPointData} */(/** @type {unknown} */(lonlat1))]
            };
            this._distanceList.push(poiID);
        }

        //+ 가이드라인 생성시 필요한 격자 sprite / 미리보기 선 가시화 off
        if (this._sprite) {
            this._sprite.visible = false;
        }
        if (this._prevLine) {
            this._prevLine.visible = false;
            this._prevLine.traverse(function (/** @type {import('three').Object3D} */ child) {
                if (child)
                    child.visible = false;
            });
            if (this._prevLine.userData.distanceLine) {
                this._prevLine.userData.distanceLine.visible = false;
            }
        }
        if (this._helperSphere) {
            this._helperSphere.visible = false;
        }
        app._scene.children = app._scene.children.filter(/** @type {(prev: import('three').Object3D) => boolean} */ (prev => prev.name !== 'prevMesh'));

        //+ 마우스 이동 이벤트 종료
        /** @type {UAnalyDepthResult | undefined} */ let data;
        if (this._currentPoi) {
            data = this._distanceObject[this._currentPoi.id];
        }
        app.off('mousemove', this._onChange);
        this.dispatchEvent({type: 'dblclick', data: data});
        this.dispatchEvent({type: 'end', data: data});
        this._currentPoi = undefined;
        this._drawPoint = [];
    }

    /**
     * 격자 Sprite 위에 2D 좌표를 3D 좌표로 변환합니다.
     *
     * @param {number} x 마우스 x 좌표
     * @param {number} y 마우스 y 좌표
     * @param {string} name 호출 유형 이름
     * @param {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} prevObj 이전 POI 객체
     * @returns {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} 변환된 POI 객체
     *
     * @ignore
     */
    #getScreenToWorld_(x, y, name, prevObj) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        const camera = app._camera;
        if(!camera) return prevObj;
        camera.updateMatrixWorld();
        if (this._sprite) this._sprite.updateMatrixWorld();
        TEMP_VECTOR2.set(x, y);
        raycast.setFromCamera(TEMP_VECTOR2, camera);
        /** @type {Array<import('three').Intersection>} */ let intersects;
        if (this._target) {
            intersects = raycast.intersectObjects(this._target);
        } else {
            intersects = this._sprite ? raycast.intersectObject(this._sprite) : [];
        }
        /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} */ let poi;
        /** @type {import('@UMesh').UMesh | undefined} */ let distanceLine;
        if (intersects.length > 0) {
            const point = intersects[0].point;
            TEMP_POSITION.set(point.x, point.y, point.z);
            this._isIntersect = true;
        } else {
            if (this._target) {
                intersects = this._sprite ? raycast.intersectObject(this._sprite) : [];
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    TEMP_POSITION.set(point.x, point.y, point.z);
                    this._isIntersect = false;
                    if (this._helperSphere)
                        this._helperSphere.visible = true;
                }
            } else {
                if (this._helperSphere)
                    this._helperSphere.visible = false;
                return prevObj;
            }
        }
        if (this._helperSphere && this._target) {
            this._helperSphere.position.copy(TEMP_POSITION);
            if (this._isIntersect) {
                /** @type {THREE.MeshBasicMaterial} */ (this._helperSphere.material).color.set(this._intersectColor1);
            } else {
                /** @type {THREE.MeshBasicMaterial} */ (this._helperSphere.material).color.set(this._intersectColor2);
            }
        }
        const addList = false;
        //+ 시작점이 생성 된 후라면 미리보기선의 거리직선 생성
        if (!prevObj && this._drawPoint.length >= 1) {
            const start = /** @type {import('three').Vector3} */ (this._drawPoint[this._drawPoint.length - 1]);
            distanceLine = this.#getDistanceLine_(start, TEMP_POSITION, addList);
            distanceLine.name = name + 'distance';

            this._poiGroup.add(distanceLine);
        }

        if (prevObj) {
            // 1) 위치 이동
            prevObj.setPosition(TEMP_POSITION);

            // 2) 수평 거리 갱신
            if (prevObj.userData.distanceLine) {
                const start = /** @type {import('three').Vector3} */ (this._drawPoint[this._drawPoint.length - 1]);
                const dist =  UMathEngine.getMeterDistanceByGooglePoints(start,TEMP_POSITION); // 미터 스케일
                const newLine = createOrUpdateCylinder(start, TEMP_POSITION, this._lineWidth,
                    prevObj.userData.distanceLine);
                updateDistanceLabel(prevObj.userData.distanceLabel, dist, newLine, prevObj.position);
                (/** @type {{_distance: (number|undefined)}} */ (/** @type {unknown} */ (newLine)))._distance = dist; //미터 스케일
                newLine.userData.distanceLabel = prevObj.userData.distanceLabel;
                prevObj.userData.distanceLine = newLine;
                this._poiGroup.add(newLine);
            }

            // 3) 수직 정보 갱신
            if (prevObj.userData.verticalLine) {
                const groundZ = this._app?.getRenderHeightAtPoint(TEMP_POSITION) || 0; //확인됨
                const newVLine = refreshVerticalInfo(prevObj, groundZ, TEMP_POSITION, this._lineWidth);

                prevObj.userData.verticalLine = newVLine;
                prevObj.userData.bottomPOI.add(newVLine);
            }
            return prevObj;
        }
        /* ---------- 새로운 POI 생성 ---------- */
        poi = /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard} */ (this.#getBasicPoint(TEMP_POSITION, addList));
        poi.name = name;
        this._poiGroup.add(poi);

        // 수직선 + 보조라벨 초기화
        const vLine = /** @type {import('@UMesh').UMesh} */ (this.drawVerticalLine(TEMP_POSITION, false, addList));
        poi.add(/** @type {import('three').Object3D} */ (vLine.parent));
        Object.assign(poi.userData, {
            distanceLine: distanceLine,
            distanceLabel: (/** @type {import('@UMesh').UMesh} */ (distanceLine)).userData.distanceLabel,
            verticalLine: vLine,
            distancePOI: vLine.userData.distancePOI,
            bottomPOI: vLine.userData.bottomPOI,
            bottomLabel: vLine.userData.bottomLabel
        });
        poi.userData.distanceLabel.setPosition((/** @type {import('@UMesh').UMesh} */ (distanceLine)).position);
        poi.userData.distanceLabel.position.sub(poi.position);
        poi.add(poi.userData.distanceLabel);
        poi.userData.distancePOI.setPosition(vLine.position);
        poi.add(poi.userData.distancePOI);

        if (defined(poi))
            return poi;
        else {
            return prevObj;
        }
    }

    /**
     * 마우스 이동 이벤트를 처리합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 이벤트 객체
     *
     * @ignore
     */
    #onChange(e) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!defined(app) || !this._isActive) {
            return;
        }
        if (this._prevLine) {
            this._prevLine.visible = true;
            if (this._prevLine.userData.distanceLine)
                this._prevLine.userData.distanceLine.visible = true;
        }

        if ((this._sprite && this._sprite.visible) || this._target) {
            const clientX = /** @type {number} */ (e.normalizedX);
            const clientY = /** @type {number} */ (e.normalizedY);
            const changeHelper = this.#getScreenToWorld_(clientX, clientY, 'prevLine', this._prevLine);
            if (defined(changeHelper)) {
                this._prevLine = changeHelper;
            }
        }
    }

    /**
     * 두 지점 사이의 거리 라인을 생성합니다.
     *
     * @param {WorldPositionVector3} start 시작 좌표 월드 좌표(EPSG:3857)
     * @param {WorldPositionVector3} end 끝 좌표 월드 좌표(EPSG:3857)
     * @param {boolean} [addList=true] 라벨 목록 추가 여부
     * @returns {import('@UMesh').UMesh} 생성된 라인
     *
     * @ignore
     */
    #getDistanceLine_(start, end, addList = true) {
        // 실제 거리와 라벨을 조립하고 필요 시 라벨 추적 목록에 등록한다.
        return INTERNAL.createDistanceLine(this, start, end, LINE_MATERIAL, addList);
    }

    /**
     * 클릭 지점에 기본 POI를 생성합니다.
     *
     * @param {import('three').Vector3 | import('three').Vector3Like} position 위치 좌표
     * @param {boolean} [addList=true] 라벨 목록 추가 여부
     * @returns {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} 생성된 POI
     *
     * @ignore
     */
    #getBasicPoint(position, addList = true) {
        // 지점 고도를 표시하는 점을 조립하고 필요 시 라벨 추적 목록에 등록한다.
        return INTERNAL.createBasicPoint(this, position, addList);
    }

    /**
     * POI ID로 결과 정보를 저장합니다.
     *
     * @param {number} id POI ID
     *
     * @ignore
     */
    #setResultInfo(id) {
        // 원본 수집값을 별도 결과 객체로 집계한 뒤 저장소와 진행 상태를 갱신한다.
        const result = INTERNAL.collectResult(this._infos);
        this._distanceObject[id] = result;
        this._infos = [];
    }

    /**
     * 그룹의 라벨 목록에서 해당 라벨을 제거합니다.
     *
     * @param {import('three').Object3D} target 대상 그룹
     *
     * @ignore
     */
    #removeLabelList(target) {

        /** @type {Record<string, Array<import('three').Object3D>>} */
        const labelListMap = {
            bottom: this._bottomLabelList,
            vertical: this._verticalLabelList,
            base: this._baseLabelList,
            distance: this._distanceLabelList
        };

        const targets = Object.keys(labelListMap);
        if (target.children && target.children.length > 0) {
            target.traverse(/** @type {(child: import('three').Object3D) => void} */ (child => {
                for (const key of targets) {
                    const labelList = labelListMap[key];
                    if (!labelList) return;

                    const idx = labelList.indexOf(child);
                    if (idx > -1) {
                        labelList.splice(idx, 1);
                        UDEF.disposeObject3D(child);
                    }
                }
            }));
        }
    }

    /**
     * 모든 라벨 목록을 초기화합니다.
     *
     * @ignore
     */
    #clearLabelList() {
        /** @type {Record<string, Array<import('three').Object3D>>} */
        const labelListMap = {
            bottom: this._bottomLabelList,
            vertical: this._verticalLabelList,
            base: this._baseLabelList,
            distance: this._distanceLabelList
        };

        const targets = Object.keys(labelListMap);
        for (const key of targets) {
            const labelList = labelListMap[key];
            if (!labelList) continue;

            for (const label of labelList) {
                if (label) {
                    UDEF.disposeObject3D(label);
                    if (label.parent)
                        label.parent.remove(label);
                }
            }
        }

        this._bottomLabelList = [];
        this._verticalLabelList = [];
        this._baseLabelList = [];
        this._distanceLabelList = [];
    }
}

/**
 * 미리보기 표시와 자원 교체를 연결합니다.
 *
 * @param {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} label
 * @param {number} length
 * @param {import('@union3d/core/mesh/UMesh').UMesh} parent
 * @param {import('three').Vector3} offset
 *
 * @ignore
 */
function updateDistanceLabel(label, length, parent, offset) {
    if (!label) return;
    label.setLabel(`${length.toFixed(2)}m`); //length는 미터스케일로 들어온다.
    label.setPosition(parent.position.clone().sub(offset));
    label.visible = true;
}

/**
 * 미리보기 표시와 자원 교체를 연결합니다.
 *
 * @param {import('three').Vector3} start
 * @param {import('three').Vector3} end
 * @param {number} width
 * @param {import('@union3d/core/mesh/UMesh').UMesh | undefined} old
 * @returns {import('@union3d/core/mesh/UMesh').UMesh}
 *
 * @ignore
 */
function createOrUpdateCylinder(start, end, width, old) {
    // 새 선이 생성된 뒤에만 이전 미리보기를 해제하는 순서를 유지한다.
    const cyl = INTERNAL.createCylinderFromPoints(start, end, LINE_MATERIAL, width);
    if (old) UDEF.disposeObject3D(old);
    return cyl;
}

/**
 * 미리보기 표시와 자원 교체를 연결합니다.
 *
 * @param {import('three').Object3D} poi
 * @param {number} endZ
 * @param {import('three').Vector3} tmpPos
 * @param {number} lineW
 * @returns {import('@union3d/core/mesh/UMesh').UMesh}
 *
 * @ignore
 */
function refreshVerticalInfo(poi, endZ, tmpPos, lineW) {
    // 고도 라인 업데이트
    const realScale = UMathEngine.getRealScaleAtGoogle(tmpPos);
    const baseZ = endZ ?? 0; //3857 스케일로 들어온다
    const height = tmpPos.z - baseZ;  //3857 스케일
    // 수직 표시의 새 형상을 먼저 만들고 아래에서 라벨 갱신과 이전 선 해제를 이어 간다.
    const vLine = INTERNAL.createCylinderFromPoints(tmpPos, {...tmpPos, z: baseZ}, LINE_MATERIAL, lineW);
    vLine.position.set(0, 0, height / 2);
    (/** @type {{_verticalLength: (number|undefined)}} */ (/** @type {unknown} */ (vLine)))._verticalLength = height* realScale; //_verticalLength은 미터스케일을 입력한다.

    const heightText = (tmpPos.z * realScale).toFixed(2) + 'm'; //미터 스케일
    poi.userData.baseLabel.setLabel(heightText);
    poi.userData.baseLabel.visible = true;

    // 수직/수평/고도정보 라벨·POI
    poi.userData.distancePOI.setLabel(`${(height*realScale).toFixed(2)}m`); //미터 스케일
    poi.userData.distancePOI.setPosition({x: 0, y: 0, z: - vLine.position.z});
    poi.userData.distancePOI.visible = true;
    poi.userData.bottomPOI.setPosition({x: 0, y: 0, z: baseZ - tmpPos.z});
    poi.userData.bottomPOI.visible = true;
    poi.userData.bottomLabel.setLabel(`${(baseZ*realScale).toFixed(2)}m`); //미터 스케일
    poi.userData.bottomLabel.visible = true;

    poi.userData.verticalLine.parent?.remove(poi.userData.verticalLine);
    UDEF.disposeObject3D(poi.userData.verticalLine);

    return vLine;
}

export {UAnalyDepth};
