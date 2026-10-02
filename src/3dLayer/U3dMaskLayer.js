import {INTERNAL} from '@union3d/3dLayer/U3dMaskLayer.internal';
import * as THREE from 'three';
import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {defined} from '@union3d/util/defined';
import {defaultValue} from '@union3d/util/defaultValue';
import {Guid} from '@union3d/util/Guid';
import {UDEF} from '@union3d/core/UDEF';
import {UGroup} from '@union3d/core/UGroup';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {USharedMesh} from '@union3d/core/mesh/USharedMesh';
import {U3dGeometryUtil} from '@union3d/geometry/U3dGeometryUtil';
import {CSG} from '@union3d/lib/CSGMesh/CSGMesh';
import {U3dGroupLayer} from '@union3d/3dLayer/U3dGroupLayer';
import {U3dMessage} from '@union3d/message/U3dMessage';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {UMercator} from '@union3d/math/UMercator';

const FIRST_X_POS = -492134.011;
const FIRST_Y_POS = 495993.967;

const INIT_HEIGHT_VALUE = 0;
const MASK_GRID_NAME = "MaskGrid_";
const MASK_GRID_HELPER_NAME = "MaskGridHelper_";
const MASK_BOX_NAME = "MaskBox_";
const SIZE = new THREE.Vector3();
const tempBBox = new THREE.Box3();
const SOUTH_WEST = "southWest";
const SOUTH_EAST = "southEast";
const NORTH_WEST = "northWest";
const NORTH_EAST = "northEast";


/**
 * ~extends U3dModelLayerCO <br>
 * U3dMaskLayer 생성자 옵션
 *
 * @memberOf U3dMaskLayer
 * @inner
 *
 * @typedef {object} U3dMaskLayerCO_Content
 *
 * @property {Object} [infoLayer]
 * mask 값을 설정할 때 참조하는 레이어 객체
 *
 * @property {Object} [drawarg]
 * 좌표 변환, 타일 계산 등에서 참조할 수 있는 draw argument 객체
 *
 * @property {number} [level=17]
 * mask 값을 설정할 때 참조할 타일 레벨
 *
 * @property {number} [height=30]
 * mask layer의 최소 높이 값
 *
 * @property {number} [segments=20]
 * mask 영역을 구성하는 조각의 세분화 정도.
 * 값이 높을수록 더 세밀한 형태로 표현할 수 있지만 연산량이 증가할 수 있음
 *
 * @property {boolean} [setmaskbox=true]
 * mask box 생성 여부.
 * true이면 가시화 시 박스 형상의 mask box를 생성
 *
 * @property {string | number} [boxcolor=0x00ff33]
 * mask box 색상.
 * HEX number 또는 CSS color string 형식으로 지정 가능
 *
 * @property {number} [boxopacity=0.5]
 * mask box 투명도.
 * 0에 가까울수록 투명하고, 1에 가까울수록 불투명
 *
 * @property {Array<unknown>} [extent=[]]
 * mask layer에서 사용할 영역 범위 정보
 *
 * @property {number} [datalevel=15]
 * mask 데이터 처리를 위한 기준 타일 레벨
 *
 * @property {string} [dembaseurl]
 * DEM 데이터 기본 URL.
 * 현재 코드에서는 주석 처리되어 있지만 옵션으로 전달될 수 있는 값
 *
 * @typedef {Omit<U3dModelLayerCO, never> & U3dMaskLayerCO_Content} U3dMaskLayerCO
 */

/**
 * 기반 모델 레이어의 타일에 마스크 값을 저장하고 박스로 표시하는 레이어입니다.
 * 생성·타일 격자 준비·값 반영 후 위치별 셀을 조회하여 바람길 분석에 사용합니다.
 * 기존 동적 인수와 object 반환 타입을 유지하며, 누락 입력의 실제 결과는 각 메서드에서 설명합니다.
 *
 * @group 3dLayer
 * @summary 마스크 격자 레이어
 * @memberof GeOnDT.model
 * @inner
 * @extends {U3dModelLayer}
 */
class U3dMaskLayer extends U3dModelLayer {

