import * as THREE from 'three';
import { U3dModelLayer } from '@union3d/3dLayer/U3dModelLayer';
import { defined } from '@union3d/util/defined';
import { defaultValue } from '@union3d/util/defaultValue';
import { UDEF } from '@union3d/core/UDEF';
import { UMTLLoader } from '@union3d/core/loader/UMTLLoader';
import { UOBJLoader } from '@union3d/core/loader/UOBJLoader';
import { deferred } from "@union3d/util/deferred";
import { INTERNAL } from '@union3d/3dLayer/U3dModelBIMObjLayer.internal';

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * BIM OBJ 파일의 배치·선택과 메타데이터 및 제어 케이스를 관리합니다.
 *
 * @extends {U3dModelLayer}
 *
 * @ignore
 */
class U3dModelBIMObjLayer extends U3dModelLayer {
    /**
     * MTL·OBJ와 메타데이터를 파일별로 관리하는 레이어를 생성합니다. 필수 옵션 누락 시 로그를 남기고 부분 초기화 상태로 종료합니다.
     *
     * @param {Partial<U3dModelBIMObjLayerCO>} [opt] 생성 옵션
     */
    constructor(opt = {}) {
        super(opt);
        if (!defined(opt)) {
            console.info('U3dModelBIMObjLayer constructor is failed. because opt is null');
            return;
        }
        if (!defined(opt.layername)) {
            console.info('U3dModelBIMObjLayer constructor is failed. because opt.layername is null');
            return;
        }
        if (!defined(opt.serverurl)) {
            console.info('U3dModelBIMObjLayer constructor is failed. because opt.serverurl is null');
            return;
        }
        if (!defined(opt.metaData)) {
            console.info('U3dModelBIMObjLayer constructor is failed. because opt.metaData is null');
            return;
        }
        if (!defined(opt.metaData.files)) {
            console.info('U3dModelBIMObjLayer constructor is failed. because opt.metaData.files is null');
            return;
        }
        if (!defined(opt.baseurl)) {
            console.info('U3dModelBIMObjLayer constructor is failed. because opt.baseUrl is null');
            return;
        }
        this._classtype = 'U3dModelBIMObjLayer';
        this._type = UDEF.LAYER_TYPE.MODEL;
        this._useproxy = defaultValue(opt.useproxy, false);
        this._proxyurl = defaultValue(opt.proxyurl, './proxy.jsp?url=');
        this._name = defaultValue(opt.name, "U3dModelBIMObjLayer");
        this._layername = opt.layername;
        this._metaData = opt.metaData;
        this._autoHeight = opt.autoHeight;
        this._object = this._group;
        this._getControlUrl = "/v1/getBIMControlFile";
        this._setControlUrl = "/v1/setBIMControlFile";
        // 서버와 파일 주소의 기존 결합 규칙을 적용합니다.
        this._serverUrl = (this._useproxy ? this._proxyurl : '') + INTERNAL.exceptEndStr(opt.serverurl);
        this._mergeFileUrlKey = defaultValue(opt.mergeFileUrlKey, 'wavefrontobj_basepath');
        this._mergeFileKey = defaultValue(opt.mergeFileKey, 'wavefrontobj_merge_file');
        this._metaFileKey = defaultValue(opt.metaFileKey, 'metadata_file');
        /** @type {Record<string, U3dBIMFile>} */
        this._files = {};
        const keys = Object.keys(opt.metaData.files);
        for (let i = 0; i < keys.length; i++) {
            const metadata = opt.metaData.files[keys[i]];
            if (this.isValidMetaData(keys[i], metadata)) {
                let metaFileUrl = undefined;
                if (defined(metadata[this._metaFileKey]) && metadata[this._metaFileKey] !== '') {
                    metaFileUrl = (this._useproxy ? this._proxyurl : '') + INTERNAL.exceptEndStr(this._baseUrl) + INTERNAL.exceptStrAtUrl(metadata[this._metaFileKey]);
                }
                this._files[keys[i]] = {
                    name: keys[i],
                    modelUrl: (this._useproxy ? this._proxyurl : '') + INTERNAL.exceptEndStr(this._baseUrl) + INTERNAL.exceptStrAtUrl(metadata[this._mergeFileUrlKey]),
                    metaFileUrl: metaFileUrl,
                    mergeFile: metadata[this._mergeFileKey],
                    materialsFile: 'materials.mtl',
                    location: metadata.location,
                    boundingBox: metadata.boundingbox
                };
            } else {
                console.info('Among the layer information, ' + keys[i] + ' data is not valid');
            }
        }
        this._controlFileUrlList = [];
        /** @type {Record<string, ControlCase>} */
        this._controlCases = {};
        if (opt.metaData.cases && opt.metaData.cases.length > 0) {
            for (let i = 0; i < opt.metaData.cases.length; i++) {
                let caseNumber;
                const url = opt.metaData.cases[i];
                const list = url.split('/');
                for (const str of list) {
                    if (str.includes('#')) {
                        caseNumber = str[str.length - 1];
                        break;
                    }
                }
                const controlFileUrl = '/' + this._layername + '/' + caseNumber;
                this._controlFileUrlList.push(controlFileUrl);
            }
        }
    }

    /**
     * 레이어의 표시 플래그를 변경합니다. 부모의 그룹 정리 동작은 호출하지 않으며, 값이 달라지고 refresh가 참일 때만 앱을 갱신합니다.
     *
     * @override
     *
     * @param {boolean} show 레이어 표시 여부
     * @param {boolean} [refresh] 화면 갱신 여부
     */
    show(show, refresh = true) {
        if (this._visible === show)
            return;
        this._visible = show;
        if (refresh && defined(this._app))
            this._app.forceUpdate();
    }

    /**
     * 부모 초기화 후 파일 로드를 시작하고 레이어의 준비 상태에 성공 또는 실패를 전달합니다.
     *
     * @override
     */
    initialize() {
        if (!defined(this._classtype) || this._classtype !== 'U3dModelBIMObjLayer') {
            return;
        }
        U3dModelLayer.prototype.initialize.call(this);
        this.load.call(this).then(() => {
            this.resolve(this);
        }).catch((e) => {
            this.reject(e);
        });
    }

    /**
     * 파일의 모델 경로·병합 파일·위치·경계가 정의되어 있는지 검사합니다. 값의 형식이나 내부 필드까지 검사하지는 않습니다.
     *
     * @param {string} name 이름
     * @param {U3dBIMSourceFile} [metaData] 검사할 원본 파일 정보
     * @returns {boolean} 필수 항목이 모두 정의되어 있는지 여부
     */
    isValidMetaData(name, metaData) {
        if (!defined(metaData)) {
            return false;
        }
        if (!defined(metaData[this._mergeFileUrlKey])) {
            console.error(name + " " + this._mergeFileUrlKey + "is undefined");
            return false;
        }
        if (!defined(metaData[this._mergeFileKey])) {
            console.error(name + " " + this._mergeFileKey + "is undefined");
            return false;
        }
        if (!defined(metaData.location)) {
            console.error(name + " location is undefined");
            return false;
        }
        if (!defined(metaData.boundingbox)) {
            console.error(name + " boundingbox is undefined");
            return false;
        }
        return true;
    }

    /**
     * 전체 객체의 경계를 처음 요청할 때 계산하여 보관합니다. setPosition에서 교체하기 전에는 같은 상자 참조를 반환합니다.
     *
     * @returns {import('three').Box3} 현재 경계 상자
     */
    getBoundingBox() {
        if (!defined(this._bbox)) {
            this._bbox = new THREE.Box3().setFromObject(this._object);
        }
        return this._bbox;
    }

