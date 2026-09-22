window.innerNet = false;

// //+ 개발서버
window.trdDimResUrl = 'https://3d.geon.kr/';
window.trdDimAPIKey = 'liSYJPYJhPitIeP6UQznNyhy54iVE2eigdHZGQBgCxcBZng6MxvqMBe2cPbxu2ti';

var dataServerUrl = 'https://dt-data.mappick.co.kr/ServiceData/';
var geoServerUrl = 'https://3d.geon.kr/geoserver/'
var trdapiContextURL = trdDimResUrl;

var modelU3fURL   = trdapiContextURL + "v1/layers?type=u3f&category=korea";
var modelU3f2_2URL   = trdapiContextURL + "v1/layers?type=u3f&category=korea";
var tmsImageURL   = trdapiContextURL + "v1/layers?type=tms";

var sampleHeight = 200;
var layerInfo = {
    shp: {
        buildings: dataServerUrl+'shp/buildings/buildings.json',
        buildings2: dataServerUrl+'shp/buildings2/build.json',
        buildings3: dataServerUrl+'shp/buildings3/build.json',
        buildings4: dataServerUrl+'shp/buildings4/build.json',
        buildings5: dataServerUrl+'shp/buildings5/build.json',
        buildings6: dataServerUrl+'shp/buildings6/build.json',
        jijuk: dataServerUrl+'shp/jijuk/jijuk.json',
        retreatlines: dataServerUrl+'shp/retreatlines/retreatlines.json',
        complexBuilding1: dataServerUrl+'shp/complexBuilding/TL_SPBD_STRCTU.json',
        complexBuilding2: dataServerUrl+'shp/complexBuilding/TL_SPBD_HO.json',
        complexBuilding3: dataServerUrl+'shp/complexBuilding/TL_INDRRD_RW.json'
    },
    image: {
        emapsaturl: 'http://210.117.198.120:8081/o2map/services',
        emapbaseurl: 'http://mapapi.ngii.go.kr:8013/openapi/Gettile.do',
        vworldsaturl: 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg',
        vworldbaseurl: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{-y}.png',
        vworldhybirdurl: 'https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{-y}.png',
        osmurl: 'https://tile.openstreetmap.org/{z}/{x}/{-y}.png',
        googleurl:  'http://mt{0-1}.google.com/vt/lyrs=m&hl=en&x={x}&y={-y}&z={z}'
    },
    height: {
        url: dataServerUrl + 'dem/DEM_4/Korean_peninsula/'
    },
    model: {
        vworldurl: 'https://xdworld.vworld.kr/2d/Satellite/service/',
        vworldbasemodelurl: 'https://xdworld.vworld.kr/XDServer/requestLayerObject?Layer=facility_build',
        vworldtilesurl: 'https://cdn.vworld.kr/TDServer/services/map4/TG9ENA.json',

        //+ 헬리콥터
        helicopterurl: dataServerUrl + 'component/helicopter/ka27/',
        helicoptername: 'ka27.fbx',
        helicopterext: 'fbx',

        //+ 비행기
        airplaneurl: dataServerUrl + 'component/airplane/uam/',
        airplanename: 'v22_osprey.obj',
        airplaneext: 'obj',

        //+ 소방차
        firtruckurl: dataServerUrl + 'component/firetruck/',
        firtruckname: 'firetruck',
        firtruckext: '.glb',

        //+ uam
        uamurl: dataServerUrl + 'component/drone/uam/',
        uamname: 'uam_hover.fbx',
        uamext: 'fbx',

        //+ drone1
        drone1url: dataServerUrl + 'component/drone/Drone_01/',
        drone1name: 'Drone_01.3ds',
        drone1ext: '3ds',

        //+ drone2
        drone2url: dataServerUrl + 'component/drone/Drone_02/',
        drone2name: 'Drone_02.3ds',
        drone2ext: '3ds',

        //+ drone3
        drone3url: dataServerUrl + 'component/drone/UAM_01/',
        drone3name: 'UAM_01.3ds',
        drone3ext: '3ds',

        //+ car
        carurl: dataServerUrl + 'component/car/glb/',
        carname: 'samplecar',
        carext: 'glb',

        //+ walk Model
        walkmodelurl: dataServerUrl + 'component/walkmodel/',
        walkmodelname: 'casual_man',
        walkmodelext: 'glb',

        walkXmodelurl: dataServerUrl + 'component/walkmodel/',
        walkXmodelname: 'Xbot',
        walkXmodelext: 'glb',

        //+ walk Model fbx
        walkFbxurl: dataServerUrl + 'component/walkmodel/fbx/',
        walkFbxext: 'fbx',

        walkingManname: 'WalkingMan.fbx',
        walkingMan2name: 'WalkingMan_2.fbx',
        walkingGirlname: 'WalkingGirl.fbx',
        walkingGirl2name: 'WalkingGirl_2.fbx',

        //+ car shadow
        shadowurl: dataServerUrl + 'component/car/glb/',
        shadowname: 'samplecarShadow',
        shadowext: 'png',

        //+ sewoon drone layer
        sewoonurl:  dataServerUrl + 'component/droneTile/sewoon',
        sewoonmetaurl: dataServerUrl + 'component/droneTile/sewoon/sample.json',

        //+ suhyangru drone layer
        suhyangruurl: dataServerUrl + 'component/droneTile/suhyangru2',
        suhyangrumetaurl: dataServerUrl + 'component/droneTile/suhyangru2/sample.json',

        //+ fish drone layer
        fishurl:  dataServerUrl + 'component/droneTile/fish',
        fishmetaurl:  dataServerUrl + 'component/droneTile/fish/sample.json',

        //+ 서울시립미술관 sema
        semaurl: dataServerUrl + 'space/SEMA/',
        semaname: 'SEMA',
        semametapath:'space/SEMA/',

        //+ busan u3f url
        busanu3furl: dataServerUrl + 'model-2.2/busan/',
        busanu3fname: 'busan',

        yeouidou3furl: dataServerUrl + 'model-2.2-webp/seoul/yeouido/',
        yeouidou3fname: 'yeouido',

        //+ ucity-obj file
        objurl: dataServerUrl + 'space/ucity_obj/',
        objname: 'red_SO2_00',

        //+ cloud png file
        cloudurl:   dataServerUrl + 'poi_image/cloud1.png'

    },
    wfs_busan:{
        layername: 'TN_BULD_BUSAN',
        baseurl: geoServerUrl + 'digitaltwin/ows',
        fieldheight: 'BLDH_BV',
        fieldfloor: "BFLR_CO",
        fieldheightfloor:"",
        floorheight:3,
        fieldKind: 'REFNF_ID'
    },
    wfs_korea:{
        layername: 'z_kais_tl_spbd_buld_202007',
        baseurl: geoServerUrl + 'digitaltwin/ows',
        fieldfloor: 'gro_flo_co',
        fieldheightfloor:"",
        floorheight:3,
        fieldKind: 'REFNF_ID',
        fieldlabel: 'buld_nm'
    },

    position:{
        '세운상가': {x: 126.995168, y: 37.569604, z: sampleHeight, rotateX: 2, rotateY: 60},
        '국회의사당': {x: 126.91415231094318, y: 37.53189615862187, z: sampleHeight, rotateX: 2, rotateY: 60},
        '63빌딩': {x: 126.9395, y: 37.52, z: sampleHeight, rotateX: 2, rotateY: 60},
        '대전': {x: 127.3846, y: 36.3506, z: sampleHeight, rotateX: 2, rotateY: 60},
        '광명역': {x: 126.8853, y: 37.4163, z: sampleHeight, rotateX: 2, rotateY: 60},
        '아시아문화전당': {x: 126.9206, y: 35.1471, z: sampleHeight, rotateX: 2, rotateY: 60},
        '강남사거리': {x: 127.0278, y: 37.498, z: sampleHeight, rotateX: 2, rotateY: 60},
        '목포': {x: 126.381862, y: 34.802357, z: sampleHeight, rotateX: 2, rotateY: 60},
        '송도': {x: 126.66, y: 37.38, z: 250, rotateX: 2, rotateY: 60},
        '덕촌': {x: 127.359, y: 36.661, z: 1132.9, rotateX: 2, rotateY: 0},
        '한반도': {x: 127.77, y: 36.73, z: 561000, rotateX: 0, rotateY: 0},
        '아시아': {x: 126.66, y: 37.38, z: 4007500, rotateX: 0, rotateY: 0},
        '시청': {x: 126.9760, y: 37.5575, z: 185, rotateX: 2, rotateY: 30},
        '부산'    : {x: 129.155, y: 35.1596, z: 435, rotateX: 0, rotateY: 40}
    }
}