    /**
     * 마스크 격자와 박스 표현에 필요한 레이어 상태를 초기화합니다.
     * opt의 falsy 값은 빈 객체로 처리하고, 개별 옵션의 기본값은 undefined에만 적용합니다.
     *
     * @param {U3dMaskLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt) {
        opt = opt || {};
        super(opt);
        const self = this;
        self._name = defaultValue(opt.name, Guid());
        self._masks = {};
        self._drawArg = defaultValue(opt.drawarg, undefined);
        self._infoLayer = defaultValue(opt.infoLayer, undefined);
        self._level = defaultValue(opt.level, 17);
        self._size = undefined;
        self._minlevel = self._level;
        self._height = defaultValue(opt.height, 30);
        self._segments = defaultValue(opt.segments, 20);
        //
        self._maskBoxList = new UGroup();
        self._setMaskBox = defaultValue(opt.setmaskbox, true);
        self._meshLoadList = [];
        self._boxColor = defaultValue(opt.boxcolor, 0x00ff33);
        self._boxOpacity = defaultValue(opt.boxopacity, 0.5);
        self._boxGeometryList = {};
        self._geometryUtil = new U3dGeometryUtil();
        self._maskBoxMaterial = new THREE.MeshBasicMaterial({
            color: self._boxColor,
            wireframe: false,
            opacity: self._boxOpacity,
            transparent: self._boxOpacity < 1,
            forceSinglePass: self._boxOpacity < 1
        });
        self._edgelineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2//,
        });
        self._checkTime = new UCheckTime();
        self._extent = defaultValue(opt.extent, []);
        self._dataLevel = defaultValue(opt.datalevel, 15);
        self._tileMeshMap = new Map();
        self._mercator = new UMercator();

        // self._demUrl = defaultValue(opt.dembaseurl, undefined);
    }

    /**
     * 기반 모델 레이어에 애플리케이션을 연결합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 기반 레이어에 연결할 애플리케이션
     */
    setApp(app) {
        U3dModelLayer.prototype.setApp.call(this, app);
    }

    /**
     * 기반 타일 정리 후 맵에 보관된 마스크 메시를 해제합니다.
     * 기존 그룹 정리 호출과 맵 참조 유지 방식은 변경하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 마스크 메시를 해제할 타일
     */
    disposeTile(tile) {
        const self = this;
        U3dModelLayer.prototype.disposeTile.call(this, tile);

        removeGroupMeshes.call(tile._key);
        if(self._tileMeshMap.has(tile._key)){
            const mesh = self._tileMeshMap.get(tile._key);
            UDEF.disposeObject3D(mesh);
        }
    }

    /**
     * 허용 레벨의 타일을 마스크 표시 조건 검사로 전달합니다.
     * 범위 밖 타일은 상태를 초기화하고 false를 반환합니다.
     * true는 기반 레이어가 생성을 허용했다는 뜻이며 새 메시가 만들어졌음을 보장하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 생성 조건을 검사할 타일
     * @returns {boolean} 레벨 범위와 기반 생성 조건의 통과 여부
     */
    createModel(tile) {
        //U3dModelLayer.prototype.createModel.call(this, tile);
        if (this._minlevel > tile._rlevel || this._maxlevel < tile._rlevel) {
            this.resetStateTile(tile);
            return false;
        }
        return this.createModelByFrustum(tile, this._drawArg);
    }

    /**
     * 마스크 메시·격자·박스 형상과 표시 그룹을 정리합니다.
     * 기존과 같이 타일 메시 맵 항목은 유지하며, 정리 중 예외가 발생하면 후속 처리는 중단합니다.
     * Map 키 반복자의 forEach 지원 여부도 기존 실행 환경의 조건을 유지합니다.
     *
     */
    removeAll() {
        const self = this;

        const keys = self._tileMeshMap.keys();
        keys.forEach(key=>{
            const mesh = self._tileMeshMap.get(key);
            UDEF.disposeObject3D(mesh);
            if(mesh.parent)
                mesh.parent.remove(mesh);

            if(self._masks[key]){
                const mask = self._masks[key];
                mask.gridHelper?.dispose();
                mask.planeGeometry?.dispose();
                delete self._masks[key]
            }


        })
        const groups = Object.values(self._boxGeometryList);
        for (let i = 0; i < groups.length; i++) {
            let group = groups[i];
            for (let j = 0; j < group.length; j++) {
                const child = group[j];
                child.dispose();
            }
            group = [];
        }
        self._boxGeometryList = {};

        UDEF.disposeObject3D(self._maskBoxList)
        if(self._maskBoxList.parent)
            self._maskBoxList.parent.remove(self._maskBoxList);
        self._maskBoxList.clear();


        self._meshLoadList = [];
        self.resetStateTileAll();


        self._group.traverse(child=>{
            if(child.geometry){
                child.geometry.dispose();
            }
            if(child.material){
                child.material.dispose();
            }

        })
        self._group.clear();

    }

    /**
     * 기반 생성 조건에 따라 마스크 그룹을 분리하거나 박스 메시를 준비합니다.
     * 타일 메시 맵에 이미 키가 있으면 추가 생성하지 않습니다.
     * 반환값은 기반 생성 조건의 통과 여부이며 메시 생성 여부와는 구분합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 생성 조건을 검사할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 기반 판정에 전달할 실행 인수
     * @param {boolean} [force] 기반 API에 그대로 전달할 선택 인수. 현재 기반 구현에서는 미사용
     * @returns {boolean} 기반 생성 조건의 통과 여부
     */
    createModelByFrustum(tile, drawArg, force) {
        const self = this;
        if (!U3dModelLayer.prototype.createModelByFrustum.call(this, tile, drawArg, force)) {

            self._group.children.forEach(function (group) {
                if (group.name.includes(tile.getKey())) {
                    group.visible = false;
                    self._group.remove(group);
                }
            })
            return false;
        }else{
            const key = tile._key;
            if(self._tileMeshMap.has(key)) return true;
            createMaskBoxMesh.call(self, key);
            return true;
        }
    }