    /**
     * 현재 등록된 파일 이름을 새 배열로 반환합니다.
     *
     * @returns {Array<string>} 등록된 파일 이름
     */
    getFileNames() {
        return Object.keys(this._files);
    }

    /**
     * 이름별 제어 케이스 사전의 원본 참조를 반환합니다. 반환값을 수정하면 이후 조회와 저장에도 반영됩니다.
     *
     * @returns {Record<string, ControlCase>} 변경 가능한 케이스 사전
     */
    getControlCases() {
        return this._controlCases;
    }

    /**
     * 파일별 배치 높이를 지형에 맞추거나 원본 높이로 되돌립니다. 해당 파일의 객체가 이미 로드되어 있어야 합니다.
     *
     * @param {boolean} autoHeight 지형 고도에 맞출지 여부
     */
    setAutoHeight(autoHeight) {
        this._autoHeight = autoHeight;
        const keys = Object.keys(this._files);
        for (const key of keys) {
            const file = this._files[key];
            const location = this.getPosition(key);
            if (autoHeight) {
                location.z = this._app.getHeightAtGeographicPoint(location) - file.boundingBox.minz;
            } else {
                location.z = file.location.z;
            }
            this.setPosition(key, location);
        }
    }

    /**
     * 파일 이름과 일치하는 첫 직계 객체의 위치를 앱의 지리 좌표로 변환합니다. 일치 객체가 없으면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {GeoPositionVector3 | undefined} 지리 좌표 또는 미조회
     */
    getPosition(fileName) {
        if (!defined(fileName))
            return;
        const list = this._object.getChildren();
        for (const node of list) {
            if (fileName === node.name) {
                return this._app.vector3ToGeoGraphic(node.position);
            }
        }
    }

    /**
     * 파일 이름이 일치하는 직계 객체 모두의 위치와 행렬을 갱신합니다. 입력 객체의 문자열 좌표를 숫자로 바꾸며 전체 경계도 다시 계산합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {U3dBIMLocation} location 적용할 위치; 문자열 성분은 입력 객체에서 숫자로 변경
     */
    setPosition(fileName, location) {
        if (!defined(fileName) || !defined(location))
            return;
        if (typeof (location.x) === 'string') {
            location.x = Number(location.x);
        }
        if (typeof (location.y) === 'string') {
            location.y = Number(location.y);
        }
        if (typeof (location.z) === 'string') {
            location.z = Number(location.z);
        }
        location = this._app.geographicToVector3(location);
        const list = this._object.getChildren();
        for (const node of list) {
            if (fileName === node.name) {
                node.position.x = location.x;
                node.position.y = location.y;
                if (typeof (location.z) === 'string') {
                    location.z = Number(location.z);
                }
                node.position.z = location.z;
                node.updateMatrix();
            }
        }
        this._bbox = new THREE.Box3().setFromObject(this._object);
    }

    /**
     * 제어 케이스에 저장된 위치 변경값을 조회합니다. 렌더 객체의 현재 위치 조회와는 별개입니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {U3dBIMLocation | undefined} 저장된 위치 또는 미조회
     */
    getPositionControl(controlCaseName, fileName) {
        if (!defined(this._controlCases[controlCaseName]) || !defined(fileName)) {
            return;
        }
        return this._controlCases[controlCaseName].getPosition(fileName);
    }

    /**
     * 제어 케이스의 위치 변경값을 저장합니다. 렌더 객체의 위치를 즉시 변경하지는 않습니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {U3dBIMLocation} position 설정할 위치
     * @returns {boolean} 변경 성공 여부
     */
    setPositionControl(controlCaseName, fileName, position) {
        if (!defined(this._controlCases[controlCaseName]) || !defined(fileName) || !defined(position)) {
            return false;
        }
        if (!defined(position.x) || !defined(position.y) || !defined(position.z)) {
            return false;
        }
        return this._controlCases[controlCaseName].setPosition(fileName, position);
    }

    /**
     * 제어 케이스에 객체 ID가 제외 대상으로 등록되어 있는지 조회합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {boolean | undefined} 제외 여부; 케이스가 없으면 undefined
     */
    isExclusionControl(controlCaseName, fileName, objectName) {
        if (!defined(this._controlCases[controlCaseName])) {
            return;
        }
        return this._controlCases[controlCaseName].isExclusion(fileName, objectName);
    }

    /**
     * 제어 케이스의 제외 ID 배열을 그대로 반환합니다. 배열을 수정하면 케이스 저장 내용도 변경됩니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {Array<string> | undefined} 제외 목록 또는 미조회
     */
    getExclusionControlList(controlCaseName, fileName) {
        if (!defined(this._controlCases[controlCaseName])) {
            return;
        }
        return this._controlCases[controlCaseName].getExclusionList(fileName);
    }

    /**
     * 제어 케이스의 객체별 시작 레벨 변경값을 조회합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {number | undefined} 시작 레벨 또는 미조회
     */
    getLevelControl(controlCaseName, fileName, objectName) {
        if (!defined(this._controlCases[controlCaseName])) {
            return;
        }
        return this._controlCases[controlCaseName].getChangeLevel(fileName, objectName);
    }

    /**
     * 제어 케이스의 객체별 레벨 변경값을 새 목록으로 반환합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMLevelEntry> | undefined} 레벨 변경 목록
     */
    getLevelControlList(controlCaseName, fileName) {
        if (!defined(this._controlCases[controlCaseName])) {
            return;
        }
        return this._controlCases[controlCaseName].getChangeLevelList(fileName);
    }

    /**
     * 저장된 변경 자료에서 대상 메타데이터의 속성 키에 해당하는 값을 반환합니다. 대상 메타데이터가 존재해야 합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {unknown} 저장된 속성 또는 미조회
     */
    getPropertiesControl(controlCaseName, fileName, objectName) {
        if (!defined(this._controlCases[controlCaseName])) {
            return;
        }
        const meta = this.getMetaById(fileName, objectName);
        const exportMeta = this._controlCases[controlCaseName].getChangeProperties(fileName, objectName);
        if (defined(exportMeta)) {
            return exportMeta[meta.propertiesKey];
        } else {
            return;
        }
    }

    /**
     * 변경 속성 목록을 대상 메타데이터의 속성 키로 해석하여 반환합니다. 파일과 대상 메타데이터가 존재해야 합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMPropertiesEntry> | undefined} 속성 변경 목록
     */
    getPropertiesControlList(controlCaseName, fileName) {
        if (!defined(this._controlCases[controlCaseName])) {
            return;
        }
        const list = this._controlCases[controlCaseName].getChangePropertiesList(fileName);
        for (const node of list) {
            const meta = this.getMetaById(fileName, node.id);
            node.properties = node.properties[meta.propertiesKey];
        }
        return list;
    }

    /**
     * 메타데이터 ID의 제외 설정을 케이스에 저장합니다. 하위 적용이면 자신도 포함하며 개별 설정 결과와 무관하게 true를 반환합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {boolean} [value] 제외 여부; 누락하면 변경하지 않고 false 반환
     * @param {boolean} [isSetChild] 자신과 하위 메타데이터에 함께 적용할지 여부
     * @returns {boolean} 설정 결과
     */
    setExclusionControl(controlCaseName, fileName, objectName, value, isSetChild) {
        if (!defined(this._controlCases[controlCaseName]) || !defined(fileName) || !defined(objectName) || !defined(value)) {
            return false;
        }
        const meta = this.getMetaById(fileName, objectName);
        if (!defined(meta)) {
            return false;
        }
        if (isSetChild) {
            traverse(meta, (child) => {
                this._controlCases[controlCaseName].setExclusion(fileName, child.getId(), value);
            });
            return true;
        } else {
            return this._controlCases[controlCaseName].setExclusion(fileName, meta.getId(), value);
        }
    }

