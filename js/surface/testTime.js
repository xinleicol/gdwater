import SurfaceCell from "../cells/SurfaceCell.js";
import PollutedCellDao from "../Dao/PollutedCellDao.js";
import RectangleCellDao from "../Dao/RectangleCellDao.js";
import WithTime from "../simulate/withTime.js";
import BoundingBox from "../utils/base/BoundingBox.js";
import BoundingRectangle from "../utils/base/BoundingRectangle.js";
import ComputerColor from "../utils/computer/ComputerColor.js";
import ComputerRectangle from "../utils/computer/ComputerRectangles.js";
import RectangleClip from "../utils/dispose/RectangleClip.js";
import AddRectangle from "../utils/entity/AddRectangle.js";
import BaiduImageryProvider from "../utils/imagery/provider/BaiduImageryProvider.js";
import TencentImageryProvider from "../utils/imagery/provider/TencentImageryProvider.js";
import HeightMatrix from "../utils/transform/HeightMatrix.js";

let addRectangle = new AddRectangle()
let pollutedCellDao = new PollutedCellDao([9, 9], 1000)
let surfaceCell = undefined
let rectangleDaos = undefined
let computerColor = new ComputerColor()
let computerRectangle = undefined;
let rec = Cesium.Rectangle.fromDegrees(
    117.2222214,
    36.0111102,
    117.2333464,
    36.0222647
);

function loadImagery() {
    viewer.imageryLayers.removeAll();
    let tencentImageryLayer = new TencentImageryProvider({
        style:"img"
    });
    let baiduImageryLayer = new BaiduImageryProvider({
        style:"img"
    });
    // let tdImageryLayer = new Cesium.ImageryLayer(tianditu)
    let tdImageryLayer = new Cesium.ImageryLayer(tencentImageryLayer)
    // let tdImageryLayer = new Cesium.ImageryLayer(baiduImageryLayer)
    // viewer.imageryProvider = tianditu;
    // tencentImageryLayer = viewer.imageryLayers.addImageryProvider(tencentImageryLayer);
    viewer.imageryLayers.add(tdImageryLayer)
}

//初始化飞行
function fly() {

    // let boundingPositions = [
    //     [118.7436, 32.24981],
    //     [118.74304, 32.25009],
    //     [118.74267, 32.25026],
    //     [118.74299, 32.25061],
    //     [118.74351, 32.25100],
    //     [118.74418, 32.25034],
    //     [118.74348, 32.24999]
    // ];
    let boundingPositions = [
        [118.74304049607636, 32.248946734660244],
        [118.74306031151373,32.24847724074635],
        [ 118.7435861153137, 32.24848736363488],
        [118.74383712601325,  32.2489590713677],
        [118.74349086211912, 32.24907215014732],
    ];
    let boundingRec = new BoundingRectangle(boundingPositions, 'degree', {
        show: false
    });
    rec = boundingRec.rectangle
    viewer.terrainProvider = Cesium.createWorldTerrain()
    viewer.camera.setView({
        destination: rec
    });
}

//初始化
async function init() {
    viewer.scene.globe.terrainExaggeration = 2
    let recClip = new RectangleClip(viewer, rec)
    recClip.clip()

    let rectangleCellDao = new RectangleCellDao(null, null, 1, 1);

    computerRectangle = new ComputerRectangle(rec, rectangleCellDao)
    computerRectangle.computer();

    //  rectangleDaos = computerRectangle.rectangles;
    //  addRectangle = new AddRectangle(rectangleDaos)

    let heightMatrix = new HeightMatrix(rectangleCellDao)
    heightMatrix.rectangleDaos = computerRectangle.rectangles

    let matrix = await heightMatrix.getHeightMatrix();
    surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);

    pollutedCellDao = new PollutedCellDao([Math.round(rectangleCellDao.xNumber / 2), Math.round(rectangleCellDao.yNumber / 2)], 1000);
    surfaceCell.setPollutedSourceCell(
        pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    )
}

let oldTime;
let runTime;
async function simulateWithTime2() {
    await init();
    let withTime = new WithTime(computerRectangle, addRectangle, computerColor, surfaceCell, 'simulateOneStep');
    withTime.simulateWithTime(true);

    oldTime = Date.now();
    showTime()
}

function showTime() {
    runTime = (Date.now() - oldTime) / 1000 / 60; //分钟
    runTime = runTime.toFixed(2);
    document.getElementById('time').innerText = runTime + "分钟"
    requestAnimationFrame(showTime);
}