    /**
     * 장면에서 레이어 그룹을 분리한 뒤 기반 레이어와 마스크 자원을 정리합니다.
     * 기반 호출 후 마스크 자원을 동기적으로 정리하고 기반 dispose의 Promise를 그대로 반환합니다.
     * 동기 예외가 발생하면 그대로 전파하며 이후 정리는 실행하지 않습니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 기반 레이어 해제의 완료 결과를 전달하는 동일 Promise
     */
    dispose() {
        const self = this;
        self._scene.remove(self._group);
        const promise = U3dModelLayer.prototype.dispose.call(this);
        self.removeAll();
        self._maskBoxMaterial.dispose();
        self._edgelineMaterial.dispose();
        return promise;
    }

    /**
     * 갱신 검사기가 허용한 시점에만 캐시 타일과 기반 레이어를 갱신합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 타일 캐시와 실행 인수
     */
    update(drawArg) {
        const self = this;
        if (self._checkTime.isUpdate()) {
            let tiles = Object.values(drawArg._cacheTiles._items);
            for (let tile of tiles) {
                if (!tile._disposed && tile._mesh && tile._rlevel >= self._minlevel) {
                    self.createModel(tile);
                }
            }
            U3dModelLayer.prototype.update.call(self, drawArg);
        }
    }

    /**
     * U3dModelLayer의 prototype을 통해 상속된 U3dLayer 초기화를 현재 인스턴스로 실행합니다.
     * 기반 호출의 반환값은 전달하지 않습니다.
     *
     * @override
     */
    initialize() {
        U3dModelLayer.prototype.initialize.call(this);
    }

    /**
     * 타일 키에 대응하는 마스크 격자가 없을 때만 생성합니다.
     * 기존 격자는 다시 초기화하지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 마스크를 생성할 타일
     */
    createMask(tile) {
        const self = this;
        if (!defined(tile)) return;
        let key = tile.getKey();
        if (!defined(self._masks[key])) {
            self._masks[key] = {}
            createMaskGrid.call(self, tile);
        }
    }

    /**
     * 타일 키에 대응하는 기존 격자 객체를 그대로 반환합니다.
     * 셀에 임의 데이터를 보관하는 기존 동적 반환 계약을 유지합니다.
     *
     * @param {string} key 타일 키
     * @returns {*} 기존 격자 객체 또는 undefined
     */
    getMaskByTileKey(key) {
        const self = this;
        if (defined(self._masks) && defined(self._masks[key])) {
            return self._masks[key]
        }
    }

    /**
     * 월드 위치에 대응하는 타일 키와 격자 내부 셀 인덱스를 구합니다.
     * 위치의 x·y만 사용하며 z는 계산에 사용하지 않습니다.
     * level이 null 또는 undefined이면 레이어 레벨을 사용합니다.
     * 크기가 준비되지 않았으면 undefined를 반환하지만 기존 공개 object 선언은 유지합니다.
     *
     * @param {WorldPosition} position 조회할 월드 위치
     * @param {number} [level=this._level] 조회할 타일 레벨
     * @returns {object} key와 index를 가진 결과 객체. 크기 미준비 시 실제 반환은 undefined
     */
    getKeyByPosition(position, level) {
        const self = this;
        if (!defined(self._size)) return;
        let size = self._size.clone();
        if (!defined(level)) level = self._level;

        let levelOffset = level - self._level;
        size.multiplyScalar(1 / Math.pow(2, levelOffset));

        // tile index 계산
        let gridSizeX = size.x * self._segments;
        let gridSizeY = size.y * self._segments;
        let indexX = Math.floor((position.x - FIRST_X_POS) / gridSizeX);
        let indexY = Math.floor((FIRST_Y_POS - position.y) / gridSizeY);

        const google = self._drawArg.getWorldToGoogle(position.x, position.y);
        const tx = [], ty = [];
        if(!self._mercator)
            self._mercator = new UMercator();

        self._mercator.MetersToTile(google.x, google.y, level, tx, ty);

        let tileKeyX = tx[0] ;
        let tileKeyY = ty[0] ;
        let tileInIndexX = Math.floor((position.x - (gridSizeX * indexX + FIRST_X_POS)) / size.x);
        let tileInIndexY = Math.floor(((FIRST_Y_POS - gridSizeY * indexY) - position.y) / size.y);

        return {
            key: tileKeyX + "_" + tileKeyY + "_" + level,
            index: {x: tileInIndexX, y: tileInIndexY}
        };
    }