    /**
     * 유한한 숫자로 변환 가능한 레벨을 케이스에 저장합니다. null 또는 undefined는 기존 설정을 삭제하는 의미입니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {number | string | null} [value] 설정값; nullish이면 기존 설정 삭제
     * @param {boolean} [isSetChild] 자신과 하위 메타데이터에 함께 적용할지 여부
     * @returns {boolean} 설정 결과
     */
    setLevelControl(controlCaseName, fileName, objectName, value, isSetChild) {
        if (!defined(this._controlCases[controlCaseName]) || !defined(fileName) || !defined(objectName)) {
            return false;
        }
        const meta = this.getMetaById(fileName, objectName);
        if (!defined(meta)) {
            return false;
        }
        if (defined(value)) {
            value = Number(value);
            if (Number.isNaN(value) || !Number.isFinite(value)) {
                return false;
            }
        }
        if (isSetChild) {
            traverse(meta, (child) => {
                this._controlCases[controlCaseName].setChangeLevel(fileName, child.getId(), value);
            });
            return true;
        } else {
            return this._controlCases[controlCaseName].setChangeLevel(fileName, meta.getId(), value);
        }
    }

    /**
     * 속성 변경을 케이스에 저장합니다. 비어 있지 않은 문자열은 JSON 해석 후 메타데이터 export 구조로 감싸고, 빈 문자열은 삭제로 처리합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {unknown} [value] 설정값; nullish이면 기존 설정 삭제
     * @returns {boolean} 설정 결과
     */
    setPropertiesControl(controlCaseName, fileName, objectName, value) {
        if (!defined(this._controlCases[controlCaseName]) || !defined(fileName) || !defined(objectName)) {
            return false;
        }
        const meta = this.getMetaById(fileName, objectName);
        if (!defined(meta)) {
            return false;
        }
        if (defined(value) && typeof value === 'string') {
            if (value === '') {
                value = undefined;
            } else {
                try {
                    value = JSON.parse(value);
                    const exportMeta = meta.export();
                    exportMeta[meta.propertiesKey] = value;
                    value = exportMeta;
                } catch (e) {
                    return false;
                }
            }
        }
        return this._controlCases[controlCaseName].setChangeProperties(fileName, meta.getId(), value);
    }

    /**
     * 파일별 빈 변경 자료로 케이스를 만들고 사전에 등록합니다. 같은 이름이 있으면 로그 후 undefined를 반환합니다. 기존 URL 목록이 비면 새 URL도 빈 문자열입니다.
     *
     * @param {string} [caseName] 제어 케이스 이름
     * @returns {ControlCase | undefined} 생성한 케이스 또는 미생성
     */
    createControlCase(caseName) {
        if (!defined(caseName))
            return;
        if (defined(this._controlCases[caseName])) {
            console.error(caseName + ' controlFile is already exist');
            return;
        }
        let createTime;
        const today = new Date();
        createTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ';
        createTime = createTime + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
        const files = {};
        for (const fileName of this.getFileNames()) {
            files[fileName] = {
                change_attributes: {},
                change_level: {},
                change_position: {},
                exclusion_globalids: []
            };
        }
        // 케이스 등록 전에 기존 주소와의 충돌을 확인하여 저장 경로를 선택합니다.
        const url = INTERNAL.chooseControlUrl(this._layername, this._controlFileUrlList);
        const opt = {
            json: {
                name: caseName,
                description: '',
                files: files
            },
            url: url,
            flag: 'add',
            time: createTime
        };
        const controlCase = new ControlCase(opt);
        this._controlCases[caseName] = controlCase;
        this._controlFileUrlList.push(url);
        return controlCase;
    }

    /**
     * 제어 케이스를 서버에 POST하고 같은 URL을 다시 읽어 사전에 반영합니다. XHR의 status가 200이 아니면 readyState와 무관하게 거부합니다.
     *
     * @param {string} [caseName] 제어 케이스 이름
     * @param {boolean} [useProxy] 저장 요청에 프록시를 사용할지 여부
     * @returns {Promise<void>} 저장과 재조회 완료
     */
    exportControlCase(caseName, useProxy) {
        const promise = deferred();
        if (!defined(caseName)) {
            promise.reject("caseName is undefined");
            return promise;
        }
        const controlCase = this.getControlCaseByName(caseName);
        if (!defined(controlCase)) {
            promise.reject(caseName + " control file is undefined");
            return promise;
        }
        try {
            const json = {
                flag: controlCase.flag,
                updateTime: controlCase.lastModifyTime,
                params: controlCase.export()
            };
            let proxyurl = '';
            if (this._useproxy === true || useProxy === true)
                proxyurl = this._proxyurl;
            const url = proxyurl + this._serverUrl + this._setControlUrl + controlCase.url;
            const rawFile = new XMLHttpRequest();
            rawFile.overrideMimeType("application/json");
            rawFile.open("POST", url, true);
            rawFile.onreadystatechange = () => {
                if (rawFile.status !== 200) {
                    const status = rawFile.status;
                    const message = url + " url load error [" + status + "]";
                    promise.reject(message);
                } else {
                    if (rawFile.readyState === 4) {
                        controlCase.setFlag("update");
                        const controlList = [];
                        loadControlTask.call(this, controlCase.getUrl(), controlList)
                            .then(() => {
                                setControlCase.call(this, controlList);
                                promise.resolve();
                            }).catch(function (message) {
                                promise.reject(message);
                            });
                    }
                }
            };
            rawFile.send(JSON.stringify(json));
        } catch (e) {
            const message = 'exportControlCase 실행 중 오류가 발생하였습니다. ';
            promise.reject(message);
        }
        return promise;
    }

    /**
     * 이름에 대응하는 제어 케이스의 원본 참조를 반환합니다.
     *
     * @param {string} name 이름
     * @returns {ControlCase | undefined} 조회한 케이스
     */
    getControlCaseByName(name) {
        return this._controlCases[name];
    }

    /**
     * 등록된 파일의 메타데이터 트리를 그대로 반환합니다. 이름이 지정되었지만 파일이 미등록이면 속성 접근 예외가 발생합니다.
     *
     * @param {string} [fileNme] 파일 이름
     * @returns {MetaDataTree | undefined} 파일의 트리
     */
    getMateDataTree(fileNme) {
        if (!defined(fileNme) || !defined(this._files[fileNme]._objectMetaTree))
            return;
        return this._files[fileNme]._objectMetaTree;
    }

    /**
     * 파일의 객체 사전에서 ID에 대응하는 객체를 조회합니다. 파일이나 사전이 없으면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @returns {U3dBIMMesh | undefined} 조회한 객체
     */
    getObjectById(fileName, id) {
        if (!defined(fileName) || !defined(id))
            return;
        const file = this._files[fileName];
        let object;
        if (defined(file) && defined(file._objectMap)) {
            object = file._objectMap[id];
        }
        return object;
    }