//随时间动态仿真
async function simulateWithTime() {
    await init();
    let start = Date.now();
    let stack = [Array.from(surfaceCell.isPollutedArea)];
    let arrs;
    while (arrs = stack.shift()) {
        if (arrs.length == 0) {
            continue;
        }
        arrs = quickSort(arrs, "time");
        for (const element of arrs) {
            let t = Date.now() - start;
            if (t >= element.time * 1000) {
                generateRectangle(element);
            } else {
                let interval = element.time * 1000 - t;
                await sleep(element, interval);
            }
        }
        const nextPollutedArea = surfaceCell.simulateOneStep();
        stack.push(nextPollutedArea);

        // 更新颜色
        updateColor(surfaceCell.isPollutedArea);
    }
    alert("扩散结束！");
}

//更新所有污染元胞的颜色
function updateColor(spreadCells) {
    // computerColor.startColor = Cesium.Color.fromCssColorString("#0b486b", new Cesium.Color());
    // computerColor.endColor = Cesium.Color.fromCssColorString("#f56217", new Cesium.Color());
    computerColor.setColorToCell(spreadCells);
    for (let i = 0; i < spreadCells.length; i++) {
        const element = spreadCells[i];
        let idStr = addRectangle.type + element.position;
        addRectangle.changeColor(idStr, element.color);
    }
}

//更改颜色
function generateRectangle(item, color) {
    // let idStr = addRectangle.type + item.position
    //color ? true : color = computerColor.setAndGetColor(item.position, pollutedCellDao.position)
    // addRectangle.changeColor(idStr, color)
    let rectangleDaos = computerRectangle.computerRectangleDaos(item.position);
    addRectangle.add(rectangleDaos);
}

//睡眠等待
function sleep(element, ms) {
    return new Promise(resolve => setTimeout(() => {
        generateRectangle(element);
        resolve();
    }, ms));
}

// 快排
function quickSort(arr, attr) {
    if (arr.length <= 1) {
        return arr;
    }
    var pivotIndex = Math.floor(arr.length / 2);
    var pivot = arr.splice(pivotIndex, 1)[0];
    var left = [];
    var right = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][attr] < pivot[attr]) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    return quickSort(left, attr).concat([pivot], quickSort(right));
};

//有序插入，递减
function insert(arr, new_val) {
    let p = arr.length - 1;
    while (new_val > arr[p]) {
        arr[p + 1] = arr[p]
        p--;
    }
    arr[p + 1] = new_val;
    return arr;
}
//有序插入，递减
function orderInsert(arr, obj, key) {
    let p = arr.length - 1;
    while (obj[key] > arr[p][key]) {
        arr[p + 1] = arr[p]
        p--;
    }
    arr[p + 1] = obj;
    return arr;
}


function test() {
    // let arr = insert([3, 6, 4, 8,16,19].reverse(),15)
    // let arr = orderInsert([3, 6, 4, 8,16,19].reverse(),15)
    let arr = orderInsert([{
        time: 1.4
    }, {
        time: 0.9
    }, {
        time: 0.4
    }, {
        time: 0.3
    }], {
        time: 0.6
    }, 'time')
    console.log(arr);
}

document.getElementById('simulate').addEventListener('click', simulateWithTime2);
document.getElementById('init').addEventListener('click', fly);
document.getElementById('test').addEventListener('click', test);
document.getElementById('loadImagery').addEventListener('click', loadImagery);



//备份
async function simulateWithTime1() {
    await init();
    let start = Date.now();
    let stack = [Array.from(surfaceCell.isPollutedArea)];
    let arrs;
    while (arrs = stack.shift()) {
        if (arrs.length == 0) {
            continue;
        }
        let t = Date.now() - start;
        if (t >= arrs[0].time * 1000) {
            for (const element of arrs) {
                changeColor(element);
                // const nextPollutedArea = surfaceCell.simulateOneStep(element);
                // stack.push(nextPollutedArea);
            }
            const nextPollutedArea = surfaceCell.simulateOneStep();
            stack.push(nextPollutedArea);
        } else {
            let interval = arrs[0].time * 1000 - t;
            // for (const element of arrs) {
            //     const nextPollutedArea = await sleep(element, interval);
            //     stack.push(nextPollutedArea);
            // }   
            await sleep(arrs, interval);
            let nextPollutedArea = surfaceCell.simulateOneStep();
            stack.push(nextPollutedArea);
        }

    }
}

//备份
function sleep1(arrs, ms) {
    // return new Promise(resolve => setTimeout(() => {
    //     changeColor(element);
    //     let nextPollutedArea = surfaceCell.simulateOneStep(element);
    //     resolve(nextPollutedArea);
    // }, ms));
    return new Promise(resolve => setTimeout(() => {
        for (const element of arrs) {
            changeColor(element);
        }
        resolve();
    }, ms));
}