import * as THREE from 'three';
import { defined } from '@union3d/util/defined';
import { UDEF } from '@union3d/core/UDEF';
import { U3dModelLayer } from '@union3d/3dLayer/U3dModelLayer';
import { defaultValue } from '@union3d/util/defaultValue';
import { U3dModelBasicLayer } from '@union3d/3dLayer/U3dModelBasicLayer';
import { createUserGroup } from '@union3d/util/createUserGroup';
import { U3dSelect } from '@union3d/select/U3dSelect';
import { deferred } from "@util/deferred";
import { UClock } from "@union3d/core/UClock";
import { INTERNAL } from '@union3d/3dLayer/U3dModelTdsLayer.internal';

/**
 * ~extends import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer <br>
 *
 * XML·모델 목록 로딩과 층별 사용자 그룹을 관리하는 레이어입니다. <br>
 * 모델 로더는 부모에 위임하고 사용자 그룹 배치·선택·메타데이터 연결을 제공합니다.
 *
 * @group 3dLayer
 * @extends {U3dModelBasicLayer}
 */
class U3dModelTdsLayer extends U3dModelBasicLayer {
    /**
     * U3dModelTdsLayer 클래스 생성자입니다. <br>
     * 모델 배치와 사용자 그룹·메타데이터 옵션을 보관합니다. <br>
     * baseurl이 없으면 자식 초기화를 중단하며 주소가 있으면 location 또는 position이 필요합니다.
     *
     * @param {Partial<U3dModelTdsLayerCO>} [opt={}] 모델 주소·배치·층 분류 설정
     */
    constructor(opt = {}) {
        super(opt);
        const self = this;
        self._classtype = 'U3dModelTdsLayer';
        self._className = 'U3dModelTdsLayer';
        self._name = defaultValue(opt.name, undefined);
        self._baseUrl = defaultValue(opt.baseurl, undefined);
        if (!defined(self._baseUrl))
            return;
        self._position = defaultValue(opt.position, new THREE.Vector3(0, 0, 0));
        self._scale = defaultValue(opt.scale, new THREE.Vector3(1, 1, 1));
        self._rotation = defaultValue(opt.rotation, { x: 0, y: 0, z: 0 });
        self._type = defaultValue(opt.type, 'animation');
        /** @type {Array<import('three').AnimationMixer>} */
        self._mixers = [];
        self._clock = new UClock();
        /** @type {import('three').AnimationAction | undefined} */
        self._action = undefined;
        self._animationSpeed = defaultValue(opt.animationspeed, 1);
        /** @type {Array<import('@UGroup').UGroup>} */
        self._userGroupList = [];
        self._containMetaData = defaultValue(opt.containMetaData, false);
        self._usePositionOffset = defaultValue(opt.usePositionOffset, false);
        self._positionOffsetName = defaultValue(opt.positionOffsetName, 'position_offset');
        self._jsonFileName = defaultValue(opt.jsonFileName, 'metaData.json');
        self._userGroupDataName = defaultValue(opt.userGroupDataName, 'userGroupData');
        self._setAveragePosition = defaultValue(opt.setAveragePosition, false);
        self._averagePos = undefined;
        /** @type {undefined | null | U3dModelTdsGroupFunction} */
        self._setUserGroupFunction = defaultValue(opt.setUserGroupFunction, userGroupFunction);
        self._userGroupParams = defaultValue(opt.userGroupParams, {});
        self._location = defaultValue(opt.location || opt.position, undefined);
        if (!(self._location instanceof THREE.Vector3)) {
            self._location = new THREE.Vector3(self._location.x, self._location.y, self._location.z);
        }
    }

    /**
     * XML 또는 모델 목록의 로딩을 시작합니다. <br>
     * 완료는 레이어의 resolve로 통지하며 이 메서드는 Promise를 반환하지 않습니다.
     *
     * @override
     */
    initialize() {
        U3dModelLayer.prototype.initialize.call(this);
        // xml이 있을 때
        const self = this;
        if (self._needXml === true) {
            const promise = initWithXML.call(self);
            promise.then(loadModel.bind(self));
        }
        else {
            if (!defined(self._location)) {
                self._location = self._drawArg.getGeographicToWorld(self._geoLocation.x, self._geoLocation.y, self._geoLocation.z);
            }
            self._object._xml = {};
            self._object._xml._title = self._title;
            self._bbox3D = self.get3DBoxFromGoogleBox(self._boundingBox);
            const boxCenter = new THREE.Vector3();
            self._bbox3D.getCenter(boxCenter);
            self._bbox3D.min.sub(boxCenter).add(self._location);
            self._bbox3D.max.sub(boxCenter).add(self._location);
            loadModel.call(self);
        }
    }