//레이어 생성자 옵션
var LAYER_OPTION = {
    //+ IMAGE /////////////////////////////////////////////
    satellite: {
        name: 'satellite',
        baseurl: layerInfo.image.vworldsaturl,
        reverseY: true
    },
    base: {
        name: 'base',
        baseurl: layerInfo.image.vworldbaseurl,
        reverseY: true,
        transparent: true,
        animation: true
    },
    hybrid: {
        name: 'hybrid',
        baseurl: layerInfo.image.vworldhybirdurl,
        reverseY: true,
        transparent: true,
        animation: true
    },
    osm: {
        name: 'osm',
        baseurl: layerInfo.image.osmurl,
        reverseY: true,
        transparent: true,
        animation: true
    },
    google: {
        name: 'google',
        baseurl: layerInfo.image.googleurl,
        reverseY: true,
        transparent: true,
        animation: true
    },
    emapsat: {
        name: 'emapsat',
        url: layerInfo.image.emapsaturl,
        reverseY: true,
        useProxy: true,
        xyorder: "xy"
    },
    emapbase: {
        name: 'emapbase',
        url: layerInfo.image.emapbaseurl,
        reverseY: true,
        useProxy: true,
        xyorder: "xy"
    },
};


var layerUtil = {
    createImageLayer : function (type, name) {


    },

    createHeightLayer: function (type, name){

    },

    createModelLayer: function (type, name){

    }

}
window.layerInfo = layerInfo;
window.layerUtil = layerUtil;

(function () {
    const toastDiv = document.createElement('div');
    toastDiv.id = 'toast';
    document.body.appendChild(toastDiv);
}());
window.removeToast;
function toast(string,time = 2000) {
    let toast = document.getElementById("toast");
    if(!toast || toast.length ===0){

        toast = document.getElementById("toast");
    }
    toast.classList.contains("reveal") ?
        (clearTimeout(window.removeToast), window.removeToast = setTimeout(function () {
            document.getElementById("toast").classList.remove("reveal")
        }, time)) :
        window.removeToast = setTimeout(function () {
            document.getElementById("toast").classList.remove("reveal")
        }, time)
    toast.classList.add("reveal"),
        toast.innerText = string
}