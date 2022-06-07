/**
 *污染物地表-包气带-潜水面耦合扩散模拟
 */
import SurfaceCell from '../cells/SurfaceCell.js'
import VadoseZoneCell from '../cells/VadoseZoneCell.js'
import GdwaterLevelCell from '../cells/GdwaterLevelCell.js'
import XLBoxGeometry from '../utils/XLBoxGeometry.js'
import XLPosition from '../utils/XLPosition.js'
import XLBoxParticle from '../utils/XLBoxParticle.js'
import xlType from '../utils/XLType.js'
import XLEchart from '../utils/XLEchart.js'
import ParticleMounted from './ParticleMounted.js'

import PollutedCellDao from '../Dao/PollutedCellDao.js'
import Middleware from './middleware.js'
import Splite from '../utils/dispose/Splite.js'
import ComputerVadoseDao from '../utils/computer/ComputerVadoseDao.js'
import Color100 from '../source/100.json' assert { type: 'json' };


var rows = 9 //元胞行数
var cloumns = 9 //元胞列数
var heights = 9 //元胞纵数
var gdwaterRows = 17; //潜水层元胞行数
var gdwaterCols = 17; //潜水层元胞列数
var centerCellOffset = (gdwaterRows - rows) / 2 //元胞行列号中心偏移量，潜水层相对于包气带
var waterVeloty = 0.1 //潜水层水流速
var dimensions = new Cesium.Cartesian3(5.0, 5.0, 5.0)
var centerOffset1 = new Cesium.Cartesian3(0.0, 0.0, 11.0) //改进 2021年5月15日15:50:35
var centerOffset2 = new Cesium.Cartesian3(0.0, 0.0, 6.0)
var centerOffset3 = new Cesium.Cartesian3(0.0, 0.0, 1.0)
var pollutionSourcePos = [Math.floor(rows / 2), Math.floor(cloumns / 2)] //初始污染源位置，可改进为用户输入

var surfaceCell = undefined //元胞网格对象
var vadoseZoneCell = undefined //元胞网格对象
var gdwaterLevelCell = undefined //元胞网格对象

var xlPosSurface = undefined //计算地表元胞位置的对象
var xlPos = undefined //计算元胞位置的对象
var xlPosGdwater = undefined //计算潜水层元胞位置的对象

var xlGeoSurface = undefined //地表盒子流动线对象
var xlGeo = undefined //包气带盒子流动线对象
var xlGeoGdwater = undefined //潜水层盒子流动线对象

var xlPar = undefined //粒子类对象
var xlEchart = undefined //echart图表对象

let particleMounted = null; //粒子类

var time = 0 //计数器
var compeleted = false //初始化指示
var startColor = new Cesium.Color(1, 0, 0, 1)
var endColor = new Cesium.Color(1, 1, 0, 0)
var colorDiff = Cesium.Color.subtract(startColor, endColor, new Cesium.Color())

let middleware = null;//地表中间件
let splite = null; //包气带中间件

const xlParameters = {
    rate:2, //每秒发射多少个粒子
    particleSize:1,//粒子缩放倍速
    stickView:true, //视角固定
    depthTerrainChecked:false, //深度检测
    isBursts: false, //是否粒子爆炸
    simluateTime:10, //扩散次数
    simulateState:3,//表示扩散的状态，0为地表，1为土壤，2为地下水，3为整体
    structureColor:false, //通过颜色来区分是地表、土壤还是潜水面

};

const outerNames = {
    cellSize:[5,5,2],//元胞大小
    waterMatrix: null, //水位矩阵
    rectangle:null,//包围盒矩形
    rectangleCellDao:null, //元胞dao类
    recdaos:null, //切分后的矩形
    gdwaterCell:null, //地下水位元胞类
    colors:[Color100[0][4], Color100[0][2], Color100[0][0]], //三种颜色对应三个地质结构
    cellMass:10000,//g
    centerPosition:null, //模型中点世界坐标
}