    /**
     * 파일의 메타데이터 사전에서 ID를 조회합니다. 파일이나 트리가 없으면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @returns {MetaData | undefined} 조회한 메타데이터
     */
    getMetaById(fileName, id) {
        if (!defined(fileName) || !defined(id))
            return;
        const file = this._files[fileName];
        let result;
        if (defined(file) && defined(file._objectMetaTree)) {
            const map = file._objectMetaTree.getMap();
            result = map[id];
        }
        return result;
    }

    /**
     * 선택한 파일의 메시 재질에 불투명도를 적용하고 최초 값을 보관합니다. 파일 이름을 찾지 못하면 전체 객체에 적용합니다.
     *
     * @override
     *
     * @param {number} opacity 재질 불투명도
     * @param {string} [fileName] 파일 이름
     */
    setOpacity(opacity, fileName) {
        let object = this._object;
        if (defined(fileName)) {
            const childList = object.getChildren();
            for (const child of childList) {
                if (child.name === fileName) {
                    object = child;
                    break;
                }
            }
        }
        // 선택된 범위의 재질에 불투명도와 복원 상태를 반영합니다.
        INTERNAL.setOpacity(object, opacity);
    }

    /**
     * 선택한 파일의 메시 재질을 보관한 불투명도로 복구합니다. 파일 이름을 찾지 못하면 전체 객체에 적용합니다.
     *
     * @override
     *
     * @param {string} [fileName] 파일 이름
     */
    resetOpacity(fileName) {
        let object = this._object;
        if (defined(fileName)) {
            const childList = object.getChildren();
            for (const child of childList) {
                if (child.name === fileName) {
                    object = child;
                    break;
                }
            }
        }
        // 선택된 범위의 재질에 보관한 불투명도를 복구합니다.
        INTERNAL.resetOpacity(object);
    }

    /**
     * 원본 메타데이터 위치를 다시 적용합니다. 단일 파일을 지정하면 기존 구현대로 배열 키 0을 파일 이름으로 전달합니다.
     *
     * @param {string} [fileName] 파일 이름
     */
    resetPosition(fileName) {
        let files = this._files;
        if (defined(fileName) && defined(this._files[fileName])) {
            files = [this._files[fileName]];
        }
        const keys = Object.keys(files);
        for (const key of keys) {
            const file = files[key];
            const location = {
                x: file.location.x,
                y: file.location.y,
                z: file.location.z,
            };
            this.setPosition(key, location);
        }
    }

    /**
     * 파일 내 개별 객체의 표시 여부를 변경합니다. visible을 생략하면 숨김 상태로 설정합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @param {boolean} [visible] 객체 표시 여부; 생략하면 숨김
     */
    showObject(fileName, id, visible) {
        if (!defined(fileName) || !defined(id))
            return;
        if (!defined(visible))
            visible = false;
        const object = this.getObjectById(fileName, id);
        if (defined(object)) {
            if (visible) {
                object.visible = true;
            } else {
                object.visible = false;
            }
        }
    }

    /**
     * 메타데이터 자신과 하위 객체의 재질을 복제하여 선택 색상을 적용합니다. opacity 인수와 무관하게 선택 불투명도는 1이며 원본 재질은 clear에서 복구합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @param {import('three').ColorRepresentation} [color] 선택 색상; 생략하면 빨강
     * @param {number} [opacity] 기존 인수; 현재 선택 재질에는 항상 1 적용
     */
    select(fileName, id, color, opacity) {
        if (!defined(fileName) || !defined(id))
            return;
        const meta = this.getMetaById(fileName, id);
        if (defined(meta)) {
            let SELECT_COLOR = 0xff0000;
            let SELECT_OPACITY = 1;
            if (defined(color)) {
                SELECT_COLOR = color;
            }
            if (defined(opacity)) {
                SELECT_OPACITY = 1;
            }
            traverse(meta, (meta) => {
                const object = this.getObjectById(fileName, meta.getId());
                if (defined(object) && defined(object.material)) {
                    // 원본 재질을 보관하면서 선택 표시를 적용합니다.
                    INTERNAL.selectMaterial(object, SELECT_COLOR, SELECT_OPACITY);
                }
            });
        }
    }

    /**
     * 선택 재질을 해제하고 원본 재질과 표시 상태를 복구합니다. 선택 재질의 map도 해제하며, 보관한 불투명도는 truthy일 때만 복구합니다.
     */
    clear() {
        this._object.traverse(function (child) {
            if (child instanceof THREE.Mesh && child.material) {
                // 선택 자원을 해제하고 원본 재질을 복원한 뒤 표시 상태를 되돌립니다.
                INTERNAL.restoreMaterial(child);
                child.visible = true;
            }
        });
    }

    /**
     * 파일별로 MTL·OBJ·메타데이터·제어 케이스를 순서대로 로드합니다. 파일 목록이 비어 있으면 반환 완료 객체는 대기 상태로 남습니다.
     *
     * @returns {Promise<void>} 파일 목록 로드 완료
     */
    load() {
        const loadPromise = deferred();
        try {
            const values = Object.values(this._files);
            if (defined(values) && values.length > 0) {
                __GInfo__(this, "BIM OJB 로드를 시작합나다.", '7927960');
                values.reduce((acc, cur) => {
                    return acc.then(() => { return loadTask.call(this, cur); });
                }, Promise.resolve())
                    .then(() => {
                        loadPromise.resolve();
                    }).catch((message) => {
                        loadPromise.reject(message);
                    });
            }
        } catch (e) {
            __GInfo__(this, "BIM OJB 로드 중 오류가 발생하였습니다.", '7928375');
            loadPromise.reject(e.message);
        }
        return loadPromise;
    }

    /**
     * 입력 순서에 따라 부모·자식 관계를 구성합니다. 각 입력 항목의 rootName을 변경하며 반환 트리와 노드는 복사본으로 보호되지 않습니다.
     *
     * @param {string} rootName 메타데이터의 루트 이름
     * @param {Array<U3dBIMMetaRecord>} metaList 메타데이터 목록; 각 원본 항목의 rootName을 변경
     * @returns {MetaDataTree | undefined} 생성한 트리 또는 입력 누락
     */
    makeMetaTree(rootName, metaList) {
        if (!defined(metaList) || !defined(rootName)) {
            return undefined;
        }
        const tree = new MetaDataTree();
        for (let i = 0; i < metaList.length; i++) {
            metaList[i].rootName = rootName;
            const meta = new MetaData(metaList[i]);
            tree.add(meta);
        }
        return tree;
    }
}

/**
 * 서버로 저장할 파일별 변경 자료를 보관합니다. 반환 자료와 공개 필드는 원본 상태를 공유합니다.
 */
class ControlCase {
    /**
     * json, time, url 순서로 정의 여부를 검사하여 첫 누락이면 오류 로그 후 부분 초기화 상태로 종료합니다. 정상 입력이면 url, flag(기본 'update'), json의 name·description·files 원본 참조와 time을 저장합니다.
     *
     * @param {Partial<U3dBIMControlResponse>} [opt] 생성 옵션
     */
    constructor(opt = {}) {
        if (!defined(opt.json)) {
            console.error("ControlCase data is empty");
            return;
        }
        if (!defined(opt.time)) {
            console.error("ControlCase access time is empty");
            return;
        }
        if (!defined(opt.url)) {
            console.error("ControlCase url is empty");
            return;
        }
        this.url = opt.url;
        this.flag = defaultValue(opt.flag, 'update');
        this.name = opt.json.name;
        this.description = opt.json.description;
        this.files = opt.json.files;
        this.lastModifyTime = opt.time;
    }

