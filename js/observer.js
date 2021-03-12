// import {ParticalObject} from './partical.js'

var nearAlpha = 0.5;
//页面控件数据
var trBox = viewer.entities.add({
    name: "土壤模型",
    position: boxModel[0],
    box: {
        dimensions: new Cesium.Cartesian3(boxModel[1], boxModel[2], -100.0),
        material: Cesium.Color.BURLYWOOD.withAlpha(nearAlpha),
        outline: true,
        outlineColor: Cesium.Color.BURLYWOOD,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,//贴地
        show: false,
    }, 
});

var viewModel = {
    simulateEnable: false,//是否开启选污染点事件
    handleEnable: false,//是否开启基础事件
    enabled: true,
    nearAlpha: nearAlpha,
    getlocationEnable: false,
    gridNum:10
};

Cesium.knockout.track(viewModel);
var toolbar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(viewModel, toolbar);

for (var name in viewModel) {
    if (viewModel.hasOwnProperty(name)) {
        Cesium.knockout.getObservable(viewModel, name).subscribe(update);
    }
}

function update() {
    globe.translucency.enabled = viewModel.enabled ? true : false;
    globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
        0,
        0.0,
        200.0,
        1.0
    );
    var nearAlpha = Number(viewModel.nearAlpha);
    nearAlpha = nearAlpha >= 1.0 ? 1.0 : nearAlpha;
    viewModel.nearAlpha = nearAlpha;
    trBox.box.material = Cesium.Color.BURLYWOOD.withAlpha(nearAlpha);

    /**
     * 判断是否开启选择污染点
     */
    if (!viewModel.simulateEnable) {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    } else {
        ParticalObject.selectPollutionPoint(handler);
    }

    Number(viewModel.gridNum) >= 50 ? 50 : Number(viewModel.gridNum);//网格数不能大于50

}
update();