    /**
     * 층 분류 함수가 사용할 설정 객체를 저장합니다. <br>
     * 객체를 복사하지 않으며 null·undefined 입력은 무시합니다.
     *
     * @param {U3dModelTdsGroupParams} params 층 이름·간격·분리 문자 설정
     */
    setUserGroupParams(params) {
        const self = this;
        if (!defined(params))
            return;
        self._userGroupParams = params;
    }

    /**
     * 현재 층 분류 설정을 반환합니다.
     *
     * @returns {U3dModelTdsGroupParams | undefined} 저장 객체 자체, 부분 초기화 상태에서는 undefined
     */
    getUserGroupParams() {
        const self = this;
        return self._userGroupParams;
    }

    /**
     * 층별 원본 목록을 결정하는 함수를 교체합니다. <br>
     * 호출 시 this는 레이어이며 null·undefined 입력은 기존 함수를 유지합니다.
     *
     * @param {U3dModelTdsGroupFunction} func 그룹 이름별 원본 목록을 반환하는 함수
     */
    setUserGroupFunction(func) {
        const self = this;
        if (!defined(func))
            return;
        self._setUserGroupFunction = func;
    }

    /**
     * 현재 층 분류 함수의 참조를 반환합니다.
     *
     * @returns {undefined | null | U3dModelTdsGroupFunction} 등록된 함수 또는 미설정 값
     */
    getUserGroupFunction() {
        const self = this;
        return self._setUserGroupFunction;
    }

    /**
     * 모델을 삭제·장면에서 분리하고 사용자 그룹 목록과 이동 타이머를 정리합니다. <br>
     * 기존 계약에 따라 상위 해제 Promise는 반환하지 않습니다.
     *
     * @override
     */
    dispose() {
        const self = this;
        U3dModelLayer.prototype.deleteMesh.call(self, self._object);
        self._scene.remove(self._object);
        self._userGroupList = [];
        self.stopAnimation();
        U3dModelLayer.prototype.dispose.call(self);
    }

    /**
     * 저장된 경계가 Box3이면 복제본을 반환합니다.
     *
     * @override
     *
     * @returns {import('three').Box3 | undefined} 저장 경계의 독립 복제본 또는 경계 없음
     */
    getBoundingBox() {
        const self = this;
        if (self._bbox3D && (self._bbox3D instanceof THREE.Box3)) {
            return self._bbox3D.clone();
        }
    }

    /**
     * 위경도 좌표계(EPSG:4326)의 위치를 월드 좌표(EPSG:3857)로 변환하여 경계와 직접 자식 위치를 이동합니다. <br>
     * z가 주어졌을 때만 높이를 함께 변경하며 위치 변경 뒤 행렬을 직접 갱신하지 않습니다.
     *
     * @param {GeoPosition} geo 지리 좌표 x·y와 선택 높이 z
     */
    setPosition(geo) {
        const self = this;
        if (!defined(self._drawArg))
            return;
        if (!defined(self._drawArg._app))
            return;
        if (!defined(self._group))
            return;
        const app = self._drawArg._app;
        if (!defined(geo))
            return;
        if (!defined(geo.x) || !defined(geo.y))
            return;
        self._geoLocation.x = geo.x;
        self._geoLocation.y = geo.y;
        const worldPosition = app.getGeographicToWorld(geo.x, geo.y);
        if (defined(geo.z)) {
            self._height = geo.z;
            worldPosition.z = geo.z;
            self._geoLocation.z = geo.z;
        }
        self._bbox3D.min.sub(self._location).add(worldPosition);
        self._bbox3D.max.sub(self._location).add(worldPosition);
        self._location = worldPosition;
        self._position = worldPosition;
        for (const child of self._group.children) {
            child.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
        }
    }

    /**
     * 모델 그룹과 그 직접 자식 메시의 현재 위치를 원위치로 복제하여 저장합니다. <br>
     * 그룹이 초기화된 이후 호출하며 더 깊은 자손을 재귀적으로 방문하지 않습니다.
     */
    setGroupOriginPosition() {
        const self = this;
        if (self._group.children.length > 0) {
            for (let k = 0; k < self._group.children.length; k++) {
                const target = self._group.children[k];
                target._oriPosition = target.position.clone();
                for (let i = 0; i < target.children.length; i++) {
                    const mesh = target.children[i];
                    mesh._oriPosition = mesh.position.clone();
                }
            }
        }
    }

    /**
     * 등록된 사용자 그룹 목록의 참조를 반환합니다.
     *
     * @returns {Array<import('@UGroup').UGroup> | undefined} 사용자 그룹 배열 자체 또는 미초기화 상태
     */
    getAllUserGroupList() {
        const self = this;
        if (defined(self._userGroupList))
            return self._userGroupList;
    }