//初始化、生成地表元胞网格
async function initSurfaceCell() {
     // 变量
     viewer.terrainProvider = Cesium.createWorldTerrain()

     viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    //  viewer.scene.globe.depthTestAgainstTerrain = false
    // viewer.scene.globe.terrainExaggeration = 2

    //中间件
    middleware = new Middleware(viewer)//boundingPositions

    // 设置参数
    middleware.size = [outerNames.cellSize[0], outerNames.cellSize[1]];
    await middleware.computer(false);

    // 获取参数
    let centerPosition = await middleware.getCenter();
    dimensions = middleware.dimensions;
    let rectangleCellDao = middleware.rectangleCellDao;
    let matrix = middleware.matrix;

    cloumns = rectangleCellDao.xNumber;
    rows = rectangleCellDao.yNumber;

    surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);
    let pollutedCellDao = new PollutedCellDao(
        [Math.floor(rectangleCellDao.xNumber / 2), Math.floor(rectangleCellDao.yNumber / 2)],
        outerNames.cellMass
    );

    // surfaceCell.setPollutedSourceCell(
    //     pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    // )

    viewer.camera.lookAt(centerPosition, new Cesium.Cartesian3(0.0, -200, 200.0));

    //设置参数
    [outerNames.rectangle, outerNames.rectangleCellDao, outerNames.recdaos] = [middleware.rec, middleware.rectangleCellDao, middleware.recdaos]
    outerNames.centerPosition = centerPosition;
}

//初始化、生成包气带元胞网格
async function initVadoseCell(){
    if(!middleware) return;
    
    const [rec, rectangleCellDao, recdaos] = [middleware.rec, middleware.rectangleCellDao, middleware.recdaos]
    
    splite = new Splite(null,null,null,rec,rectangleCellDao,recdaos);
    splite.setCellSize(outerNames.cellSize[0], outerNames.cellSize[1])

    // 高度水位矩阵
    const {
        heightMatrix,
        waterMatrix
    } = await splite.getMatrix(splite.cellSize);
    
    splite.doWaterMatrix(waterMatrix, 5);
    
    let maxHeight = splite.maxmin(heightMatrix)
    let minWater = splite.maxmin(waterMatrix, 'min') //便于观察，水位下降10

    // 生成包围盒
    splite.generateBoundingBox(maxHeight, minWater, false);

    // 生成网格
    const depth = outerNames.cellSize[2];
    const hNumber = splite.getHNumber(maxHeight, minWater, depth)

    // 设置参数
    dimensions.z = depth;

    const computerVadoseDao = new ComputerVadoseDao(rec, rectangleCellDao.xNumber, rectangleCellDao.yNumber, hNumber, maxHeight - minWater)
    computerVadoseDao.computer()
    computerVadoseDao.generate(true)

    // 元胞类
    vadoseZoneCell = new VadoseZoneCell(waterMatrix, rectangleCellDao.yNumber,
        rectangleCellDao.xNumber, hNumber, computerVadoseDao.dimensions, heightMatrix)
    
    // 设置污染源
   
    // vadoseZoneCell.setPollutantMass(parseInt(rectangleCellDao.yNumber / 2),
    // parseInt(rectangleCellDao.xNumber / 2), 1, 1000)

    // 设置参数
    outerNames.waterMatrix = waterMatrix;


}

//初始化、生成潜水层元胞网格
function initGdwaterCell() {
    if(!splite || !middleware){
        return;
    }
    
    const waterMatrix = outerNames.waterMatrix;
    
    const rectangleCellDao = outerNames.rectangleCellDao;

    const xNumber = rectangleCellDao.xNumber - rectangleCellDao.ex;
    const yNumber = rectangleCellDao.yNumber - rectangleCellDao.ey;
    const gdwaterCell = new GdwaterLevelCell(
        waterMatrix, 
        xNumber, 
        yNumber,
        new Cesium.Cartesian2(rectangleCellDao.length, rectangleCellDao.width)
    )
    
    // 设置污染源
    // gdwaterCell.setPollutantMass(parseInt(rectangleCellDao.xNumber/2),
    // parseInt(rectangleCellDao.yNumber/2), 1000);

    // 设置参数
    outerNames.gdwaterCell = gdwaterCell;
}


//地表初始化粒子系统
function initParticle() {
    const centerPosition = outerNames.centerPosition;
    particleMounted = new ParticleMounted(centerPosition, dimensions, cloumns, rows, 0 );
}

