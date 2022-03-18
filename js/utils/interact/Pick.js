

class Pick{
    constructor(){}

    static pickCarto(){
        let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas); //开启事件
        handler.setInputAction(function (e) {
            let ray = viewer.camera.getPickRay(e.position);
            let lineEndPosition = viewer.scene.globe.pick(ray, viewer.scene);
            let res = Cesium.Cartographic.fromCartesian(lineEndPosition)
            console.log(res);
            return res
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
}