    /**
     * 층 분류 결과에 맞춰 원본 그룹을 이동하고 자식을 복제한 그룹 목록을 만듭니다. <br>
     * 분류 함수가 있으면 반환 키 순서로 배치하며 결과를 등록 목록에 자동 추가하지 않습니다. <br>
     * 호출 전에 setGroupOriginPosition으로 원위치를 준비하십시오.
     *
     * @param {number} floorCount 분류할 최상위 층 번호
     * @param {number} [height=0] 층간 z 이동량
     * @param {string} [commonName] 결과 그룹 이름의 공통 접미사
     * @param {string} [commonChar='0'] 층 번호 앞 비교 문자
     * @param {string} [seperator] 이름 분리 문자, 생략하면 밑줄 자동 분리
     * @returns {Array<import('@UGroup').UGroup> | undefined} 비어 있지 않은 복제 그룹 목록 또는 처리하지 않은 결과
     */
    setFloorFromGroupName(floorCount, height, commonName, commonChar, seperator) {
        const self = this;
        if (!defined(floorCount)) {
            return;
        }
        if (!defined(height)) {
            height = 0;
        }
        if (!defined(commonChar)) {
            commonChar = '0';
        }
        let useSeperator = true;
        if (!defined(seperator)) {
            seperator = '_';
            useSeperator = false;
        }
        const params = {
            floorCount: floorCount,
            height: height,
            commonName: commonName,
            commonChar: commonChar,
            seperator: useSeperator ? seperator : undefined
        };
        self.setUserGroupParams(params);
        const drawArg = self._drawArg;
        // 이 접근은 기존의 초기화 전 호출 오류 시점을 유지하므로 사용값이 없어도 남깁니다.
        const app = drawArg._app;
        if (!defined(self._group))
            return;
        const groupMeshes = self.getGroupMeshes();
        if (defined(self._setUserGroupFunction)) {
            const result = self._setUserGroupFunction.call(self);
            // 사용자 분류 결과로 원본 위치와 이름 연결을 반영하고 복제 그룹을 구성합니다.
            return INTERNAL.createFloorGroups(self, result, height, groupMeshes);
        }
        else {
            // 기본 이름 규칙으로 원본을 분류·이동하여 같은 형태의 복제 그룹 목록을 구성합니다.
            return INTERNAL.createFallbackFloorGroups(self, groupMeshes, floorCount, height, commonName, commonChar, seperator, useSeperator);
        }
    }

    /**
     * 50ms 간격으로 층간 이동량을 증가시키는 타이머를 시작합니다. <br>
     * 반복 경계는 interval*10이며 종료 회차에도 이동을 적용합니다. <br>
     * 기존 구현에서 y·z 생략은 해당 축 대신 x를 0으로 만들므로 세 좌표를 함께 전달하십시오.
     *
     * @param {number | String} interval 반복 회수를 결정하는 값
     * @param {number} [x] 최종 x 이동량
     * @param {number} [y] 최종 y 이동량
     * @param {number} [z] 최종 z 이동량
     */
    animateInterval(interval, x, y, z) {
        const self = this;
        if (!defined(interval)) {
            return;
        }
        if (interval instanceof String) {
            interval = interval * 1;
        }
        if (!defined(x)) {
            x = 0;
        }
        if (!defined(y)) {
            // 기존 API의 대입 대상을 보존합니다. 좌표 기본값 수정은 별도 기능 변경입니다.
            x = 0;
        }
        if (!defined(z)) {
            x = 0;
        }
        let valX = x;
        let valY = y;
        let valZ = z;
        valX /= 10 * interval;
        valY /= 10 * interval;
        valZ /= 10 * interval;
        self.moveUserGroupPosition(0, 0, 0);
        let count = 0;
        if (defined(self._activeInterval)) {
            clearInterval(self._activeInterval);
        }
        const timer = setInterval(function () {
            const inter = interval * 10;
            let valX = x / inter;
            let valY = y / inter;
            let valZ = z / inter;
            if (valX === x && valY === y && valZ === z) {
                clearInterval(timer);
                self._activeInterval = undefined;
                delete self._activeInterval;
            }
            if (count == inter) {
                clearInterval(timer);
                self._activeInterval = undefined;
                delete self._activeInterval;
            }
            valX *= count;
            valY *= count;
            valZ *= count;
            self.moveUserGroupPosition(valX, valY, valZ);
            count += 1;
        }, 50);
        self._activeInterval = timer;
    }

    /**
     * 활성 이동 타이머를 정지하고 요청 시 원위치 이동량을 적용합니다.
     *
     * @param {boolean} [positionInit] truthy이면 층간 이동량을 모두 0으로 설정
     */
    stopAnimation(positionInit) {
        const self = this;
        if (defined(self._activeInterval)) {
            clearInterval(self._activeInterval);
            self._activeInterval = undefined;
            delete self._activeInterval;
        }
        if (positionInit) {
            self.moveUserGroupPosition(0, 0, 0);
        }
    }