//地表质量更新、
function surfaceSimulate(vadoseZoneCell) {
    let isPollutedArea = Array.from(surfaceCell.isPollutedArea) //当前污染区
    
    for (const currentPollutedGrid of isPollutedArea) {
        const nextPollutedArea = surfaceCell.simulateOneStep(currentPollutedGrid)
        if (nextPollutedArea.length == 0) {
            continue
        }

        // 粒子扩散
        particleDiffusion(currentPollutedGrid, nextPollutedArea);

        // 质量输出到土壤
        const pos = currentPollutedGrid.position;

        if(vadoseZoneCell){
            vadoseZoneCell.setPollutantMass(...pos, 1, surfaceCell.verMass);
        }
    }
}

//包气带扩散仿真 粒子模拟 
function vadoseSimulate(gdwaterCell) {
    
    let isPollutedArea = Array.from(vadoseZoneCell.isPollutedArea);
    
    for (const currentPollutedCell of isPollutedArea) {
        const nextPollutedArea = vadoseZoneCell.simulateByStep(currentPollutedCell)

        particleDiffusion(currentPollutedCell, nextPollutedArea, true);
    }

    if(vadoseZoneCell.outGdwater.length > 0){
        if(!gdwaterCell){
            return;
        }
        const outGdwater = vadoseZoneCell.outGdwater;
        for(let i=0; i< outGdwater.length; i++){
            const [p1, p2 ,mass] = outGdwater[i];
            gdwaterCell.setPollutantMass(p1, p2, mass);
        }

    }
}

/**
 * 
 * @param {}
 * @returns 
 */
function gdwaterSimulate() {
    const gdwaterCell = outerNames.gdwaterCell;
    const hIndex = splite.hNumber-1; //偏移索引，不是长度

    let isPollutedArea = gdwaterCell.isPollutedArea.slice();
    
    for (const currentPollutedCell of isPollutedArea) {
        const nextPollutedArea = gdwaterCell.updateCellMassForMoleAndMech(currentPollutedCell)
        particleDiffusion(currentPollutedCell, nextPollutedArea, false, true, hIndex);
    }
}

//粒子飞行 
function particleDiffusion(currentPollutedGrid, nextPollutedArea, isVadose, isGdwater, hNumber) {
    let directions = [];
    let position = [...currentPollutedGrid.position];
    let color = outerNames.colors[0];

    // 若为土壤，将z值翻转
    if(isVadose){
        position[2] = -position[2];
        color = outerNames.colors[1];
    }else if(isGdwater){
        position[2] = -hNumber;
        color = outerNames.colors[2];
    }

    for (let j = 0; j < nextPollutedArea.length; j++) {
        let position1 = [...nextPollutedArea[j].position];

        if(isVadose){
            position1[2] = -position1[2];
        }else if(isGdwater){
            position1[2] = -hNumber;
        }

        const direction = particleMounted.getDirections(position, position1)
        directions.push(direction)
    }
    
    const offset = particleMounted.getOffset(position, new Cesium.Cartesian3(0,0,0));
    const option = {
        translation: offset,
        direction : directions,
    }
    particleMounted.systemOptions = option;

    // 是否通过颜色来区分污染扩散地质结构
    if(xlParameters.structureColor){
        particleMounted.generate( currentPollutedGrid.cellMass, Cesium.Color.fromCssColorString(color));
    }else{
        particleMounted.generate( currentPollutedGrid.cellMass);
    }
}




/**
 * 一次扩散之后，更新计数器
 */
function overSimulate() {
    time++
    $('#diffutionNumber').text(time);
}


// 初始化
async function init() {
    if (compeleted) {
        xlGeo.removeAllBoxsByEntities()
        time = 0
        compeleted = false
        $('#diffutionNumber').text(time);
    }

    await initSurfaceCell();
    await initVadoseCell();
    initGdwaterCell();

    // 判断当前为哪种扩散状态,赋予元胞质量
    const simulateState = xlParameters.simulateState;
    const rectangleCellDao = outerNames.rectangleCellDao;
    if(simulateState === 0 || simulateState === 3 ){
         surfaceCell.setPollutedSourceCell(
            Math.floor(rectangleCellDao.xNumber/2),
            Math.floor(rectangleCellDao.yNumber/2), 
            outerNames.cellMass
        )
    }else if(simulateState === 1){
        vadoseZoneCell.setPollutantMass(
            Math.floor(rectangleCellDao.yNumber / 2),
            Math.floor(rectangleCellDao.xNumber / 2), 
            1, 
            outerNames.cellMass
        )
    }else if(simulateState === 2){
        outerNames.gdwaterCell.setPollutantMass(
            parseInt(rectangleCellDao.xNumber/2),
            parseInt(rectangleCellDao.yNumber/2), 
            outerNames.cellMass
        );
    }
    
    compeleted = true
}


