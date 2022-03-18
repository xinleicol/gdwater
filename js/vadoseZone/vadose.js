import VadoseZoneCell from "../cells/VadoseZoneCell.js";
import RectangleCellDao from "../Dao/RectangleCellDao.js";
import BoundingRectangle from "../utils/base/BoundingRectangle.js";
import ComputerColor from "../utils/computer/ComputerColor.js";
import ComputerRectangle from "../utils/computer/ComputerRectangles.js";
import ComputerVadoseDao from "../utils/computer/ComputerVadoseDao.js";
import RectangleClip from "../utils/dispose/RectangleClip.js";
import GoeRequest from "../utils/dispose/Request.js";
import Request from "../utils/dispose/Request.js";
import Splite from "../utils/dispose/Splite.js";
import Plot from "../utils/interact/Plot.js";
import GdwaterLevelMatrix from "../utils/transform/GdwaterLevelMatrix.js";
import HeightMatrix from "../utils/transform/HeightMatrix.js";
import XLBox from "../utils/XLBox.js";
import XLBoxGeometry from "../utils/XLBoxGeometry.js";

function loadImagery() {
    let hhuImg = new Cesium.UrlTemplateImageryProvider({
        url: "http://127.0.0.1:5500/resource/hhu_img/{z}/{x}/{y}.png"
    });
    let hhuImgLayer = new Cesium.ImageryLayer(hhuImg)
    viewer.imageryLayers.add(hhuImgLayer)
    viewer.camera.flyTo({
        destination: hhuImg.rectangle
    })
    let res = tianditu.pickFeatures(2, 2, 1, 118, 36)
    console.log(res);
}

function fly(position) {
    viewer.camera.flyTo({
        destination: position
    })
}

function loadPolygon(positions = [
    -108.0,
    25.0,
    100000,
    -100.0,
    25.0,
    100000,
    -100.0,
    30.0,
    100000,
    -108.0,
    30.0,
    300000,
]) {

    let orangePolygon = viewer.entities.add({
        name: "Orange polygon with per-position heights and outline",
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
            perPositionHeight: true,
            material: Cesium.Color.ORANGE.withAlpha(0.5),
            outline: true,
            outlineColor: Cesium.Color.BLACK,
        },
    });
    return orangePolygon;
}

function requests() {
    const request = new XMLHttpRequest()
    // request.open('get','http://localhost:6600/api/gdwater/%E5%8D%97%E4%BA%AC')
    request.open('get', 'http://localhost:6600/api/gdwater/shangxiang')
    request.onload = function () {
        let res = request.response;
        res = JSON.parse(res)
        res = orderSort(res) //按指定格式排序
        let positions = []
        res.forEach((element, index) => {
            positions.push(element.longitude, element.latitude, element.level)
            if (index === res.length - 1) {
                loadPolygon(positions)
            }
        })
        fly(Cesium.Cartesian3.fromDegrees(res[0].longitude, res[1].latitude, res[2].level))
    }
    request.send()
}

function orderSort(arrs) {
    let order = ['gw1', 'gw4', 'gw8', 'gw9', 'gw10', 'gw7', 'gw5', 'gw3']
    let res = Array.prototype.sort.call(arrs, function (a, b) {
        return order.indexOf(a.pointName) - order.indexOf(b.pointName)
    })
    return res
}