    /**
     * 타일과 셀 인덱스에 전달 객체를 저장하고 박스 메시를 표시합니다.
     * 타일이 캐시에 있으면 없는 격자를 생성합니다. 기존 셀 값 초기화와 메시 생성 순서를 유지합니다.
     * 인덱스 범위 또는 메시 부재에 대한 추가 방어 처리를 수행하지 않습니다.
     *
     * @param {string} tileKey 대상 타일 키
     * @param {object} index x와 y를 가진 기존 셀 인덱스 객체
     * @param {object} object value 등 사용자가 보관할 셀 데이터
     */
    setMaskObject(tileKey, index, object) {
        const self = this;
        let grid = self.getMaskByTileKey(tileKey);
        if (!defined(grid)) {
            //+ grid 새로 만들지 여부
            let tile = self._drawArg._cacheModelTiles.get(tileKey) || self._drawArg._cacheTiles.get(tileKey);
            if (!defined(tile))
                return;
            self.createMask(tile);
            grid = self.getMaskByTileKey(tileKey);
        }
        // 사용자 셀 인덱스를 저장소 키로 연결하며 기존 존재 여부와 범위 처리 방식을 유지합니다.
        let key = INTERNAL.getMaskKeyByXYIndex(grid, index.x, index.y);
        let mask = grid.mask;
        if (defined(mask[key]) && defined(mask[key].value))
            mask[key].value = 0;
        setMaskValue.call(self, grid, key, object);
      //  removeGroupMeshes.call(self, tileKey);
        mask[key].mesh = createMaskBoxMesh.call(self, tileKey);
        mask[key].mesh.visible = true;
    }

    /**
     * 지정한 셀에 저장된 객체를 복사하지 않고 반환합니다.
     * 격자나 셀이 없으면 undefined를 반환하지만 기존 공개 object 선언은 유지합니다.
     *
     * @param {string} tileKey 대상 타일 키
     * @param {object} index x와 y를 가진 기존 셀 인덱스 객체
     * @returns {object} 기존 셀 객체. 격자 또는 셀 부재 시 실제 반환은 undefined
     */
    getMaskObject(tileKey, index) {
        const self = this;
        let grid = self.getMaskByTileKey(tileKey);
        if (!defined(grid)) {
            return;
        }
        // 사용자 셀 인덱스를 저장소 키로 연결하며 기존 존재 여부와 범위 처리 방식을 유지합니다.
        let key = INTERNAL.getMaskKeyByXYIndex(grid, index.x, index.y);
        let mask = grid.mask;
        if (defined(mask[key]))
            return mask[key]
    }