    /**
     * 등록 그룹 순서에 따라 층간 이동량을 적용합니다. <br>
     * 등록 이름으로 조회한 원본 목록을 이동하므로 원위치와 그룹 연결이 준비되어야 합니다.
     *
     * @param {number} [x=0] 층간 x 이동량
     * @param {number} [y=0] 층간 y 이동량
     * @param {number} [z=0] 층간 z 이동량
     */
    moveUserGroupPosition(x, y, z) {
        const self = this;
        if (!defined(self._userGroupList))
            return;
        if (!defined(x))
            x = 0;
        if (!defined(y))
            y = 0;
        if (!defined(z))
            z = 0;
        const listCount = self._userGroupList.length;
        for (let i = 0; i < listCount; i++) {
            const groupName = self._userGroupList[i].name;
            const targetGroup = self.getUserGroupList(groupName);
            const position = { x: x, y: y, z: z };
            self.setUserGroupPosition(targetGroup, position, listCount, listCount - (i));
        }
    }

    /**
     * 원위치에 층별 이동량을 더해 전달한 원본 객체 목록을 배치합니다. <br>
     * 활성 그림자의 재계산을 요청하며 객체 행렬은 직접 갱신하지 않습니다.
     *
     * @param {Array<ModelMesh>} group 원위치가 저장된 원본 객체 목록
     * @param {import('three').Vector3Like} [position] 층간 이동량, 생략하면 영벡터
     * @param {number} [floorCount=1] 전체 층 수
     * @param {number} [order=0] 이동량에서 제외할 층 순서
     */
    setUserGroupPosition(group, position, floorCount, order) {
        const self = this;
        if (!defined(floorCount)) {
            floorCount = 1;
        }
        if (!defined(order)) {
            order = 0;
        }
        if (!defined(position)) {
            position = new THREE.Vector3(0, 0, 0);
        }
        if (!(position instanceof THREE.Vector3)) {
            const pos = position;
            position = new THREE.Vector3();
            position.set(pos.x, pos.y, pos.z);
        }
        const xDis = position.x;
        const yDis = position.y;
        const height = position.z;
        const xMax = xDis * floorCount;
        const yMax = yDis * floorCount;
        const floorHeight = height * floorCount;
        const drawArg = self._drawArg;
        const app = drawArg._app;
        if (defined(app._renderer.shadowMap) && app._renderer.shadowMap.enabled) {
            app._renderer.shadowMap.needsUpdate = true;
        }
        if (!defined(self._group))
            return;
        if (group.length > 0) {
            for (let i = 0; i < group.length; i++) {
                const target = group[i];
                target.position.set(target._oriPosition.x + xMax - order * xDis, target._oriPosition.y + yMax - order * yDis, target._oriPosition.z + floorHeight - order * height);
                target._isFloorSet = true;
            }
            for (let a = 0; a < group.length; a++) {
                group[a]._isFloorSet = false;
            }
        }
    }

    /**
     * 같은 이름이 없는 사용자 그룹을 등록합니다. <br>
     * 전달된 그룹 자체를 저장하며 복제하지 않습니다.
     *
     * @param {import('@UGroup').UGroup} group 등록할 그룹
     */
    addUserGroup(group) {
        const self = this;
        const findGroup = self._userGroupList.find(function (userGroup) {
            return userGroup.name === group.name;
        });
        if (!defined(findGroup)) {
            self._userGroupList.push(group);
        }
    }

    /**
     * 선택 메시들을 이름이 있는 사용자 그룹으로 구성합니다. <br>
     * 복제·기존 그룹 병합·등록은 createUserGroup의 처리 계약을 따릅니다.
     *
     * @param {Array<ModelMesh>} group 선택 메시 목록
     * @param {string} groupName 구성할 사용자 그룹 이름
     * @returns {import('@UGroup').UGroup | undefined} 구성된 그룹 또는 생성되지 않은 결과
     */
    setSelectGrouping(group, groupName) {
        const self = this;
        const result = createUserGroup.create.call(self, group, groupName);
        if (defined(result)) {
            return result;
        }
    }

    /**
     * 사용자 그룹에 대응하는 원본 목록 또는 원본 이름 그룹을 조회합니다. <br>
     * origin이 truthy이면 원본 그룹을 우선 찾고, 이름을 생략하면 등록 목록을 반환합니다. <br>
     * 조회 예외는 로그로 기록하고 undefined를 반환합니다.
     *
     * @param {string} [groupName] 조회할 그룹 이름
     * @param {boolean} [origin=false] 원본 그룹 이름을 우선 조회할지 여부
     * @returns {import('three').Object3D | Array<ModelMesh> | Array<import('@UGroup').UGroup> | undefined} 이름·조회 방식에 따른 원본 객체나 목록
     */
    getUserGroupList(groupName, origin) {
        const self = this;
        if (!defined(origin)) {
            origin = false;
        }
        try {
            const result = createUserGroup.getUserGroupList.call(self, groupName, origin);
            if (defined(result)) {
                return result;
            }
        }
        catch (e) {
            console.error('User Group Get Error :', e);
        }
    }