    /**
     * name·description·files를 가진 새 객체를 반환합니다. files는 원본 참조입니다.
     *
     * @returns {U3dBIMControlData} files를 공유하는 새 저장 객체
     */
    export() {
        const result = {
            name: this.name,
            description: this.description,
            files: this.files
        };
        return result;
    }

    /**
     * name에 입력 name 값을 저장합니다.
     *
     * @param {string} name 이름
     */
    setName(name) {
        this.name = name;
    }

    /**
     * name 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getName() {
        return this.name;
    }

    /**
     * url 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getUrl() {
        return this.url;
    }

    /**
     * url에 입력 url 값을 저장합니다.
     *
     * @param {string} url 케이스 경로
     */
    setUrl(url) {
        this.url = url;
    }

    /**
     * flag에 입력 flag 값을 저장합니다.
     *
     * @param {string} flag 서버 저장 상태
     */
    setFlag(flag) {
        this.flag = flag;
    }

    /**
     * flag 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getFlag() {
        return this.flag;
    }

    /**
     * description에 입력 description 값을 저장합니다.
     *
     * @param {string} description 케이스 설명
     */
    setDescription(description) {
        this.description = description;
    }

    /**
     * description 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getDescription() {
        return this.description;
    }

    /**
     * fileName이나 파일이 없으면 undefined를 반환합니다. change_position과 longitude·latitude·transHeight가 모두 정의된 경우 각각 x·y·z인 새 객체를 반환하고 아니면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {U3dBIMLocation | undefined} 현재 저장값 또는 미조회
     */
    getPosition(fileName) {
        if (!defined(fileName)) {
            return;
        }
        const file = this.files[fileName];
        if (!defined(file)) {
            return;
        }
        const changePosition = file['change_position'];
        if (!defined(changePosition)
            || !defined(changePosition['longitude'])
            || !defined(changePosition['latitude'])
            || !defined(changePosition['transHeight'])) {
            return;
        }
        const position = {
            x: changePosition['longitude'],
            y: changePosition['latitude'],
            z: changePosition['transHeight']
        };
        return position;
    }

    /**
     * fileName, position.x·y·z 또는 파일이 정의되지 않으면 false를 반환합니다. change_position이 없으면 생성하고 longitude·latitude·transHeight에 입력 성분을 그대로 저장한 뒤 true를 반환합니다. position 자체의 누락은 방어하지 않습니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {U3dBIMLocation} position 설정할 위치
     * @returns {boolean} 처리 결과
     */
    setPosition(fileName, position) {
        if (!defined(fileName)) {
            return false;
        }
        if (!defined(position.x) || !defined(position.y) || !defined(position.z)) {
            return false;
        }
        const file = this.files[fileName];
        if (!defined(file)) {
            return false;
        }
        if (!defined(file['change_position'])) {
            file['change_position'] = {};
        }
        file['change_position']['longitude'] = position.x;
        file['change_position']['latitude'] = position.y;
        file['change_position']['transHeight'] = position.z;
        return true;
    }

    /**
     * fileName이나 파일이 정의되지 않으면 undefined를 반환하고 그 외에는 exclusion_globalids 원본 배열을 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {Array<string> | undefined} 현재 저장값 또는 미조회
     */
    getExclusionList(fileName) {
        if (!defined(fileName)) {
            return;
        }
        const file = this.files[fileName];
        if (!defined(file)) {
            return;
        }
        return file['exclusion_globalids'];
    }

    /**
     * 제외 목록이 없거나 길이가 0이면 false를 반환합니다. 항목 중 objectName과 엄격히 같은 값이 있으면 true, 없으면 false를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {boolean} 처리 결과
     */
    isExclusion(fileName, objectName) {
        const exclusionList = this.getExclusionList(fileName);
        if (!defined(exclusionList) || exclusionList.length === 0) {
            return false;
        }
        for (const exclusion of exclusionList) {
            if (objectName === exclusion) {
                return true;
            }
        }
        return false;
    }

    /**
     * 파일의 현재 제외 목록을 조회합니다.
     * 제외 목록·objectName·value 중 정의되지 않은 값이 있으면 false를 반환합니다.
     * value가 truthy이면 이미 있는 값은 그대로 두고 아니면 추가합니다. falsy이면 앞에서 뒤로 순회하면서 일치 항목을 splice하되 인덱스를 되돌리지 않습니다. 처리 후 true를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {boolean} [value] 제외 여부; 누락하면 변경하지 않고 false 반환
     * @returns {boolean} 처리 결과
     */
    setExclusion(fileName, objectName, value) {
        const exclusionList = this.getExclusionList(fileName);
        if (!defined(exclusionList) || !defined(objectName) || !defined(value)) {
            return false;
        }
        if (value) {
            for (const exclusion of exclusionList) {
                if (objectName === exclusion) {
                    return true;
                }
            }
            exclusionList.push(objectName);
        } else {
            for (let i = 0; i < exclusionList.length; i++) {
                if (objectName === exclusionList[i]) {
                    exclusionList.splice(i, 1);
                }
            }
        }
        return true;
    }

    /**
     * 파일이나 objectName이 정의되지 않으면 false를 반환합니다.
     * value가 정의되면 Number로 변환하고 NaN이 아니며 유한할 때만 change_level에 start_level을 저장합니다. 유효하지 않은 숫자는 변경 없이 true를 반환합니다. nullish value이면 해당 키를 삭제한 뒤 true를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {number | string | null} [value] 설정값; nullish이면 기존 설정 삭제
     * @returns {boolean} 처리 결과
     */
    setChangeLevel(fileName, objectName, value) {
        const file = this.files[fileName];
        if (!defined(file) || !defined(objectName)) {
            return false;
        }
        if (defined(value)) {
            value = Number(value);
            if (!Number.isNaN(value) && Number.isFinite(value)) {
                file['change_level'][objectName] = { start_level: value };
            }
        } else {
            delete file['change_level'][objectName];
        }
        return true;
    }

    /**
     * 파일이 정의되지 않아도 종료하지 않고 change_level에 접근합니다. change_level과 해당 objectName 항목이 정의되면 start_level을 반환하고 그 외에는 undefined를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} ObjectName 객체 ID
     * @returns {number | undefined} 현재 저장값 또는 미조회
     */
    getChangeLevel(fileName, ObjectName) {
        const file = this.files[fileName];
        if (!defined(file)) {
        }
        const changeLevel = file['change_level'];
        if (defined(changeLevel) && defined(changeLevel[ObjectName])) {
            return changeLevel[ObjectName]['start_level'];
        } else {
            return;
        }
    }

    /**
     * 파일이 없으면 undefined를 반환합니다. change_level의 키 순서대로 id·level 객체를 새 배열에 담아 반환합니다. change_level 자체의 누락은 방어하지 않습니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMLevelEntry> | undefined} 현재 저장값 또는 미조회
     */
    getChangeLevelList(fileName) {
        const file = this.files[fileName];
        if (!defined(file)) {
            return;
        }
        const changeLevel = file['change_level'];
        const keys = Object.keys(changeLevel);
        const list = [];
        for (const key of keys) {
            list.push({ id: key, level: changeLevel[key]['start_level'] });
        }
        return list;
    }