    /**
     * 참조 레이어의 모델 높이를 격자 셀에 반영하고 요청 타일의 박스를 표시합니다.
     * 공유 메시와 이미 처리한 메시를 제외하고, 모든 점 검사 이후 타일 상태와 완료 객체를 갱신합니다.
     * infoLayer가 없으면 완료되지 않는 기존 경로도 유지합니다.
     *
     * @param {string} tileKey 높이를 반영할 타일 키
     * @returns {Promise<void>} 기반 비동기 실행의 완료 객체
     */
    createMaskValue(tileKey) {
        const self = this;
        return UDEF.createPromise(function (resolve, reject) {
            try {
                if (defined(self._infoLayer)) { //수정
                    let infoLayer = self._infoLayer;
                    let cacheGroup;
                    let group;
                    if (infoLayer instanceof U3dGroupLayer && defined(infoLayer._listlayer)) {
                        let listLayer = infoLayer._listlayer;
                        let length = listLayer.length;
                        let layer;
                        for (let i = 0; i < length; i++) {
                            layer = listLayer[i];
                            group = layer._cache.get(tileKey);
                            if (defined(group)) {
                                cacheGroup = group;
                                break;
                            }
                        }
                    } else {
                        if (defined(infoLayer._cache))
                            cacheGroup = infoLayer._cache.get(tileKey);
                        else {
                            resolve();
                            return;
                        }
                    }
                    if (defined(cacheGroup)) {
                        let promiseList = [];
                        let bbox = tempBBox.setFromObject(cacheGroup);
                        let tileList = getIntersectTile.call(self, bbox);
                        cacheGroup.traverse(function (child) {
                            if (!(child instanceof USharedMesh) && child instanceof UMesh) {
                                let mesh = child;
                                if ((self._meshLoadList.includes(mesh.getUid())))
                                    return;

                                let csgMesh = CSG.fromGeometry(mesh.geometry, 0);
                                let intersectList = []; //+ mesh Polygon List
                                let keyList = [];

                                let grids, xLength, yLength, firstPosition_, polygon_, vertices, polygonCnt, pos_,
                                    subVector;
                                tileList.forEach(function (key) {
                                    grids = self._masks[key];
                                    if (!defined(grids)) return;

                                    xLength = grids.xLength;
                                    yLength = grids.yLength;
                                    firstPosition_ = grids.startPosition;

                                    let polygonLength = csgMesh.polygons.length;
                                    for (let i = 0; i < polygonLength; i++) {
                                        polygon_ = csgMesh.polygons[i];
                                        vertices = polygon_.vertices;
                                        polygonCnt = 0;

                                        //+ Mesh의 polyon 들이 타일의 범위를 벗어나는지 확인
                                        let verticesLength = vertices.length;
                                        for (let j = 0; j < verticesLength; j++) {
                                            pos_ = vertices[j].pos.clone().add(mesh.position);
                                            if (firstPosition_.x > pos_.x || firstPosition_.y < pos_.y) continue;
                                            subVector = firstPosition_.clone().sub(pos_);
                                            if (Math.abs(subVector.x) > self._size.x * xLength
                                                || Math.abs(subVector.y) > self._size.y * yLength)
                                                continue;
                                            polygonCnt++;
                                        }
                                        if (polygonCnt > 0) {
                                            if (!intersectList.includes(polygon_))
                                                intersectList.push(polygon_);
                                            if (!keyList.includes(key))
                                                keyList.push(key);
                                        }
                                    }
                                })
                                if (intersectList.length > 0 && keyList.length > 0) {
                                    keyList.forEach(function (key_) {// polygon 안에 점이 내접해 있는지 확인
                                        promiseList.push(checkPolygonInPoint.call(self, key_, intersectList, mesh, INIT_HEIGHT_VALUE));
                                    })
                                    self._meshLoadList.push(mesh.getUid());

                                }
                            }
                        })
                        Promise.all(promiseList).then(function () {
                            createMaskBoxMesh.call(self, tileKey);
                            self.setStateTileByKey(tileKey, UDEF.TILE_STATE._end);
                            resolve();
                        }).catch(function (error) {
                            U3dMessage.info(self._classtype, U3dMessage.CNT.MASK.ERROR_ADD_MASK_2, '2214595');
                            reject(error);
                        });
                    }else{
                        resolve();
                    }
                }
            } catch (e) {
                U3dMessage.info(self._classtype, U3dMessage.CNT.MASK.ERROR_ADD_MASK_2, '2214833');
                reject(e);
            }
        });
    }
}

/**
 * 타일의 마스크 저장소와 표시 격자를 초기화합니다.
 * 셀의 초기 값 객체와 격자 크기 벡터의 기존 참조 공유를 유지합니다.
 *
 * @this {U3dMaskLayer}
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 초기화할 타일
 *
 * @ignore
 */
function createMaskGrid(tile) {
    const self = this;
    let size = SIZE;
    const tileKey = tile.getKey();
    const grid = self._masks[tileKey];
    const xLength = self._segments;
    const yLength = self._segments;
    const val = {value: 0};
    const arr = new Array(xLength * yLength).fill(val);

    tile._boundingbox.getSize(size);
    size.multiplyScalar(1 / xLength);
    self._size = size;
    //let firstPosition = tile.getFirstPosition(tile._mesh.geometry);
    let firstPosition = new THREE.Vector3(tile._minx, tile._maxy, 0);
    grid.mask = arr; // maskValue의 값을 담는 배열

    grid.name = MASK_GRID_NAME + tileKey; // tileKey로 이름 지정
    grid.size = size; // mask 간격
    grid.xLength = xLength; // mask 가로 타일 갯수
    grid.yLength = yLength; // mask 새로 타일 갯수
    grid.startPosition = firstPosition; // tile의 시작점
    grid._checkPoints = []; // 값이 지정 된 mask 번호

    //gridHelper 생성
    createGridHelper.call(self, tile);
}

/**
 * 모델 타일 캐시에서 같은 마스크 레벨의 경계 교차 타일 키를 찾습니다.
 *
 * @this {U3dMaskLayer}
 * @param {import('three').Box3} bbox 교차 검사 경계
 * @returns {Array<string> | undefined} 교차 타일 키. 실행 인수가 없으면 undefined
 *
 * @ignore
 */
function getIntersectTile(bbox) {
    const self = this;
    let resultList = [];
    if (!defined(self._drawArg)) return;
    if (defined(self._drawArg) && defined(self._drawArg._cacheModelTiles)) {
        let caches = Object.values(self._drawArg._cacheModelTiles._items);
        caches.forEach(function (tile) {
            if (tile._rlevel === self._minlevel && tile._boundingbox.intersectsBox(bbox)) {
                resultList.push(tile.getKey());
            }
        })
    }
    return resultList;
}

/**
 * 마스크 표시 격자와 점 검사에 사용할 평면 geometry를 생성합니다.
 *
 * @this {U3dMaskLayer}
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 격자를 표시할 타일
 *
 * @ignore
 */