    /**
     * 사용자 그룹의 원본 연결과 메타데이터를 제거합니다. <br>
     * 저장 키 조회 후 createUserGroup.remove에 현재 레이어를 전달합니다.
     *
     * @param {import('@UGroup').UGroup} group 제거할 사용자 그룹
     */
    removeSelectGroup(group) {
        const self = this;
        let key = self.getUserGroupDataName();
        if (!defined(key)) {
            key = 'userGroupData';
        }
        createUserGroup.remove.call(self, group, key);
    }

    /**
     * 저장된 재질 이름을 우선하여 메시 이름을 반환합니다. <br>
     * 저장 이름이 비어 있으면 단일 재질 이름을 다시 저장하며 재질 배열은 펼치지 않습니다.
     *
     * @param {ModelMesh} mesh 이름을 조회할 메시
     * @returns {string | undefined} 저장 이름 또는 재질 이름, 조회할 수 없으면 undefined
     */
    getMeshName(mesh) {
        let meshName = defined(mesh._uMemoryMaterialName) ? mesh._uMemoryMaterialName : defined(mesh.material) ? mesh.material.name : "";
        if (defined(meshName) && meshName !== "")
            return meshName;
        else {
            if (defined(mesh.material) && defined(mesh.material.name)) {
                mesh._uMemoryMaterialName = mesh.material.name;
                meshName = mesh.material.name;
                return meshName;
            }
        }
        return undefined;
    }

    /**
     * 메시와 관련된 파일·그룹·사용자 그룹 메타데이터를 조회합니다. <br>
     * 메타데이터 사용이 켜져 있어야 하며 그룹 존재·메시 부재는 undefined입니다. <br>
     * 그룹 자체가 없으면 그룹·메시 항목이 undefined인 결과 객체를 반환합니다.
     *
     * @override
     *
     * @param {ModelMesh} obj 메타데이터를 조회할 메시
     * @returns {U3dModelTdsMeshMetaData | undefined} 조회 결과 또는 처리 조건이 맞지 않는 결과
     */
    getMeshMetaData(obj) {
        const self = this;
        if (!defined(obj))
            return;
        if (!self._containMetaData)
            return;
        if (!defined(self._metaDataObject)) {
            return;
        }
        const uMemoryName = self.getMeshName(obj);
        if (defined(uMemoryName)) {
            try {
                if (!defined(obj.getMetaDataGroupName())) {
                    obj._metaDataGroupName = obj.getParent().name;
                }
                const fileMetaData = self._metaDataObject.metadata;
                const fileUserGroupData = self._metaDataObject.files[self.getUserGroupDataName()];
                const metaDataGroup = self._metaDataObject.files[obj.getMetaDataGroupName()];
                if (defined(metaDataGroup)) {
                    const metaData = metaDataGroup.objects[uMemoryName];
                    if (defined(metaData))
                        return {
                            fileMetaData: fileMetaData,
                            groupMetaData: metaDataGroup,
                            meshMetaData: metaData,
                            userGroupData: fileUserGroupData
                        };
                }
                else {
                    return {
                        fileMetaData: fileMetaData,
                        groupMetaData: metaDataGroup,
                        meshMetaData: undefined,
                        userGroupData: fileUserGroupData
                    };
                }
            }
            catch (e) {
                console.log('metadata load fail', e);
            }
        }
    }

