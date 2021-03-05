
/**
 * 1 获取地形坐标 
 * 2 使用起泡label展示
 */
var positionLabel;
function addPositionLabel() {
    positionLabel = viewer.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: '14px sans-serif',
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            fillColor: Cesium.Color.SKYBLUE,
        }
    });
}
var pollutionSourceLocation;
function getlocation() {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    handler.setInputAction(function (event) {
        if (!Cesium.Entity.supportsPolylinesOnTerrain(viewer.scene)) {
            console.log('当前浏览器不支持地形图');
            return;
        }
        let earthPositionCartesian3 = MeasureObject.getPointCartesian3(event)
        // let earthPositionCartesian3 = new Cesium.Cartesian3();
        // scene.pickPosition(event.position, earthPositionCartesian3); //获取到地形图上面的坐标
        positionLabel.position = earthPositionCartesian3;
       
        positionLabel.label.show = true;
        var ellipsoid = globe.ellipsoid;
       
        var cartographic = ellipsoid.cartesianToCartographic(earthPositionCartesian3);
        var choiceLat = Cesium.Math.toDegrees(cartographic.latitude);
        var choiceLng = Cesium.Math.toDegrees(cartographic.longitude);
        var choiceAlt = cartographic.height;
        let labelText = `经度：` + choiceLng + `
纬度：`+ choiceLat + `
高度：`+ choiceAlt;
        positionLabel.label.text = labelText;

        pollutionSourceLocation = earthPositionCartesian3;//赋值给污染源
        // console.log(pollutionSourceLocation);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

}


/**创建对象*/
var MeasureObject = {
    pointLineEntity: null,//指示线段
    positionFloat: null,//鼠标移动位置的端点
    pointEntities: [],

    //添加点
    addPoint: function (position) {
        let pointEntitiy = viewer.entities.add({
            position: position,
            point: {
                pixelSize: 5,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
            }
        })
        this.pointEntities.push(pointEntitiy);
    },
    /**清除点实体 */
    removePoint: function() {
        this.pointEntities.forEach((element)=>{
            viewer.entities.remove(element)
        })
    },
    //更新两点之间的直线
    updatePointLine: function (point1, point2) {
        if (point1 == undefined || point2 == undefined) {
            return;
        }
        this.pointLineEntity = viewer.entities.add({
            name: '直线',
            polyline: {
                show: true,
                positions: [point1, point2],
                material: Cesium.Color.CHARTREUSE,
                width: 4,
                clampToGround: true
            }
        })
    },
    //计算最近两点的距离
    getSpaceDistance: function (point1, point2) {
        //return Cesium.Cartesian3.distance(point1, point2);
        const { Ellipsoid, EllipsoidGeodesic } = Cesium
        const pickedPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(
            point1
        )
        const lastPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(
            point2
        )
        const geodesic = new EllipsoidGeodesic(
            pickedPointCartographic,
            lastPointCartographic
        )

        return geodesic.surfaceDistance
    },
    //添加提示框
    addLabel: function (position, textDisance) {
        viewer.entities.add({
            position: position,
            label: {
                text: textDisance.toString(),
                font: '18px sans-serif',
                fillColor: Cesium.Color.GOLD,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -20),
            }
        })
    },
    //获取选择点的cartesian3坐标
    getPointCartesian3: function (event) {
        let ray = viewer.camera.getPickRay(event.position);
        let lineEndPosition = globe.pick(ray, scene);
        return lineEndPosition;
    },
    //笛卡尔坐标批量转经纬度和高度
    getPointForDegree: function (positionsCartesian3) {
        let positionCartesian3 = positionsCartesian3;
        if (!Array.isArray(positionsCartesian3)) {
            positionsCartesian3 = [positionsCartesian3]//不是数组变为数组
        }
        if (positionsCartesian3 == undefined || positionsCartesian3.length == 0) {
            throw new Error("请传入点坐标")
        }
        let positions = [];//存放转换后结果的数组
        positionCartesian3.forEach(element => {
            let cartographic = globe.ellipsoid.cartesianToCartographic(element);
            let pointLat = Cesium.Math.toDegrees(cartographic.latitude);
            let pointLng = Cesium.Math.toDegrees(cartographic.longitude);
            let pointHgt =cartographic.height;
            positions.push([pointLat, pointLng, pointHgt]);
        });
        return positions;
    },
    /**利用海伦公式计算三角形面积 */
    getTriangleArea: function (points) {

        let distances = [];//存放边长的数组

        if (!Array.isArray(points) || points.length != 3) {
            throw new TypeError("请传入一个长度等于3的数组！")
        }

        for (let index = 0; index < points.length - 1; index++) {
            const element1 = points[index];
            const element2 = points[index + 1];
            const distance = this.getSpaceDistance(element1, element2);
            distances.push(distance);

        }

        //计算首尾点的线段长
        const distance = this.getSpaceDistance(points[0], points[points.length - 1]);
        distances.push(distance);

        //海伦公式
        const d1 = distances[0];
        const d2 = distances[1];
        const d3 = distances[2];
        let p = d1 + d2 + d3;//周长
        let s = Math.sqrt(p * (p - d1) * (p - d2) * (p - d3));
        return s;
    }


};


/**
 * 测量距离
 */
function measureLineSpace() {
    let positions = [];
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //鼠标单击事件
    handler.setInputAction(function (event) {
        let earthPositionCartesian3 = MeasureObject.getPointCartesian3(event);

        if (positions.length == 0) {
            positions.push(earthPositionCartesian3);
            MeasureObject.addPoint(earthPositionCartesian3); // 存储第一个点，并在点击处绘制一个点entity 
        }
        if (positions.length == 2) {

            let point1 = positions[0];
            let point2 = positions[1];

            //添加点，更新线段
            MeasureObject.addPoint(point2);
            MeasureObject.updatePointLine(point1, point2);


            //计算距离
            let textDisance = MeasureObject.getSpaceDistance(point1, point2);

            //添加提示框
            MeasureObject.addLabel(point2, textDisance);

            //清空数组
            positions = [];

        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    //鼠标移动事件
    handler.setInputAction(function (event) {

        if (positions.length == 0) {
            return;
        }

        let ray = viewer.camera.getPickRay(event.endPosition);
        let lineEndPosition = globe.pick(ray, scene);
        // let lineEndPosition =  scene.pickPosition(event.position);//有时候无法获取坐标，不知道为啥？

        //只有一个点，则再添加一个点
        if (positions.length == 1) {
            positions.push(lineEndPosition);
        } else {//不断更新第二个点
            positions[1] = lineEndPosition;
        }

        MeasureObject.updatePointLine(positions[0], positions[1]);
        if (MeasureObject.pointLineEntity !== undefined) {
            MeasureObject.pointLineEntity.polyline.positions = positions;
        }


    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}



/**连续计算多点之间的距离 */
function measureMoreLineSpace() {
    let positions = [];
    // let positionFloat =  MeasureObject.positionFloat;//用于鼠标移动事件，暂时不写
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //鼠标单击事件
    handler.setInputAction(function (event) {

        let earthPositionCartesian3 = MeasureObject.getPointCartesian3(event);

        positions.push(earthPositionCartesian3);
        MeasureObject.addPoint(earthPositionCartesian3);

        if (positions.length >= 2) {
            let point1 = positions[positions.length - 2];
            let point2 = positions[positions.length - 1];
            //添加点，更新线段
            MeasureObject.addPoint(point2);
            MeasureObject.updatePointLine(point1, point2);
            //计算距离
            let textDisance = MeasureObject.getSpaceDistance(point1, point2);
            //添加提示框
            MeasureObject.addLabel(point2, textDisance);

        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}


/**计算三角形面积
 * 利用海伦公式
 */
function measureArea() {
    let positions = [];

    //清除单击事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

    //鼠标左击事件
    handler.setInputAction((event) => {
        let point = MeasureObject.getPointCartesian3(event);
        positions.push(point);

        MeasureObject.addPoint(point);

        //有两个以上的点就进行连线
        if (positions.length >= 2) {
            MeasureObject.updatePointLine(positions[positions.length - 1], positions[positions.length - 2]);
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    //鼠标右击事件
    handler.setInputAction(() => {

        //三个及三个以上的点就闭合曲线
        if (positions.length >= 3) {
            MeasureObject.updatePointLine(positions[positions.length - 1], positions[0]);

            //显示计算面积
            let area = 0;
            for (let i = 0; i < positions.length - 2; i++) {
                let pts = [positions[0], positions[i + 1], positions[i + 2]];
                area += MeasureObject.getTriangleArea(pts);
            }
            console.log(area);

            MeasureObject.addLabel(positions[positions.length - 1], area);

        }


    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

}

window.onload = function () {
    Sandcastle.addToolbarMenu([
        {
            text: "拾取坐标",
            onselect: function () {
                addPositionLabel();
                getlocation();
            }
        },
        {
            text: "测量直线距离",
            onselect: function () {
                measureLineSpace();
            }
        },
        {
            text: "测量多段直线距离",
            onselect: function () {
                measureMoreLineSpace();
            }
        },
        {
            text: "测量面积",
            onselect: function () {
                measureArea();
            }
        }
    ], "baseToolbar");
}