function createGridHelper(tile) {
    const self = this;
    let tileKey = tile.getKey();
    let grid = self._masks[tileKey];
    let xLength = grid.xLength;
    let yLength = grid.yLength;
    let avgLength = Math.ceil((xLength + yLength) / 2);

    const gridHelper = new THREE.GridHelper(self._size.x * xLength, avgLength);
    gridHelper.geometry.applyMatrix4(gridHelper.matrix);
    gridHelper.position.copy(tile._center);
    gridHelper.position.z += self._height;
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.name = MASK_GRID_HELPER_NAME + tileKey;
    gridHelper._layername = self._name;
    gridHelper.updateMatrix();
    grid.gridHelper = gridHelper;
    grid.planeGeometry = new THREE.PlaneGeometry(self._size.x * xLength, self._size.y * yLength, xLength, xLength);
    const group = getGroupByName.call(self, grid.name);
    if(group)
        group.add(gridHelper);
}

/**
 * 폴리곤 내부에 놓인 격자 점을 찾아 주변 셀의 높이를 반영합니다.
 * 복제 평면의 해제 시점과 실패 시 완료 처리 순서는 기존 흐름을 유지합니다.
 *
 * @this {U3dMaskLayer}
 * @param {string} key 검사할 격자의 타일 키
 * @param {Array<U3dMaskLayerPolygon>} intersectList 높이 값을 반영할 폴리곤 목록
 * @param {import('@UMesh').UMesh} mesh 폴리곤을 소유한 메시
 * @param {number} val 최소 높이 기준
 * @returns {Promise<void>} 점 검사 완료 객체
 *
 * @ignore
 */
function checkPolygonInPoint(key, intersectList, mesh, val) {
    const self = this;
    return UDEF.createPromise(function (resolve, reject) {
        let maskGrid = self._masks[key];
        let plane = maskGrid.planeGeometry.clone();
        let positionList = Array.from(plane.attributes.position.array);
        let checkPoint = maskGrid._checkPoints;
        let positionListLen = positionList.length;
        let intersectListLen = intersectList.length;
        let meshPosition = mesh.position;
        let meshId = mesh.getUid();
        let meshLayer = mesh.getLayerName();
        let idx, point, isInside, maskIndex, neighbors, neighborIdx, value;
        neighbors = [SOUTH_WEST, SOUTH_EAST, NORTH_WEST, NORTH_EAST];
        let neighborsLength = neighbors.length;
        try {
            for (let a = 0; a < positionListLen; a += 3) { //grid 점 좌표 list
                idx = a / 3;
                point = [
                    positionList[a] + maskGrid.gridHelper.position.x,
                    positionList[a + 1] + maskGrid.gridHelper.position.y
                ];

                for (let ii = 0; ii < intersectListLen; ii++) { // polygon 내부에 grid 점 내접 여부 확인
                    // 포함된 점의 높이를 폴리곤에 반영하고, 그 결과로 주변 마스크 셀을 갱신합니다.
                    isInside = INTERNAL.inside(point, intersectList[ii], meshPosition, val);
                    if (isInside) {
                        value = {
                            infoName: meshId,
                            infoLayer: meshLayer,
                            value: intersectList[ii]._zValue
                        }
                        if (checkPoint.includes(idx)) {
                            // 이미 검사한 점은 같은 네 방향 셀을 다시 확인하여 더 높은 값을 반영합니다.
                            maskIndex = INTERNAL.getMaskIndexByMaskPoint(maskGrid, idx);
                            for (let i = 0; i < neighborsLength; i++) {
                                neighborIdx = maskIndex[neighbors[i]];
                                let mask = maskGrid.mask[neighborIdx];
                                if (defined(mask) && defined(mask.value)
                                    && mask.value < intersectList[ii]._zValue) {
                                    setMaskValue.call(self, maskGrid, neighborIdx, value);
                                }
                            }
                        }
                        calculateMaskIndex.call(self, idx, maskGrid, value);
                        if (!checkPoint.includes(idx)) {
                            checkPoint.push(idx);
                        }
                    }
                }
            }
            plane.dispose();
            resolve();
        } catch (e) {
            console.log(e);
            U3dMessage.info(self._classtype, U3dMessage.CNT.MASK.ERROR_ADD_MASK_2, '2219561');
            reject(e);
        }
    });
}

/**
 * 격자 점 주변 셀에 값을 적용합니다.
 * 첫 행과 좌우 경계의 기존 중복 제외 조건을 유지합니다.
 *
 * @this {U3dMaskLayer}
 * @param {number} idx 격자 점 번호
 * @param {U3dMaskLayerGridData} maskGrid 값을 적용할 격자
 * @param {U3dMaskLayerCellData} val 저장할 값 객체
 *
 * @ignore
 */