    /**
     * 그룹 또는 그룹#메시의 메타데이터 항목에 JSON 문자열을 해석하여 저장합니다. <br>
     * 위치 오프셋 키이면 연결된 메시와 행렬을 갱신하며 실패 전 변경은 되돌리지 않습니다. <br>
     * JSON 해석·갱신 중 예외는 로그로 기록합니다.
     *
     * @param {string} target 그룹 이름 또는 그룹#메시 이름
     * @param {string} key 갱신할 메타데이터 키
     * @param {string} value JSON으로 해석할 문자열
     */
    setMetaDataByUser(target, key, value) {
        const self = this;
        if (!defined(target))
            return;
        if (!self._containMetaData)
            return;
        if (!defined(self._metaDataObject)) {
            return;
        }
        if (!defined(key) || !defined(value)) {
            return;
        }
        const targetId = target.split('#');
        const groupName = targetId[0];
        const meshName = targetId[1];
        try {
            let metaDataGroup = self._metaDataObject.files[groupName];
            if (!defined(metaDataGroup)) {
                self._metaDataObject.files[groupName] = {
                    metadata: {},
                    objects: {}
                };
                metaDataGroup = self._metaDataObject.files[groupName];
            }
            if (!defined(meshName)) {
                if (defined(metaDataGroup)) {
                    metaDataGroup.metadata[key] = JSON.parse(value);
                }
            }
            else {
                if (!defined(metaDataGroup.objects)) {
                    metaDataGroup.objects = {};
                }
                const meshMetaData = metaDataGroup.objects[meshName];
                if (defined(meshMetaData)) {
                    meshMetaData[key] = JSON.parse(value);
                }
                else {
                    metaDataGroup.objects[meshName] = {
                        [key]: JSON.parse(value)
                    };
                }
            }
            const positionOffsetName = self._positionOffsetName;
            if (key === positionOffsetName) {
                let updateGroup = self._object.children.find(function (child) {
                    return child.name === groupName;
                });
                if (defined(updateGroup)) {
                    if (defined(meshName)) {
                        const targetMesh = updateGroup.children.find(function (child) {
                            return child._uMemoryMaterialName === meshName || child.material.name === meshName;
                        });
                        if (defined(targetMesh)) {
                            updateGroup._updateMetaDataFn.update(targetMesh, self);
                        }
                    }
                    else {
                        updateGroup.children.map(function (child) {
                            updateGroup._updateMetaDataFn.update(child, self);
                        });
                    }
                }
                else {
                    updateGroup = self._object.children.find(function (child) {
                        if (defined(child._updateMetaDataFn)) {
                            return child;
                        }
                    });
                    if (defined(updateGroup)) {
                        updateGroup.children.map(function (child) {
                            updateGroup._updateMetaDataFn.update(child, self);
                        });
                    }
                }
                self._object.matrixWorldNeedsUpdate = true;
                self._object.updateMatrix();
                self._object.updateMatrixWorld();
            }
        }
        catch (e) {
            console.log('metadata update fail', e);
        }
    }

    /**
     * 사용자 그룹의 메시 이름과 원본 그룹 이름 목록을 메타데이터에 저장합니다. <br>
     * 동일 키의 기존 항목을 교체하며 서버 저장은 수행하지 않습니다.
     *
     * @param {import('@UGroup').UGroup} group 자식 정보를 기록할 사용자 그룹
     * @param {string} key 파일 메타데이터의 저장 키
     */
    applyUserGroup(group, key) {
        const self = this;
        if (!defined(group))
            return;
        if (!self._containMetaData)
            return;
        if (!defined(self._metaDataObject)) {
            return;
        }
        if (group.children.length === 0) {
            return;
        }
        const userGroupName = group.name;
        const childMeshList = Object.values(group.children);
        // 공개 저장 키에 기록할 원본 메시 연결 목록을 구성합니다.
        const meshData = INTERNAL.collectGroupMetadata(self, childMeshList);
        if (!defined(self._metaDataObject.files[key])) {
            self._metaDataObject.files[key] = {};
        }
        self._metaDataObject.files[key][userGroupName] = meshData;
        //+TODO
        // 설정 된 metaData 서버로 정보 전달 후 서버 DB 파일에 저장
    }

    /**
     * 사용자 그룹 메타데이터의 저장 키를 반환합니다.
     *
     * @returns {string} 설정된 이름, null·undefined이면 userGroupData
     */
    getUserGroupDataName() {
        const self = this;
        let key = self._userGroupDataName;
        if (!defined(key)) {
            key = 'userGroupData';
        }
        return key;
    }

    /**
     * 현재 파일 메타데이터의 사용자 그룹 항목을 반환합니다.
     *
     * @returns {Record<string, Array<U3dModelTdsGroupEntry>> | undefined} 저장 항목 자체 또는 해당 항목 없음
     */
    getUserGroupData() {
        const self = this;
        if (defined(self._metaDataObject)) {
            let key = self.getUserGroupDataName();
            if (!defined(key)) {
                key = 'userGroupData';
            }
            const data = self._metaDataObject.files[key];
            if (defined(data)) {
                return data;
            }
        }
    }

