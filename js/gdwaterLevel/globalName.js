// 谷歌影像
var ggImagery = new Cesium.UrlTemplateImageryProvider({
    url: "http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali"
});
var viewer = new Cesium.Viewer('cesiumContainer',{
    imageryProvider: ggImagery,
});
var scene = viewer.scene;