function calculateMaskIndex(idx, maskGrid, val) {
    const self = this;
    let xLength = maskGrid.xLength;
    // 점 주변 셀 번호만 계산에 맡기고 값 선택과 형상 갱신은 이 흐름에서 처리합니다.
    let resultIndex = INTERNAL.getMaskIndexByMaskPoint(maskGrid, idx);

    let res_downLeft = resultIndex[SOUTH_WEST];
    let res_downRight = resultIndex[SOUTH_EAST];

    setMaskValue.call(self, maskGrid, res_downLeft, val);
    if (res_downLeft !== res_downRight)
        setMaskValue.call(self, maskGrid, res_downRight, val);

    //+ 첫줄 이후부터 적용 ( Grid 점 기준 윗줄/아랫줄 둘다 값 적용 )
    if (idx >= xLength) {
        let res_upLeft = resultIndex[NORTH_WEST];
        let res_upRight = resultIndex[NORTH_EAST];
        setMaskValue.call(self, maskGrid, res_upLeft, val);
        if (res_upLeft !== res_upRight)
            setMaskValue.call(self, maskGrid, res_upRight, val);
    }
}

/**
 * 셀의 기존 높이와 새 높이를 비교하여 값 객체를 선택하고 필요하면 박스 형상을 준비합니다.
 * 전달 객체를 복제하지 않으며 기존 0 값의 대체 규칙을 유지합니다.
 *
 * @this {U3dMaskLayer}
 * @param {U3dMaskLayerGridData} maskGrid 대상 격자
 * @param {number} key 셀 번호
 * @param {U3dMaskLayerCellData} val 저장할 값 객체
 *
 * @ignore
 */
function setMaskValue(maskGrid, key, val) {
    const self = this;
    let mask = maskGrid.mask;
    let value = val.value;
    if (!defined(mask) || !defined(key)) return;
    //+ set mask val by point and key
    if (key < mask.length && key >= 0) {
        if (defined(mask[key].value)) {
            if (mask[key].value !== 0) {
                mask[key] = mask[key].value > value ? mask[key] : val;
            } else {
                mask[key] = val;
            }
        } else {
            mask[key] = val;
        }
        if (self._setMaskBox) {
            createMaskBox.call(self, maskGrid, key);
        }
    }
}

/**
 * 셀 값에 대응하는 박스 geometry를 생성하거나 교체하여 병합 목록에 넣습니다.
 * 셀의 기준 점과 높이를 반영하되 기존 형상 해제와 목록 반영 순서를 유지합니다.
 *
 * @this {U3dMaskLayer}
 * @param {U3dMaskLayerGridData} maskGrid 대상 격자
 * @param {number} key 셀 번호
 *
 * @ignore
 */
function createMaskBox(maskGrid, key) {
    const self = this;
    if (!defined(maskGrid) || !defined(key)) return;

    // get Group
    let group = getGroupByName.call(self, maskGrid.name);
    if (!defined(group)) {
        return;
    }

    let mask = maskGrid.mask
    let maskValue = mask[key].value;
    if (!defined(maskValue)) return;
    let gridCenter = maskGrid.gridHelper.position;
    let meshName = MASK_BOX_NAME + key % maskGrid.xLength + "_" + Math.floor(key / maskGrid.xLength);
    // get Mesh or recreate Mesh
    if (maskValue - self._height < 0) {
        return;
    }
    let maskboxGeometry;
    let findGeometry = getGeometryByName.call(self, maskGrid.name, meshName);
    if (defined(findGeometry)) {
        maskboxGeometry = regenerateGeometry.call(self, findGeometry, maskGrid, maskValue);
    } else {
        maskboxGeometry = new THREE.BoxGeometry(maskGrid.size.x, maskGrid.size.y, maskValue - self._height);
        maskboxGeometry.name = meshName;
        maskboxGeometry.groups = [];
    }

    let pointPosition = maskGrid.planeGeometry.attributes.position.array;
    let positionList = maskboxGeometry.attributes.position;
    // 셀의 기준 점을 찾아 기존 평면 배치에 박스 정점을 맞춥니다.
    let maskPoint = INTERNAL.getMaskPointIndex(key, maskGrid.xLength);

    for (let a = 0; a < positionList.array.length; a += 3) {
        positionList.setXYZ(a / 3,
            pointPosition[maskPoint * 3] + maskGrid.size.x / 2  + positionList.array[a],
            pointPosition[maskPoint * 3 + 1] - maskGrid.size.y / 2 + positionList.array[a + 1],
            (maskValue / 2) + (self._height / 2) + positionList.array[a + 2]
        )
    }
    self._boxGeometryList[group.name].push(maskboxGeometry);
}

/**
 * 키에 대응하는 격자 그룹의 메시 자원을 정리합니다.
 * key 인수가 없으면 this의 값과 관계없이 즉시 반환합니다.
 *
 * @this {U3dMaskLayer}
 * @param {string} key 정리할 타일 키
 *
 * @ignore
 */