function getHeight() {
    let [lat, lon] = [32.2484772, 118.7430404]
    fly(Cesium.Cartesian3.fromDegrees(lon, lat, 100))
    let xlbox = new XLBox()
    viewer.terrainProvider = Cesium.createWorldTerrain()
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas); //开启事件
    handler.setInputAction(function (e) {
        let ray = viewer.camera.getPickRay(e.position);
        let lineEndPosition = viewer.scene.globe.pick(ray, viewer.scene);
        let res = xlbox.cartesian3ToDegrees(lineEndPosition)
        // let res = Cesium.Cartographic.fromCartesian(lineEndPosition)
        console.log(res);
        // 发送请求
        // let geoRequest = new GoeRequest()
        // geoRequest.requestWater(res.x, res.y).then(res => {
        //     console.log(res);
        // })
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}


let boundingPositions = [
    [118.7426057038760, 32.2504552130810],
    [118.7429255928240, 32.2497469657935],
    [118.7433262661830, 32.2499205123251],
    [118.7440610544440, 32.2503070328395],
    [118.7434864037540, 32.2510766586447],
    [118.7432226284700, 32.2509838788282],
];
/**
 * 获取最小包围盒
 * 返回矩形
 */
function getBoundingRec() {

    let boundingPositions = [
        [118.7426057038760, 32.2504552130810],
        [118.7429255928240, 32.2497469657935],
        [118.7433262661830, 32.2499205123251],
        [118.7440610544440, 32.2503070328395],
        [118.7434864037540, 32.2510766586447],
        [118.7432226284700, 32.2509838788282],
    ];

    let boundingRec = new BoundingRectangle(boundingPositions, 'degree', {
        show: false
    });
    let rec = boundingRec.rectangle
    viewer.camera.setView({
        destination: rec
    });
    return rec;
}

/**
 * 开挖
 * @param {矩形} rec 
 */
function clip(rec) {
    let recClip = new RectangleClip(viewer, rec)
    recClip.clip()
}

/**
 * 按长度切分网格
 * @returns 返回小矩形
 */
function spliteRec(rec) {
    let rectangleCellDao = new RectangleCellDao(null, null, 1, 1);
    let computerRectangle = new ComputerRectangle(rec, rectangleCellDao)
    let recdaos = computerRectangle.computer();
    return {
        rectangleCellDao,
        recdaos
    };
}

/**
 * 获取高度、地下水位矩阵
 * @param {边界矩形} rectangleCellDao 
 * @param {划分的小矩形} recdaos 
 * @returns 高度、地下水位矩阵
 */
async function getHeightsAndLevel(rectangleCellDao, recdaos) {
    let heightMatrixObj = new HeightMatrix(rectangleCellDao, recdaos)
    let heightMatrix = await heightMatrixObj.getHeightMatrix();
    let waterMatrixObj = new GdwaterLevelMatrix(rectangleCellDao, recdaos)
    let waterMatrix = await waterMatrixObj.getMatrix()
    return {
        heightMatrix,
        waterMatrix
    }
}

/**
 * 求二维数组的最大值最小值
 * @param 二维数组{} matrix
 * ，fun max || min 
 * @returns 最大小值
 */
function maxmin(matrix, fun = 'max') {
    let arr = matrix.map(element => {
        return Math[fun].apply(null, element)
    })
    let res = Math[fun].apply(null, arr)
    return res;
}

/**
 * 
 * @param {包围矩形} rec 
 * @param {最大高度} maxheight 
 * @param {最小高度} minWater 
 * @returns 包围盒最大高度上的两个角点
 */
function getPosition(rec) {
    let southwest1 = Cesium.Rectangle.southwest(rec, new Cesium.Cartographic())
    let northeast1 = Cesium.Rectangle.northeast(rec, new Cesium.Cartographic())
    let southwest = Cesium.Cartographic.toCartesian(southwest1)
    let northeast = Cesium.Cartographic.toCartesian(northeast1)
    return {
        southwest,
        northeast
    }
}

/**
 * 
 * @param {角点|模型坐标原点} southwest 
 * @param {角点} northeast 
 * @param {最大高度} maxheight 
 * @param {最小高度} minWater 
 * @returns box的世界坐标和长宽高
 */
function buildModelCoor(southwest, northeast, maxheight, minWater) {
    let xlbox = new XLBox()
    let northeastModel = xlbox.computerModelPositionFromCenter(northeast, southwest)
    let boxCenterModel = Cesium.Cartesian3.divideByScalar(northeastModel, 2, new Cesium.Cartesian3())
    boxCenterModel.z = (maxheight + minWater) / 2
    let dimensions = new Cesium.Cartesian3(northeastModel.x, northeastModel.y, (maxheight - minWater))
    let boxCenterWorld = xlbox.computerWorldPositionFromCenter(boxCenterModel, southwest)
    return {
        boxCenterWorld,
        dimensions
    }
}

/**
 * 生成包围盒
 * @param {世界坐标} worldPosition 
 * @param {长宽高} dimensions 
 */
function generateBoundingBox(worldPosition, dimensions) {
    let box = viewer.entities.add({
        position: worldPosition,
        name: "bounding box all area.",
        box: {
            dimensions: dimensions,
            material: Cesium.Color.ORANGE.withAlpha(0.5),
            outline: true,
            outlineColor: Cesium.Color.BLACK,
        },
    });
}


/**
 * 
 * @param {最大高度} max 
 * @param {小} min 
 * @param {一个网格高度} zlength 
 * @returns 网格数量
 */
function getHNumber(max, min, zlength) {
    return Math.floor((max - min) / zlength) + 1
}

// 测试
function test(cell) {
    let flag = cell.locationH < cell.height ? cell.locationH > cell.gdwaterLevel ? true : false : false
    console.log(flag);
}

/**
 * 存到localstorage 
 * @param {大矩形} rectangleCellDao 
 * @returns 高程水位数组
 */
async function getMatrix(rectangleCellDao,recdaos) {
    let mark = localStorage.getItem('mark')
    let heightMatrix;
    let waterMatrix;
    if (mark === rectangleCellDao.toString()) {
        heightMatrix = JSON.parse(localStorage.getItem('heightMatrix'))
        waterMatrix = JSON.parse(localStorage.getItem('waterMatrix'))

    } else {
        ({
            heightMatrix,
            waterMatrix
        } = await getHeightsAndLevel(rectangleCellDao, recdaos))
        localStorage.setItem('mark', rectangleCellDao.toString())
        localStorage.setItem('heightMatrix', JSON.stringify(heightMatrix))
        localStorage.setItem('waterMatrix', JSON.stringify(waterMatrix))
    }
    return {
        heightMatrix,
        waterMatrix
    }
}



let computerVadoseDao, computerVadoseDao2, vadoseZoneCell, splite;
async function main() {
    // 地形
    viewer.terrainProvider = Cesium.createWorldTerrain();
    
    // 深度检测
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // 计算开挖
    splite = new Splite(0,0,boundingPositions)
    splite.setCellSize(5,5)
    splite.dispose()
    const [rec, rectangleCellDao, recdaos] = [splite._rectangle, splite._rectangleCellDao, splite._recdaos]

    // 高度水位矩阵
    const {
        heightMatrix,
        waterMatrix
    } = await getMatrix(rectangleCellDao, recdaos)
    let maxHeight = maxmin(heightMatrix)
    let minWater = maxmin(waterMatrix, 'min')//便于观察，水位下降10

    // 生成元胞网格
    // computerVadoseDao = new ComputerVadoseDao(rec,1,1,1,maxHeight-minWater);
    // computerVadoseDao.computer()
    // computerVadoseDao.generate(true)

    // 生成包围盒
    // const {southwest, northeast} = getPosition(rec, maxHeight, minWater)
    // const {boxCenterWorld,dimensions} = buildModelCoor(southwest, northeast,maxHeight, minWater)
    // generateBoundingBox(boxCenterWorld,dimensions)
    splite.generateBoundingBox(maxHeight,minWater,false);
    
    let hNumber = getHNumber(maxHeight, minWater, 1)
    computerVadoseDao2 = new ComputerVadoseDao(rec, rectangleCellDao.xNumber, rectangleCellDao.yNumber, hNumber, maxHeight - minWater)
    computerVadoseDao2.computer()
    computerVadoseDao2.generate(true)

    // 元胞类
    vadoseZoneCell = new VadoseZoneCell(waterMatrix, rectangleCellDao.yNumber,
        rectangleCellDao.xNumber, hNumber, computerVadoseDao2.dimensions, heightMatrix)
    vadoseZoneCell.setPollutantMass(parseInt(rectangleCellDao.yNumber/2),
        parseInt(rectangleCellDao.xNumber/2), 1, 100)
    
    // vadoseZoneCell.mechanicalDispersion()
    // console.log(vadoseZoneCell.nextPollutedArea);
    // vadoseZoneCell.mechanicalDispersion
    // 扩散函数
    let func = computer(vadoseZoneCell, computerVadoseDao2, vadoseZoneCell.simulate);
    func();

    // 生成水流线
    // generateWaterFlow(vadoseZoneCell.spreadArea, vadoseZoneCell.pollutionSourceCell, computerVadoseDao2)

}

/**
 * 指定时间计算一次
 * @param {cell} vadoseZoneCell 
 * @param {计算} computerVadoseDao2 
 * @returns 
 */
function computer(vadoseZoneCell, computerVadoseDao2, func){
    let timer;
    let nextPollutedArea;
    return function(){
        if(!timer){
            timer = setInterval(() => {
                func.call(vadoseZoneCell)
                nextPollutedArea = vadoseZoneCell.nextPollutedArea
                console.log(nextPollutedArea.length);
                computerVadoseDao2.updateColor(vadoseZoneCell.isPollutedArea)
                if(nextPollutedArea.length === 0) clearInterval(timer) 
            }, 2000);
        }
    }
}

//生成水流轨迹
function generateWaterFlow(cells,cell,computerVadoseDao){
    computerVadoseDao.giveCellWorldPosition(cells)
    cells.forEach(element1 => {
        element1.forEach(element2 => {
            element2.forEach(element3 =>{
                if(!element3.waterFlow) return
                let [i,j,k] = element3.waterFlow
                if(k > 2) return
                let results = []
                let waterFlowCell = cells[i][j][k]
                if(element3.worldPosition &&  waterFlowCell.worldPosition) {
                    results.push(element3.worldPosition, waterFlowCell.worldPosition)
                    computerVadoseDao.generatePloyline(results)
                }
            })

        })
      
    })
}

/**
 * 随机调色
 */
function randomColor(){
    computerVadoseDao2.randomColor(vadoseZoneCell.isPollutedArea)
}


$('#test').click(function (e) {
    e.preventDefault();
    main();
});

$('#big-show').click(function (e) {
    let f = $(this).children("input").prop('checked')
    if(splite){
        splite.showBoundingBox(f)
    }
});
$('#small-show').click(function (e) {
    e.preventDefault();
    computerVadoseDao2.showOrHidden()
});
$('#change-color').click(function (e) {
    e.preventDefault();
    randomColor();
});
$('#depthTestAgainstTerrain').click(function (e) {
    let f= $(this).children("input").prop('checked')
    viewer.scene.globe.depthTestAgainstTerrain = f
});
$('#show-water-line').click(function (e) {
    let f = $(this).children("input").prop('checked')
    if(computerVadoseDao2){
        let flag = computerVadoseDao2.isGenerate();
        if(flag){
            computerVadoseDao2.isShowTrail(f);
        }else if(f){
            generateWaterFlow(vadoseZoneCell.spreadArea, vadoseZoneCell.pollutionSourceCell, computerVadoseDao2)
        }
    }
});
