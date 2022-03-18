//cesium加载地图
var cesiumToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhNTg4YmQ0ZC0xNzcyLTRlNDItYjZkMi0zNzc0ODI3N2E2ZjciLCJpZCI6MzI1MjYsImlhdCI6MTYyMjYyMjQxOX0.kUki8CUFlPiIiuwlqIb7TGWmhk6hnlY6gwYViX08tDc";
Cesium.Ion.defaultAccessToken = cesiumToken;

var tianditu = new Cesium.UrlTemplateImageryProvider({
    url: "https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=4d59f4ef142725ef8c409801fc86be8b",
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
});
var hhuImg = new Cesium.UrlTemplateImageryProvider({
    url: "http://127.0.0.1:5500/resource/hhu_img2/{z}/{x}/{y}.png"
});
// var worldImage = Cesium.createWorldImagery();

var worldTerrain = Cesium.createWorldTerrain({
    requestWaterMask: true,
    requestVertexNormals: true
});
var viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: hhuImg,
    terrainProvider: worldTerrain,
    baseLayerPicker: false,
    shouldAnimate: false,
    animation: false,
    timeline: false,
});
viewer._cesiumWidget._creditContainer.style.display = "none"; //版权控件的显示隐藏
//允许frame运行脚本
// viewer.infoBox.frame.sandbox = "allow-same-origin allow-top-navigation allow-pointer-lock allow-popups allow-forms allow-scripts"
viewer.camera.setView({
    destination : Cesium.Cartesian3.fromDegrees(118.781, 31.915, 5000.0)
});
viewer.scene.globe.baseColor = Cesium.Color.BLACK;



//openlayers加载服务
var imagery = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        ratio: 1,
        url: 'http://localhost:8089/geoserver/dem/wms',
        params: {
            'FORMAT': 'image/jpeg', //'image/jpeg',//
            'VERSION': '1.1.1',
            "STYLES": '',
            "LAYERS": 'dem:hhu_dem',
            "exceptions": 'application/vnd.ogc.se_inimage',
        },
        crossOrigin: ''
    })
});
var projection = new ol.proj.Projection({
    code: 'EPSG:3857',
    units: 'm',
});
var mousePositionControl = new ol.control.MousePosition({
    className: 'custom-mouse-position',
    target: document.getElementById('clickedPosition'),
    coordinateFormat: ol.coordinate.createStringXY(5),
    undefinedHTML: '&nbsp;',
    projection: new ol.proj.Projection({
        code: "EPSG:4326"
    })
});
var map = new ol.Map({
    controls: ol.control.defaults({
        attribution: false
    }).extend([mousePositionControl]),
    layers: [
        imagery
    ],
    view: new ol.View({
        projection: projection,
    }),
    target: 'map',
});

//视图定位
var bounds = [13221771.404656487, 3750917.8520101234,
    13224217.389561612, 3753363.836915249
];
map.getView().fit(bounds, map.getSize());

//添加点击事件
map.on('singleclick', function (evt) {
    document.getElementById('nodelist').innerHTML = "Loading... please wait...";
    var view = map.getView();
    var viewResolution = view.getResolution();
    var source = imagery.getSource();
    var url = source.getFeatureInfoUrl(
        evt.coordinate, viewResolution, view.getProjection(), {
            'INFO_FORMAT': 'text/html', //'application/json',//'text/html',
            'FEATURE_COUNT': 50
        });
    if (url) {
        document.getElementById('nodelist').innerHTML = '<iframe seamless src="' + url + '"></iframe>';
    }
})

//openlayers获取波段值
function getImageValue(clickPosition) {
    if (clickPosition) {
        let clickScreenPosition = map.getPixelFromCoordinate(clickPosition);
        clickScreenPosition =  ol.proj.fromLonLat(clickPosition)
        var view = map.getView();
        var viewResolution = view.getResolution();
        var source = imagery.getSource();
        var url = source.getFeatureInfoUrl(
            clickScreenPosition, viewResolution, view.getProjection(), {
                'INFO_FORMAT': 'text/html', //'application/json',//'text/html',
                'FEATURE_COUNT': 50
            });
        if (url) {
            document.getElementById('nodelist').innerHTML = '<iframe seamless src="' + url + '"></iframe>';
        }
    }
    // clickPosition = [13223328.549321013, 3752467.552713126];
    // let input = document.getElementById('heightValue');
    // input.innerText = clickScreenPosition;
}

//cesium左击获取经纬度
var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(function (event) {
    var earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
    var cartographic = Cesium.Cartographic.fromCartesian(earthPosition, viewer.scene.globe.ellipsoid, new Cesium.Cartographic());
    var lat = Cesium.Math.toDegrees(cartographic.latitude);
    var lng = Cesium.Math.toDegrees(cartographic.longitude);
    var height = cartographic.height;
    getImageValue([lng, lat])//([13223328.549321013, 3752467.552713126]);//([lng, lat]);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