    /**
     * 파일이나 objectName이 없으면 false를 반환합니다. value가 정의되고 문자열이면 JSON 해석을 시도하여 실패 시 false를 반환합니다.
     * 정의된 value는 change_attributes에 저장하고 nullish 값은 키를 삭제합니다. 처리 후 true를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {unknown} [value] 설정값; nullish이면 기존 설정 삭제
     * @returns {boolean} 처리 결과
     */
    setChangeProperties(fileName, objectName, value) {
        const file = this.files[fileName];
        if (!defined(file) || !defined(objectName)) {
            return false;
        }
        if (defined(value)) {
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    return false;
                }
            }
            file['change_attributes'][objectName] = value;
        } else {
            delete file['change_attributes'][objectName];
        }
        return true;
    }

    /**
     * 파일이 없으면 undefined를 반환하고 아니면 change_attributes의 원본 값을 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} ObjectName 객체 ID
     * @returns {unknown} 현재 저장값 또는 미조회
     */
    getChangeProperties(fileName, ObjectName) {
        const file = this.files[fileName];
        if (!defined(file)) {
            return;
        }
        const changeProperties = file['change_attributes'];
        return changeProperties[ObjectName];
    }

    /**
     * 파일이 없으면 undefined를 반환합니다. change_attributes의 키 순서로 id·properties 객체를 새 배열에 담아 반환하며 각 properties는 원본 참조입니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMPropertiesEntry> | undefined} 현재 저장값 또는 미조회
     */
    getChangePropertiesList(fileName) {
        const file = this.files[fileName];
        if (!defined(file)) {
            return;
        }
        const changeProperties = file['change_attributes'];
        const keys = Object.keys(changeProperties);
        const list = [];
        for (const key of keys) {
            list.push({ id: key, properties: changeProperties[key] });
        }
        return list;
    }
}

/**
 * 입력 키 이름에 따라 메타데이터 값을 보관합니다. 부모·자식 연결은 MetaDataTree가 구성합니다.
 */
class MetaData {
    /**
     * 키 이름은 metaIdKey='GlobalId', metaParentKey='Parent_GlobalId', metaNameKey='Name', fileNameKey='FileName', objectTypeKey='ObjectType', typeKey='Type', tagKey='Tag', propertiesKey='Properties'로 기본 설정합니다.
     * rootNameKey는 opt.rootNameKey가 아니라 opt.fileNameKey를 사용하며 그 값이 nullish이면 'rootName'입니다.
     * 각 키가 가리키는 원본 속성을 id·name·parentId·fileName·rootName·objectType·type·tag·properties에 저장하고 children을 빈 배열로 생성합니다.
     * name이 정의되고 빈 문자열이 아니면 text에 name을 저장하며 아니면 'unnamed'를 저장합니다.
     *
     * @param {U3dBIMMetaRecord} [opt] 원본 메타데이터 값과 키 이름 설정
     */
    constructor(opt = {}) {
        this.metaIdKey = defaultValue(opt.metaIdKey, 'GlobalId');
        this.metaParentKey = defaultValue(opt.metaParentKey, 'Parent_GlobalId');
        this.metaNameKey = defaultValue(opt.metaNameKey, 'Name');
        this.fileNameKey = defaultValue(opt.fileNameKey, 'FileName');
        this.rootNameKey = defaultValue(opt.fileNameKey, 'rootName');
        this.objectTypeKey = defaultValue(opt.objectTypeKey, 'ObjectType');
        this.typeKey = defaultValue(opt.typeKey, 'Type');
        this.tagKey = defaultValue(opt.tagKey, 'Tag');
        this.propertiesKey = defaultValue(opt.propertiesKey, 'Properties');
        this.id = opt[this.metaIdKey];
        this.name = opt[this.metaNameKey];
        this.parentId = opt[this.metaParentKey];
        this.fileName = opt[this.fileNameKey];
        this.rootName = opt[this.rootNameKey];
        this.objectType = opt[this.objectTypeKey];
        this.type = opt[this.typeKey];
        this.tag = opt[this.tagKey];
        this.properties = opt[this.propertiesKey];
        this.children = [];
        if (defined(this.name) && this.name !== "") {
            this.text = this.name;
        } else {
            this.text = "unnamed";
        }
    }

    /**
     * 현재 키 이름으로 id·name·parentId·fileName·objectType·type·tag·properties를 담은 새 객체를 반환합니다. rootName과 children은 포함하지 않고 properties는 같은 참조입니다.
     *
     * @returns {U3dBIMMetaRecord} 현재 키 이름으로 구성한 새 객체
     */
    export() {
        const result = {};
        result[this.metaIdKey] = this.id;
        result[this.metaNameKey] = this.name;
        result[this.metaParentKey] = this.parentId;
        result[this.fileNameKey] = this.fileName;
        result[this.objectTypeKey] = this.objectType;
        result[this.typeKey] = this.type;
        result[this.tagKey] = this.tag;
        result[this.propertiesKey] = this.properties;
        return result;
    }

    /**
     * id의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getId() {
        return this.id;
    }

    /**
     * name의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getName() {
        return this.name;
    }

    /**
     * fileName의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * rootName의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getRootName() {
        return this.rootName;
    }

    /**
     * properties의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getProperties() {
        return this.properties;
    }

    /**
     * parentId의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getParentId() {
        return this.parentId;
    }

    /**
     * metaIdKey의 현재 값을 그대로 반환합니다.
     *
     * @returns {string} 저장한 원본 값
     */
    getIdKey() {
        return this.metaIdKey;
    }

    /**
     * metaParentKey의 현재 값을 그대로 반환합니다.
     *
     * @returns {string} 저장한 원본 값
     */
    getParentKey() {
        return this.metaParentKey;
    }

    /**
     * children의 현재 값을 그대로 반환합니다.
     *
     * @returns {Array<MetaData>} 저장한 원본 값
     */
    getChildren() {
        return this.children;
    }

    /**
     * rootName 속성에 입력값을 저장합니다.
     *
     * @param {string} rootName 메타데이터의 루트 이름
     */
    setRootName(rootName) {
        this.rootName = rootName;
    }
}

/**
 * 루트 목록·입력 순서·ID 사전을 함께 제공하는 메타데이터 트리입니다.
 */
class MetaDataTree {
    /**
     * tree·list를 빈 배열로, map을 빈 객체로 생성합니다.
     */
    constructor() {
        /** @type {Array<MetaData>} */
        this.tree = [];
        /** @type {Array<MetaData>} */
        this.list = [];
        /** @type {Record<string, MetaData>} */
        this.map = {};
    }

    /**
     * tree 원본 배열을 반환합니다.
     *
     * @returns {Array<MetaData>} 변경 가능한 원본 컬렉션
     */
    getTree() {
        return this.tree;
    }

    /**
     * list 원본 배열을 반환합니다.
     *
     * @returns {Array<MetaData>} 변경 가능한 원본 컬렉션
     */
    getList() {
        return this.list;
    }

    /**
     * map 원본 객체를 반환합니다.
     *
     * @returns {Record<string, MetaData>} 변경 가능한 원본 컬렉션
     */
    getMap() {
        return this.map;
    }

    /**
     * 현재 루트 tree 중 부모 ID가 입력 meta의 ID와 같은 노드를 순서대로 meta.children에 옮기고 tree에서 제거합니다.
     * 누적 list에서 ID가 meta의 부모 ID인 첫 노드에 meta를 자식으로 추가합니다. 부모가 없으면 tree에 루트로 추가합니다.
     * map의 입력 ID 항목은 meta로 덮어쓰고 list에는 중복 검사 없이 추가합니다.
     *
     * @param {U3dBIMMetaNode} meta 추가하거나 순회할 메타데이터
     */
    add(meta) {
        // 입력 순서에 관계없이 부모·자식 연결과 조회용 목록을 함께 갱신합니다.
        INTERNAL.addMetaNode(this, meta);
    }