//主函数
function simulate() {
    const gdwaterCell = outerNames.gdwaterCell;
    if(!surfaceCell || !vadoseZoneCell || !gdwaterCell){
        alert('请初始化！')
        return;
    }
 
    if(time === 0){
        initParticle();
    }
    // 判断哪种扩散类型
    const simulateState = xlParameters.simulateState;
    if(simulateState === 0){
        surfaceSimulate();
    }else if(simulateState === 1){
        vadoseSimulate();
    }else if(simulateState === 2){
        gdwaterSimulate();
    }else{
        // 耦合扩散
        if (time == 0) {
            initParticle();
        }
        surfaceSimulate(vadoseZoneCell);
        if(time > 0){
            vadoseSimulate(gdwaterCell);
            gdwaterSimulate();
        }
    }  

    overSimulate();
}


$(document).ready(() => {

    document.getElementById('init').addEventListener("click", init)

    $('#simulate').click(simulate) //主程序

    $('#selectBoxs').click(function () {
        if (!middleware || !splite) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }
        if ($(this).prop('checked') == true) {
            middleware.division();
            middleware.showDivision(true);
            
            splite.showBoundingBox(true);
        } else {
            middleware.showDivision(false);
            splite.showBoundingBox(false);
        }
    });

})

$('#reset').click(function (e) { 
    e.preventDefault();

     surfaceCell = undefined //元胞网格对象
    vadoseZoneCell = undefined //元胞网格对象
    gdwaterLevelCell = undefined //元胞网格对象

    if(particleMounted){
        particleMounted.removeAll();
    }
    particleMounted = null; //粒子类

    time = 0 //计数器
    compeleted = false //初始化指示

    if(middleware){
        middleware.enableClip(false)
    }
    middleware = null;
    splite = null;
    
    viewer.entities.removeAll();

    viewer.dataSources.removeAll();

    $('#diffutionNumber').text(time);

});

$('#enable-clip').click(function (e) { 
    if(middleware){
        middleware.enableClip($(this).prop('checked'))
    }
    
});

$('#simulate-numbers').click(function (e) { 
    e.preventDefault();
    for(let i = 0; i < xlParameters.simluateTime; i++){
        simulate();
    }
});

Cesium.knockout.track(xlParameters);
const toolbar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(xlParameters, toolbar);
Cesium.knockout
  .getObservable(xlParameters, "rate")
  .subscribe(function (newValue) {
    if (Number(newValue) && particleMounted) {
        particleMounted.particelNumbers = Number(newValue);
    }
});
Cesium.knockout
  .getObservable(xlParameters, "particleSize")
  .subscribe(function (newValue) {
    if (Number(newValue) && particleMounted) {
        particleMounted.particleSize = Number(newValue);
    }
});
Cesium.knockout
  .getObservable(xlParameters, "stickView")
  .subscribe(function (newValue) {
    if (Boolean(newValue) ) {
        if(outerNames.centerPosition){
            viewer.camera.lookAt(outerNames.centerPosition, new Cesium.Cartesian3(0.0, -200, 200.0));
        }
    }else{
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY) 
    }
});
Cesium.knockout
  .getObservable(xlParameters, "depthTerrainChecked")
  .subscribe(function (newValue) {
    viewer.scene.globe.depthTestAgainstTerrain = Boolean(newValue);
});
Cesium.knockout
  .getObservable(xlParameters, "isBursts")
  .subscribe(function (newValue) {
      if(particleMounted){
          particleMounted.bursts = Boolean(newValue);
      }
});
Cesium.knockout
  .getObservable(xlParameters, "structureColor")
  .subscribe(function (newValue) {
        xlParameters.structureColor = Boolean(newValue); 
});

Sandcastle.addToolbarMenu(
    [
        {
            text: "整体扩散",
            onselect: function () {
                xlParameters.simulateState = 3;
            },
        },
        {
            text: "地表扩散",
            onselect: function () {
                xlParameters.simulateState = 0;
            },
        },
        {
            text: "土壤扩散",
            onselect: function () {
                xlParameters.simulateState = 1;
            },
        },
        {
            text: "地下水扩散",
            onselect: function () {
                xlParameters.simulateState = 2;
            },
        },
        
    ],
    "choseButtons"
)