function removeGroupMeshes(key) {
    const self = this;
    if (!defined(key)) return;
    let maskGrid = self._masks[key];
    if (!defined(maskGrid)) return;
    let group = getGroupByName.call(self, maskGrid.name);
    if (!defined(group)) {
        return;
    }
    group.traverse(function (mesh) {
        if (mesh instanceof UMesh) {
            mesh.geometry.dispose();
            mesh.material.dispose();
            mesh.dispose();
            group.remove(mesh);
        }
    })
}

/**
 * 격자의 geometry 목록을 병합해 표시 메시를 만들고 타일 메시 맵에 보관합니다.
 * 박스와 외곽선은 레이어 재질을 공유하며 이전 맵 항목의 자원을 여기서 해제하지 않습니다.
 *
 * @this {U3dMaskLayer}
 * @param {string} key 표시할 타일 키
 * @returns {import('@UMesh').UMesh | undefined} 생성 메시. 격자 또는 형상 목록이 없으면 undefined
 *
 * @ignore
 */
function createMaskBoxMesh(key) {
    const self = this;
    if (!defined(key)) return;
    let maskGrid = self._masks[key];
    if (!defined(maskGrid)) return;
    let geometryUtil = self._geometryUtil;
    let maskMaterial = self._maskBoxMaterial;

    let group = getGroupByName.call(self, maskGrid.name);
    if (!defined(group)) {
        return;
    }
    let geometryList = self._boxGeometryList[group.name];
    if (!defined(geometryList) || geometryList.length === 0) return;
    const mergedGeometry = geometryUtil.mergeGeometries(geometryList, false);
    let mesh = new UMesh(mergedGeometry, maskMaterial);
    mesh.position.copy(maskGrid?.gridHelper?.position);
    mesh.position.z = 0;
    mesh.setLayerName(self.getName());
    self._tileMeshMap.set(key, mesh);

    mesh.name = group.name;
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, self._edgelineMaterial);
    mesh.add(line);
    group.add(mesh);
    return mesh;
}

/**
 * 같은 이름의 박스 geometry를 목록에서 제거하고 기존 형상을 해제한 뒤 새 형상을 반환합니다.
 *
 * @this {U3dMaskLayer}
 * @param {import('three').BufferGeometry} geometry 교체할 기존 geometry
 * @param {U3dMaskLayerGridData} maskGrid 셀 크기를 제공하는 격자
 * @param {number} value 새 셀 높이
 * @returns {import('three').BoxGeometry | undefined} 새 geometry 또는 undefined
 *
 * @ignore
 */
function regenerateGeometry(geometry, maskGrid, value) {
    const self = this;
    if (!defined(geometry)) return;
    let maskBoxGeometry = new THREE.BoxGeometry(maskGrid.size.x, maskGrid.size.y, value - self._height);
    maskBoxGeometry.groups = [];
    maskBoxGeometry.name = geometry.name;
    let list = self._boxGeometryList[maskGrid.name];
    let idx = list.findIndex(function (geom) {
        return geom.name.toString().equalIgnoreCase(geometry.name);
    })
    if (idx > -1) {
        list.splice(idx, 1);
    }
    geometry.dispose();
    return maskBoxGeometry;
}

/**
 * 격자의 병합 목록에서 이름이 대소문자 구분 없이 일치하는 첫 geometry를 찾습니다.
 *
 * @this {U3dMaskLayer}
 * @param {string} gridName 격자 그룹 이름
 * @param {string} name 찾을 geometry 이름
 * @returns {import('three').BufferGeometry | undefined} 기존 geometry 또는 undefined
 *
 * @ignore
 */
function getGeometryByName(gridName, name) {
    const self = this;
    let group = self._boxGeometryList[gridName]
    if (!defined(group)) return;
    let index = group.findIndex(function (child) {
        return child.name.toString().equalIgnoreCase(name);
    })
    if (index > -1) {
        return group[index];
    } else {
        return undefined;
    }
}

/**
 * 이름이 일치하는 표시 그룹을 반환하고 없으면 새 그룹과 geometry 목록을 준비합니다.
 *
 * @this {U3dMaskLayer}
 * @param {string} name 격자 그룹 이름
 * @returns {import('@UGroup').UGroup | undefined} 표시 그룹. 이름이 없으면 undefined
 *
 * @ignore
 */
function getGroupByName(name) {
    const self = this;
    if (!defined(name)) return;
    let index = self._group.children.findIndex(function (child) {
        return child.name.toString().equalIgnoreCase(name);
    })
    if (index > -1) {
        return self._group.children[index];
    } else {
        let group = new UGroup();
        group.name = name;
        self._group.add(group);
        self._boxGeometryList[group.name] = [];
        return group;
    }
}

export {U3dMaskLayer};
