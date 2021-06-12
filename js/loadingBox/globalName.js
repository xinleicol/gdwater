

//获取影像URL
// var urls = undefined;
// (function (){
//     var siteProp = localStorage.getItem("fileProp");
//     urls = JSON.parse(siteProp);
//     if (urls == undefined ) {
//         throw new Error("无法获取到正确的影像地形路径地址...");
//     }else{
//         if (urls.imgUrl == null || urls.demUrl == null) {
//             throw new Error("无法获取到正确的影像地形路径地址...");
//         }
//     }
//     var imgUrl = urls.imgUrl;
//     var demUrl = urls.demUrl;
// })();


var cesiumToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhNTg4YmQ0ZC0xNzcyLTRlNDItYjZkMi0zNzc0ODI3N2E2ZjciLCJpZCI6MzI1MjYsImlhdCI6MTYyMjYyMjQxOX0.kUki8CUFlPiIiuwlqIb7TGWmhk6hnlY6gwYViX08tDc";
Cesium.Ion.defaultAccessToken = cesiumToken;
// 谷歌影像
var ggImagery = new Cesium.UrlTemplateImageryProvider({
    url: "http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali"
});
var tianditu =  new Cesium.UrlTemplateImageryProvider({
    url: "https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=4d59f4ef142725ef8c409801fc86be8b",
    subdomains: ['0','1','2','3','4','5','6','7'],
    tilingScheme : new Cesium.WebMercatorTilingScheme(),
    maximumLevel : 18,
});

var worldImage = Cesium.createWorldImagery();

var worldTerrain = Cesium.createWorldTerrain({
    requestWaterMask : true,
    requestVertexNormals : true
});

var hhuImg = new Cesium.UrlTemplateImageryProvider({
    url: "http://127.0.0.1:5500/resource/hhu_img2/{z}/{x}/{y}.png"
});
var hhuDem = new Cesium.CesiumTerrainProvider({
    url: "http://127.0.0.1:5500/resource/hhu_dem4",
    requestVertexNormals : true
});
var viewer = new Cesium.Viewer('cesiumContainer',{
    imageryProvider: hhuImg,
    terrainProvider: hhuDem,
    baseLayerPicker: false,   
    shouldAnimate: false,
    animation:false,
    timeline:false,
});

viewer._cesiumWidget._creditContainer.style.display="none";   //版权控件的显示隐藏
var scene = viewer.scene;
var camera = scene.camera;
var globe = scene.globe;
scene.globe.baseColor = Cesium.Color.BLACK;

// globe.depthTestAgainstTerrain = false; //关闭深度检测，实体不会被遮挡
scene.screenSpaceCameraController.enableCollisionDetection = false;
//Add Cesium Inspector
viewer.extend(Cesium.viewerCesiumInspectorMixin);