    /**
     * getTree 결과의 각 루트를 현재 순서대로 선행 순회합니다.
     *
     * @param {function} callback 각 메타데이터를 받는 순회 콜백
     */
    traverse(callback) {
        const list = this.getTree();
        for (const node of list) {
            traverse(node, callback);
        }
    }
}

/**
 * 한 파일의 재질·객체·메타데이터·제어 케이스를 순서대로 기다립니다. 단계 실패는 동일한 BIM 로드 오류 문자열로 전달합니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {U3dBIMFile} metaData 파일별 로드 상태
 * @returns {Promise<void>} 작업 완료 상태
 */
async function loadTask(metaData) {
    const taskPromise = deferred();
    try {
        const materials = await loadMTLLoader.call(this, metaData.modelUrl, metaData.materialsFile);
        const object = await loadOBJLoader.call(this, metaData.modelUrl, metaData.mergeFile, materials);
        await setOBJ.call(this, metaData, object);
        const json = await loadMetaFile.call(this, metaData.metaFileUrl, object);
        await setMetaDate.call(this, metaData, object, json);
        const controlCaseList = await loadControlCases.call(this);
        await setControlCase.call(this, controlCaseList);
        taskPromise.resolve();
    } catch (e) {
        const message = "BIM obj load error";
        taskPromise.reject(message);
    }
    return taskPromise;
}

/**
 * 응답 자료로 제어 케이스를 만들어 이름별 사전에 반영합니다. 이름 누락 시 순차 임시 이름을 쓰고 기존 사전은 비우지 않습니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {Array<U3dBIMControlResponse>} [controlCaseList] 반영할 케이스 목록
 * @returns {Promise<void>} 작업 완료 상태
 */
function setControlCase(controlCaseList) {
    const promise = deferred();
    if (!defined(controlCaseList) || controlCaseList.length === 0) {
        promise.resolve();
        return promise;
    }
    let unnamedCount = 1;
    __GInfo__(this, "ControlCase 적용을 시작합니다.", '7930316');
    try {
        for (let i = 0; i < controlCaseList.length; i++) {
            const controlCases = new ControlCase({
                'json': controlCaseList[i].json,
                'time': controlCaseList[i].time,
                'url': controlCaseList[i].url
            });
            let name = controlCases.getName();
            if (!defined(name)) {
                name = 'unnamed' + unnamedCount++;
            }
            controlCases.setName(name);
            this._controlCases[name] = controlCases;
        }
        __GInfo__(this, "ControlCase 적용이 완료되었습니다.", '7930911');
        promise.resolve();
    } catch (e) {
        const message = 'ControlCase 적용 중 오류가 발생하였습니다. ';
        promise.reject(message);
    }
    return promise;
}

/**
 * 제어 케이스를 GET으로 읽어 결과 배열에 추가합니다. status가 200이 아니면 실패 대신 결과 없이 완료합니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {string} controlFileUrl 제어 케이스 경로
 * @param {Array<U3dBIMControlResponse>} resultList 응답을 추가할 결과 배열
 * @returns {Promise<void>} 작업 완료 상태
 */
function loadControlTask(controlFileUrl, resultList) {
    const taskPromise = deferred();
    try {
        const url = (this._useproxy ? this._proxyurl : '') + this._serverUrl + this._getControlUrl + controlFileUrl;
        const rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", url, true);
        rawFile.onreadystatechange = function () {
            if (rawFile.status !== 200) {
                const status = rawFile.status;
                console.debug(url + " url load error [" + status + "]");
                taskPromise.resolve();
            } else {
                if (rawFile.readyState === 4) {
                    const controlCase = JSON.parse(rawFile.responseText);
                    if (!defined(controlCase) || !defined(controlCase.params) || !defined(controlCase.params.data)) {
                        console.debug(url + " url response data is not available");
                    } else {
                        controlCase.params.data.url = controlFileUrl;
                        resultList.push(controlCase.params.data);
                    }
                    taskPromise.resolve();
                }
            }
        };
        rawFile.send(null);
    } catch (e) {
        const message = 'ControlCases 로드 중 오류가 발생하였습니다. ';
        taskPromise.reject(message);
    }
    return taskPromise;
}

/**
 * 등록된 제어 URL을 순차 요청합니다. URL 목록이 없으면 결과 없이 완료합니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @returns {Promise<Array<U3dBIMControlResponse> | undefined>} 작업 완료 상태
 */
function loadControlCases() {
    const promise = deferred();
    if (!defined(this._controlFileUrlList) || this._controlFileUrlList.length === 0) {
        promise.resolve();
        return promise;
    }
    __GInfo__(this, "ControlCases 로드를 시작합니다.", '7932839');
    try {
        const controlCaseList = [];
        this._controlFileUrlList.reduce((acc, cur) => {
            return acc.then(() => { return loadControlTask.call(this, cur, controlCaseList); });
        }, Promise.resolve())
            .then(() => {
                __GInfo__(this, "ControlCases 로드가 완료되었습니다.", '7933158');
                promise.resolve(controlCaseList);
            }).catch((message) => {
                promise.reject(message);
            });
    } catch (e) {
        const message = 'ControlCases 로드 중 오류가 발생하였습니다. ';
        promise.reject(message);
    }
    return promise;
}

/**
 * OBJ 메시 이름과 메타데이터 ID를 연결합니다. 예상 메시 수에 도달한 순회 콜백에서만 완료하므로 메시가 없으면 대기 상태로 남습니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {U3dBIMFile} metaData 파일별 로드 상태
 * @param {import('three').Object3D} object 로드한 OBJ 객체
 * @param {Record<string, U3dBIMMetaRecord>} json ID별 원본 메타데이터
 * @returns {Promise<void>} 작업 완료 상태
 */
function setMetaDate(metaData, object, json) {
    const promise = deferred();
    if (!defined(metaData)) {
        promise.resolve();
        return promise;
    }
    if (!defined(json) || !defined(metaData)) {
        const message = 'OBJ 인스턴스와 메타 정보 연결 중 입력 파라메터가 잘 못되었습니다.';
        promise.reject(message);
        return promise;
    }
    __GInfo__(this, 'OBJ 인스턴스와 메타 정보 연결을 시작합니다.', '7933902');
    try {
        const allObject = Object.values(json);
        const tree = this.makeMetaTree.call(this, metaData.name, allObject);
        const map = tree.getMap();
        const nonMatchMeta = Object.assign({}, json);
        let count = 0;
        let matchCount = 0;
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const meta = map[child.name];
                if (defined(meta)) {
                    if (child.name === meta.getId()) {
                        child._meta = meta;
                        child.getMeta = function () {
                            return this._meta;
                        };
                        delete nonMatchMeta[child.name];
                        matchCount++;
                    } else {
                        __GInfo__(this, child.name + "의 메타 정보 NAME 과 " + meta.getId() + ' ' + meta.getIdKey() + ' 이 달라 연결 될 수 없습니다.', '7934837');
                    }
                }
                count++;
                if (count === metaData._objectLength) {
                    metaData._nonMatchMeta = nonMatchMeta;
                    metaData._objectMetaTree = tree;
                    __GInfo__(this, 'OBJ 인스턴스와 메타 정보 연결이 완료되었습니다.', '7935153');
                    __GInfo__(this, "전체 메타 정보수 : " + allObject.length +
                        " / 전체 인스턴스 수: " + metaData._objectLength +
                        " / 연결 안된 메타 정보 수: " + Object.keys(nonMatchMeta).length +
                        " / 연결된 메타 정보 수: " + matchCount, '7935444');
                    promise.resolve();
                }
            }
        });
    } catch (e) {
        const message = 'OBJ 인스턴스와 메타 정보 연결 중 오류가 발생하였습니다. ';
        promise.reject(message);
    }
    return promise;
}

