

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTExZjgxNC1iMTI2LTQ3OTEtYWE1NS05NmFmZTdlMWQ5MDciLCJpZCI6MzI1MjYsImlhdCI6MTYwMTYyNjkyMX0.WipE3GFstF4z482DCbLHEDF8c8RGfwKGCwrU4_9gFJk';


// 谷歌影像
var ggImagery = new Cesium.UrlTemplateImageryProvider({
    url: "http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali"
});

//bing地图
var bingMap = new Cesium.IonImageryProvider({ assetId: 2 });

var imageJN = new Cesium.UrlTemplateImageryProvider({
    url: "http://127.0.0.1:5500/resource/image2JN/{z}/{x}/{y}.png"
});

//河海影像
var hhuImg = new Cesium.UrlTemplateImageryProvider({
    url: "http://127.0.0.1:5500/resource/hhu_img2/{z}/{x}/{y}.png"
});

//河海地形
var hhuDem = new Cesium.CesiumTerrainProvider({
    url: "http://127.0.0.1:5500/resource/hhu_dem4"
});

//南京地形
var njDem = new Cesium.CesiumTerrainProvider({
    url: "http://127.0.0.1:5500/resource/dem"
});


var viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: false,
    shouldAnimate: true,
    baseLayerPicker: false,
    selectionIndicator: false,//删除选中提示框
    infoBox: false,
});
var imagerylayerCollections = viewer.scene.imageryLayers;
var hhuImgLayer = imagerylayerCollections.addImageryProvider(hhuImg);
imagerylayerCollections.raiseToTop(hhuImgLayer);
// Add Cesium OSM buildings to the scene as our example 3D Tileset.添加世界建筑物
// var osmBuildingsTileset = Cesium.createOsmBuildings();
// viewer.scene.primitives.add(osmBuildingsTileset);


var scene = viewer.scene;
var globe = scene.globe;
var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);//开启事件

viewer.terrainProvider = hhuDem; //加载地形


//影像矩形
var ModelObject = {
    lon1: 118.774051666259766,
    lat1: 31.909913158302139,
    lon2: 118.791561126708984,
    lat2: 31.921570015932399,
    left_buttom: { x: 13221866.950941843900, y: 3751491.129722262270 },
    left_top: { x: 13221866.950941843900, y: 3753019.870287965980 },
    right_buttom: { x: 13223816.095163114400, y: 3751491.129722262270 },

    //计算土壤模型位置
    computerBoxPosition: function () {

        let rectangle = Cesium.Rectangle.fromDegrees(this.lon1, this.lat1, this.lon2, this.lat2);

        //加载土壤模型
        let centerLon = (this.lon1 + this.lon2) * 0.5;
        let centerLat = (this.lat1 + this.lat2) * 0.5;
        let box_length = Math.abs(this.left_buttom.x - this.right_buttom.x);
        let box_width = Math.abs(this.left_buttom.y - this.left_top.y);
        let trBoxPosition = Cesium.Cartesian3.fromDegrees(centerLon, centerLat);

        let boxModel = [trBoxPosition, box_length, box_width, rectangle];
        return boxModel;
    },

    /**获取地形影像的cartesian3坐标promise */
    getTerrainCartesian3: function (positionsForDegrees, terrain) {//positionsForDegrees表示经纬度数组
        if (!Array.isArray(positionsForDegrees)) {
            return;
        }
        let positions = [];//Cartographic的弧度坐标
        positionsForDegrees.forEach(element => {
            let position =  Cesium.Cartographic.fromDegrees(element[0], element[1]);//将经纬度转换为弧度
            positions.push(position)

        });  
        let promise = Cesium.sampleTerrainMostDetailed(terrain, positions);
        return promise;

    }

}

var boxModel = ModelObject.computerBoxPosition();

// var nearAlpha = 0.5;
// var trBox = viewer.entities.add({
//     name: "土壤模型",
//     position: boxModel[0],
//     box: {
//         dimensions: new Cesium.Cartesian3(boxModel[1], boxModel[2], -100.0),
//         material: Cesium.Color.BURLYWOOD.withAlpha(nearAlpha),
//         outline: true,
//         outlineColor: Cesium.Color.BURLYWOOD,
//         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,//贴地
//          show: false,
//     },
    

// });


function load() {
    viewer.camera.setView({
        destination: boxModel[3]
    });
};

// var globalFlag = true; //地球透明指示
// function closeGlobal() {
//     if (globalFlag) {
//         // globe.translucency.backFaceAlpha = 0.5; //backFaceAlpha 地球后景色
//         globe.translucency.enabled = true;// 开启地球透明
//         //globe.undergroundColor = Cesium.Color.WHITE;
//         globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
//             0,
//             0.0,
//             200.0,
//             1.0
//         );//由远及近更改地下透明度，frontFaceAlpha 地球前景色
//         globalFlag = false;
//     } else {
//         globe.translucency.enabled = false;
//         globalFlag = true;
//     }

// }

globe.baseColor = Cesium.Color.BLACK; //变黑
scene.screenSpaceCameraController.enableCollisionDetection = false; //相机对地形的碰撞检测

//监听数据
// function subscribeParameter(name) {
//     Cesium.knockout
//         .getObservable(viewModel, name)
//         .subscribe(update);
//             function (newValue) {
//             if(newValue >= 1.0){
//                 newValue = 1.0;
//             }//解决输入为1.0时，变成全透明的问题，
//             //当输入大于1，将其变为1
//             trBox.box.material = Cesium.Color.BURLYWOOD.withAlpha(newValue);
//         });
// }

// subscribeParameter("pixelRange");