    /**
     * XML의 모델 목록과 경계·크기·지리 위치·회전을 레이어에 반영합니다. <br>
     * 파일 목록은 기존 배열에 추가하며 누락 노드의 예외나 앞선 상태 변경을 되돌리지 않습니다.
     *
     * @override
     *
     * @param {XMLHttpRequest} xml responseXML을 가진 완료 요청
     */
    parseXML(xml) {
        const self = this;
        const xmlDoc = xml.responseXML;
        self._xmlList.push(xmlDoc);
        self._title = xmlDoc.getElementsByTagName("Title")[0].firstChild.data;
        self._object._xml = {};
        self._object._xml._title = self._title;
        self._object._xml._firstFileName = undefined;
        // 3ds 파일 배열
        if (xmlDoc.getElementsByTagName('file').length > 0) {
            const files = xmlDoc.getElementsByTagName("file");
            for (let i = 0; i < files.length; i++) {
                const filename = files[i].firstChild.data;
                if (!defined(self._object._xml._firstFileName)) {
                    const fileName_ = filename.split('.')[0];
                    self._object._xml._firstFileName = fileName_;
                }
                if (defined(filename)) {
                    self._listModel.push({
                        name: UDEF.removeExt(UDEF.getFilename(filename)),
                        baseurl: self._path,
                        fileName: UDEF.getFilename(filename)
                    });
                }
                else {
                    self._listModel.push({ name: 'layer' + i, baseurl: self._path, fileName: UDEF.getFilename(filename) });
                }
            }
        }
        self._boundingBox = {
            minx: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('minx')),
            miny: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('miny')),
            maxx: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('maxx')),
            maxy: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('maxy'))
        };
        self._bbox3D = self.get3DBoxFromGoogleBox(self._boundingBox);
        self._scale = {
            x: Number(xmlDoc.getElementsByTagName("Scale")[0].getAttribute('x')),
            y: Number(xmlDoc.getElementsByTagName("Scale")[0].getAttribute('y')),
            z: Number(xmlDoc.getElementsByTagName("Scale")[0].getAttribute('z'))
        };
        if (defined(xmlDoc.getElementsByTagName("Height")[0]) && self._height === 0)
            self._height = Number(xmlDoc.getElementsByTagName("Height")[0].firstChild.data);
        self._geoLocation = {
            x: Number(xmlDoc.getElementsByTagName("Location")[0].getAttribute('x')),
            y: Number(xmlDoc.getElementsByTagName("Location")[0].getAttribute('y')),
            z: Number(xmlDoc.getElementsByTagName("Location")[0].getAttribute('z'))
        };
        if (self._geoLocation.x || self._geoLocation.y || self._geoLocation.z) {
            self._location = self._drawArg.getGeographicToWorld(self._geoLocation.x, self._geoLocation.y, self._geoLocation.z);
            const boxCenter = new THREE.Vector3();
            self._bbox3D.getCenter(boxCenter);
            self._bbox3D.min.sub(boxCenter).add(self._location);
            self._bbox3D.max.sub(boxCenter).add(self._location);
        }
        self._rotation = {
            x: Number(xmlDoc.getElementsByTagName("Rotation")[0].getAttribute('x')),
            y: Number(xmlDoc.getElementsByTagName("Rotation")[0].getAttribute('y')),
            z: Number(xmlDoc.getElementsByTagName("Rotation")[0].getAttribute('z'))
        };
    }

    /**
     * 입력 메시와 연결된 사용자 그룹의 원본들을 선택기에 등록합니다. <br>
     * 동일 이름 메시에는 선택 색과 반투명을 적용하고 원본 스타일을 처음 한 번 보관합니다. <br>
     * 각 그룹 전에 U3dSelect의 선택을 비우며 생성한 선택기를 반환하지 않습니다.
     *
     * @param {ModelMesh} mesh 사용자 그룹 이름이 연결된 입력 메시
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [selector] 생략하면 생성하는 point 모드 선택기
     * @param {Array<ModelMesh>} [group] uuid 중복을 제외하고 원본을 누적할 배열
     */
    getUserGroupMesh(mesh, selector, group) {
        const self = this;
        const modelObj = mesh;
        const userGroupData = self.getUserGroupData();
        if (!defined(selector)) {
            selector = new U3dSelect({ mode: 'point' });
        }
        for (let a = 0; a < modelObj._userGroupName.length; a++) {
            const name = modelObj._userGroupName[a];
            if (defined(userGroupData[name])) {
                const selectGroup = self.getUserGroupList(name);
                if (defined(selectGroup)) {
                    if (selectGroup.length === 0) {
                        return;
                    }
                    else {
                        if (selector instanceof U3dSelect)
                            selector.clearSelect();
                        for (let i = 0; i < selectGroup.length; i++) {
                            const mesh = selectGroup[i];
                            for (let b = 0; b < mesh._userGroupName.length; b++) {
                                if (mesh._userGroupName[b] === name) {
                                    if (defined(group)) {
                                        const isContain = group.find(function (child) {
                                            return child.uuid === mesh.uuid;
                                        });
                                        if (!defined(isContain)) {
                                            group.push(mesh);
                                        }
                                    }
                                    if (self.getMeshName(mesh) !== self.getMeshName(modelObj)) {
                                        selector.addSelected(mesh);
                                    }
                                    else {
                                        const color = 0x7f0000;
                                        const opacity = 0.5;
                                        // 같은 이름 메시의 선택 스타일을 적용하고 원본 스타일은 최초 값으로 보관합니다.
                                        INTERNAL.setMaterialStyle(mesh.material, color, opacity);
                                        const key = selector.getObjectKey(mesh);
                                        selector.setSelectedAsKey(key, mesh);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 모델 그룹의 직접 자식 배열을 반환합니다.
     *
     * @returns {Array<ModelMesh> | undefined} 자식 배열 자체 또는 그룹·목록 미정의
     */
    getGroupMeshes() {
        const self = this;
        if (!defined(self._group))
            return;
        if (!defined(self._group.children))
            return;
        return self._group.children;
    }
}
/**
 * XML을 요청하여 해석한 뒤 레이어로 완료합니다. <br>
 * 주소 부재·200 이외 응답과 네트워크 실패를 별도로 종결하지 않습니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer}
 * @returns {Promise<import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer>} XML 해석 성공을 기다리는 완료 객체
 */
function initWithXML() {
    const promise = deferred();
    const self = this;
    const req = new XMLHttpRequest();
    const xmlUrl = self._xmlUrl;
    if (defined(xmlUrl)) {
        req.overrideMimeType('text/xml');
        req.onload = function () {
            if (this.status === 200) {
                self.parseXML(this);
                promise.resolve(self);
            }
            else if (this.status === 404)
                console.error(xmlUrl + ' 파일이 존재하지 않습니다.');
        };
        req.open("GET", xmlUrl, true);
        req.send();
    }
    return promise;
}
/**
 * U3F 또는 모델 목록의 성공 뒤 로딩 상태와 화면 갱신·레이어 완료를 연결합니다. <br>
 * 비동기 실패를 바깥 완료 객체의 reject로 연결하지 않습니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer}
 * @returns {Promise<import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer | undefined>} U3F 경로의 레이어 또는 목록 경로의 인수 없는 완료 결과
 */
function loadModel() {
    const self = this;
    return UDEF.createPromise(function (resolve, reject) {
        if (defined(self._useU3f) && self._useU3f) {
            self.initializeU3f().then(function () {
                resolve(self);
            });
        }
        else {
            loadListModel.call(self, resolve);
        }
    }).then(function () {
        self._isLoaded = true;
        self._drawArg.setUpdateDate();
        self.resolve(self);
    });
}
/**
 * XML 첫 파일과 일치하는 인덱스부터 모델 목록을 병렬 로딩합니다. <br>
 * 성공 후 객체 배치를 반영하고 완료 콜백을 호출하며 비동기 실패는 로그로 전달합니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer}
 * @param {function} [resolve] 인수 없이 레이어를 this로 호출할 완료 함수
 */
function loadListModel(resolve) {
    const self = this;
    const promises = [];
    let p;
    let firstModelIndex = 0;
    if (self._needXml && defined(self._object._xml)) {
        for (let i = 0; i < self._listModel.length; i++) {
            if (self._listModel[i].name === self._object._xml._firstFileName) {
                firstModelIndex = i;
                break;
            }
        }
    }
    for (let i = firstModelIndex; i < self._listModel.length; i++) {
        p = self.load(self._listModel[i]);
        promises.push(p);
    }
    Promise.all(promises).then((objects) => {
        setAfterLoadedObjects.call(self, objects);
        if (defined(resolve))
            resolve.call(self);
    }).catch((e) => {
        __GError__(self, "load list model is failed : " + e, "5536043");
    });
}
/**
 * 현재 층 이름 설정에 따라 원본 그룹을 이름별로 분류합니다. <br>
 * 반환 목록은 원본 객체를 참조하며 위치나 층 처리 플래그를 변경하지 않습니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer}
 * @returns {Record<string, Array<ModelMesh>> | undefined} 결과 이름별 원본 목록 또는 설정 부재
 */
function userGroupFunction() {
    const self = this;
    let useSeperator = true;
    const userGroupParams = self.getUserGroupParams();
    const floorCount = userGroupParams.floorCount;
    if (!defined(userGroupParams))
        return;
    const commonName = userGroupParams.commonName;
    if (!defined(commonName))
        return;
    const commonChar = userGroupParams.commonChar;
    if (!defined(commonChar))
        return;
    let seperator = userGroupParams.seperator;
    if (!defined(seperator)) {
        seperator = '_';
        useSeperator = false;
    }
    const groupMeshes = self.getGroupMeshes();
    // 기본 함수의 공개 설정 검증 후 이름별 원본 목록만 계산합니다.
    return INTERNAL.classifyFloorGroups(groupMeshes, floorCount, commonName, commonChar, seperator, useSeperator);
}
/**
 * 로딩 객체의 지도 축척과 선택적인 평균 중심 배치를 반영합니다. <br>
 * 평균 중심 배치를 적용한 객체에서만 행렬을 즉시 갱신합니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer}
 * @param {Array<import('three').Object3D>} objects 로딩을 마친 객체 목록
 */
function setAfterLoadedObjects(objects) {
    const self = this;
    if (!objects || objects.length === 0)
        return;
    const averagePos = self._averagePos?.clone?.();
    for (let i = 0; i < objects.length; i++) {
        // 배율과 선택적 중심 배치를 반영하며 행렬 갱신 조건도 함께 유지합니다.
        INTERNAL.applyLoadedObjectTransform(objects[i], averagePos, self);
    }
}
export { U3dModelTdsLayer };