/**
 * 메타데이터 JSON을 GET으로 읽습니다. URL이 없으면 결과 없이 완료하고, 비동기 콜백의 JSON 해석 예외는 별도로 잡지 않습니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {string | undefined} metaFileUrl 메타데이터 URL
 * @param {import('three').Object3D} object 로드한 OBJ 객체
 * @returns {Promise<Record<string, U3dBIMMetaRecord> | undefined>} 작업 완료 상태
 */
function loadMetaFile(metaFileUrl, object) {
    const promise = deferred();
    if (!defined(metaFileUrl)) {
        promise.resolve();
        return promise;
    }
    if (!defined(object)) {
        const message = '메타 정보 로드 중 입력 파라메터가 잘 못되었습니다.';
        promise.reject(message);
        return promise;
    }
    __GInfo__(this, '메타 정보 로드를 시작합니다.', '7936115');
    try {
        const rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", metaFileUrl, true);
        rawFile.onreadystatechange = () => {
            if (rawFile.status !== 200) {
                const status = rawFile.status;
                const message = metaFileUrl + " load error " + status + " ";
                promise.reject(message);
            } else {
                if (rawFile.readyState === 4) {
                    __GInfo__(this, '메타 정보 로드가 완료되었습니다.', '7936671');
                    const json = JSON.parse(rawFile.responseText);
                    promise.resolve(json);
                }
            }
        };
        rawFile.send(null);
    } catch (e) {
        const message = '메타 정보 로드 중 오류가 발생하였습니다. ' + e.message;
        promise.reject(message);
    }
    return promise;
}

/**
 * 로드한 객체의 메시·재질·배치를 설정하고 레이어 그룹에 추가합니다. 작업 중 예외는 고정 오류 문자열로 거부합니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {U3dBIMFile} metaData 파일별 로드 상태
 * @param {import('three').Object3D} object 로드한 OBJ 객체
 * @returns {Promise<void>} 작업 완료 상태
 */
function setOBJ(metaData, object) {
    const promise = deferred();
    if (!defined(object) || !defined(metaData) || !defined(metaData.name) || !defined(metaData.location) || !defined(metaData.boundingBox)) {
        const message = 'OBJ 인스턴스 설정 중 입력 파라메터가 잘 못되었습니다.';
        promise.reject(message);
        return promise;
    }
    try {
        object.name = metaData.name;
        metaData._objectLength = 0;
        __GInfo__(this, 'OBJ 인스턴스 설정을 시작합니다.', '7937533');
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // 메시의 렌더 설정을 준비한 뒤 파일별 조회 사전에 등록합니다.
                INTERNAL.configureMesh(child, this._name, this._renderOrder);
                metaData._objectLength++;
                if (!defined(metaData._objectMap)) {
                    metaData._objectMap = {};
                }
                metaData._objectMap[child.name] = child;
            }
        });
        let z = metaData.location.z;
        if (this._autoHeight) {
            z = this._app.getHeightAtGeographicPoint(metaData.location) - metaData.boundingBox.minz;
        }
        let location = {
            x: metaData.location.x,
            y: metaData.location.y,
            z: z
        };
        location = this._app.geographicToVector3(location);
        object.position.x = location.x;
        object.position.y = location.y;
        object.position.z = location.z;
        this._object.add(object);
        __GInfo__(this, 'OBJ 인스턴스 설정이 완료되었습니다.', '7939554');
        promise.resolve();
    } catch (error) {
        const message = 'OBJ 인스턴스 설정 중 오류가 발생하였습니다.';
        promise.reject(message);
    }
    return promise;
}

/**
 * 재질과 기준 경로를 설정하여 OBJ를 읽고 성공 객체 또는 로더 실패를 전달합니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {string} modelUrl 모델 기준 URL
 * @param {string} mergeFile OBJ 파일 이름
 * @param {import('three/addons/loaders/MTLLoader.js').MTLLoader.MaterialCreator} materials 미리 준비한 OBJ 재질
 * @returns {Promise<import('three').Object3D>} 작업 완료 상태
 */
function loadOBJLoader(modelUrl, mergeFile, materials) {
    const promise = deferred();
    const loader = new UOBJLoader();
    if (!defined(materials) || !defined(modelUrl) || !defined(mergeFile)) {
        const message = 'OBJLoader 로드 중 입력 파라메터가 잘 못되었습니다.';
        promise.reject(message);
        return promise;
    }
    loader.setMaterials(materials);
    loader.setPath(modelUrl);
    __GInfo__(this, 'OBJ 파일 로드를 시작합니다.', '7940232');
    loader.load("/" + mergeFile, (object) => {
        __GInfo__(this, 'OBJ 파일 로드가 완료되었습니다.', '7940345');
        promise.resolve(object);
    }, function (xhr) {
    }, function (error) {
        const message = 'UOBJLoader 로드 중 오류가 발생하였습니다.';
        promise.reject(message);
    });
    return promise;
}

/**
 * MTL을 읽어 재질을 미리 준비한 뒤 전달합니다. 로더 실패는 고정 오류 문자열로 거부합니다.
 *
 * @this {U3dModelBIMObjLayer}
 *
 * @param {string} modelUrl 모델 기준 URL
 * @param {string} materialsFile MTL 파일 이름
 * @returns {Promise<import('three/addons/loaders/MTLLoader.js').MTLLoader.MaterialCreator>} 작업 완료 상태
 */
function loadMTLLoader(modelUrl, materialsFile) {
    const promise = deferred();
    const mtlLoader = new UMTLLoader();
    if (!defined(modelUrl) || !defined(materialsFile)) {
        const message = 'MTLLoader 로드 중 입력 파라메터가 잘 못되었습니다.';
        promise.reject(message);
        return promise;
    }
    mtlLoader.setPath(modelUrl);
    mtlLoader.setCrossOrigin('anonymous');
    __GInfo__(this, "OBJ 머터리얼 로드를 시작합니다.", '7941034');
    mtlLoader.load("/" + materialsFile, (materials) => {
        materials.preload();
        __GInfo__(this, "OBJ 머터리얼 로드가 완료되었습니다.", '7941188');
        promise.resolve(materials);
    }, function (xhr) {
    }, function (error) {
        const message = 'MTLLoader 로드 중 오류가 발생하였습니다.';
        promise.reject(message);
    });
    return promise;
}

/**
 * 현재 노드를 먼저 통지한 뒤 현재 자식 배열을 재귀 순회합니다. 콜백의 배열 변경을 그대로 따르며 순환 관계는 검사하지 않습니다.
 *
 * @param {U3dBIMMetaNode} meta 추가하거나 순회할 메타데이터
 * @param {function} callback 각 메타데이터를 받는 순회 콜백
 */
function traverse(meta, callback) {
    if (!defined(meta)) {
        return;
    }
    if (callback) {
        callback(meta);
    }
    const childrenList = meta.getChildren();
    if (defined(childrenList) && childrenList.length > 0) {
        for (const child of childrenList) {
            traverse(child, callback);
        }
    }
}
export { U3dModelBIMObjLayer };
