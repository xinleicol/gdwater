/**
 *污染物地表-包气带-潜水面耦合扩散模拟
 */
import SurfaceCell from '../cells/SurfaceCell.js'
import VadoseZoneCell from '../cells/VadoseZoneCellCoulping.js'
import GdwaterLevelCell from '../cells/GdwaterLevelCell.js'
import XLBoxGeometry from '../utils/XLBoxGeometry.js'
import PollutedCellDao from '../Dao/PollutedCellDao.js'
import Middleware from './middleware.js'
import Splite from '../utils/dispose/Splite.js'
import ComputerVadoseDao from '../utils/computer/ComputerVadoseDao.js'
import Color100 from '../source/100.json' assert { type: 'json' };


var time = 0 //计数器
var compeleted = false //初始化指示


const xlParameters = {
    xSplit:0.0,//x轴切分比例
    ySplit:0.0,//y轴切分比例
    zSplit:0.0,//z轴切分比例
    stickView:true, //视角固定
    depthTerrainChecked:false, //深度检测
    simluateTime:10, //扩散次数
    simulateState:3,//表示扩散的状态，0为地表，1为土壤，2为地下水，3为整体
    showImagery:true,//是否开启影像
    simulateTimer: false, //是否开启定时器
    timer:null, //定时器

};

const outerNames = {
    cellSize:[5,5,1],//元胞大小
    waterMatrix: null, //水位矩阵
    rectangle:null,//包围盒矩形
    rectangleCellDao:null, //元胞dao类
    recdaos:null, //切分后的矩形
    gdwaterCell:null, //地下水位元胞类
    colors:[Color100[0][4], Color100[0][2], Color100[0][0]], //三种颜色对应三个地质结构
    cellMass:1000,//g
    centerPosition:null, //模型中点世界坐标
    xlGeo: null, //立方体生成类
    boxColor: Cesium.Color.fromCssColorString(Color100[0][0]).withAlpha(0.6), //立方体颜色
    dimensions: null, //元胞大小
    surfaceCell: null, //地表元胞类
    vadoseZoneCell:null, //包气带元胞类
    middleware: null, //地表元胞扩散中间件
    computerVadoseDao: null, //包气带元胞中间件、颜色更新中间件
    splite: null,//包气带中间件
    depth:null, //最大深度
    surfaceType:"surfaceCell",//地表网格类型，关键参数，更新颜色需要该值，与元胞类的name属性对应
    vadoseType:"vadoseCell",//包气带网格类型，关键参数，更新颜色需要该值
    gdwaterType:"gdwaterCell",//潜水面格类型，关键参数，更新颜色需要该值
}

//初始化、生成地表元胞网格
async function initSurfaceCell() {
     // 变量
     viewer.terrainProvider = Cesium.createWorldTerrain()

     viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    //  viewer.scene.globe.depthTestAgainstTerrain = false
    // viewer.scene.globe.terrainExaggeration = 2

    //中间件
    const middleware = new Middleware(viewer)//boundingPositions

    // 设置参数
    middleware.size = [outerNames.cellSize[0], outerNames.cellSize[1]];
    await middleware.computer(false);

    // 获取参数
    let centerPosition = await middleware.getCenter();
    const dimensions = middleware.dimensions;
    dimensions.z = 1; //默认高度为1米
    let rectangleCellDao = middleware.rectangleCellDao;
    let matrix = middleware.matrix;

    const cloumns = rectangleCellDao.xNumber;
    const rows = rectangleCellDao.yNumber;

    // 生成立方体，默认高度为1
    const xlGeo = new XLBoxGeometry(centerPosition, dimensions);
    xlGeo.initBoxPositionUpdate(null, cloumns, rows);
    const style = {
        material: outerNames.boxColor,
        show:false,
    }
    xlGeo.style = style;
    xlGeo.generateByEntities(outerNames.surfaceType); //关键设置，与cell类的name属性保持一致

    // 传递
    middleware.xlGeo = xlGeo;
    

    const surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);
    const pollutedCellDao = new PollutedCellDao(
        [Math.floor(rectangleCellDao.xNumber / 2), Math.floor(rectangleCellDao.yNumber / 2)],
        outerNames.cellMass
    );

    surfaceCell.setPollutedSourceCell(
        pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    )

    viewer.camera.lookAt(centerPosition, new Cesium.Cartesian3(0.0, -200, 200.0));

    //设置参数
    [outerNames.rectangle, outerNames.rectangleCellDao, outerNames.recdaos] = [middleware.rec, middleware.rectangleCellDao, middleware.recdaos]
    outerNames.centerPosition = centerPosition;
    outerNames.xlGeo = xlGeo;
    outerNames.dimensions = dimensions;
    outerNames.surfaceCell = surfaceCell;
    outerNames.middleware = middleware;
}

//初始化、生成包气带元胞网格
async function initVadoseCell(){
    const middleware = outerNames.middleware;
    const dimensions = outerNames.dimensions;
    const xlGeo = outerNames.xlGeo;

    if(!middleware) return;
    
    const [rec, rectangleCellDao, recdaos] = [middleware.rec, middleware.rectangleCellDao, middleware.recdaos];
    
    const splite = new Splite(null,null,null,rec,rectangleCellDao,recdaos);
    splite.setCellSize(outerNames.cellSize[0], outerNames.cellSize[1]);

    // 高度水位矩阵
    const {
        heightMatrix,
        waterMatrix
    } = await splite.getMatrix(splite.cellSize);
    
    splite.doWaterMatrix(waterMatrix, 5);
    
    let maxHeight = splite.maxmin(heightMatrix);
    let minWater = splite.maxmin(waterMatrix, 'min')
    const depth = (maxHeight - minWater);

    // 生成包围盒
    splite.generateBoundingBox(maxHeight, minWater, false);

    // 生成网格
    const zlen = outerNames.cellSize[2];
    const hNumber = splite.getHNumber(maxHeight, minWater, zlen);

    // 设置参数
    dimensions.z = zlen;
    rectangleCellDao.zNumber = hNumber+2; //加上地表一层网格和潜水面一层网格
    rectangleCellDao.depth = depth;

    const computerVadoseDao = new ComputerVadoseDao(rec, rectangleCellDao.xNumber, rectangleCellDao.yNumber, hNumber, -depth)

    // 传入参数
    computerVadoseDao.dimensions = dimensions;
    computerVadoseDao.offset = new Cesium.Cartesian3(0,0,-depth/2);
    computerVadoseDao.xlGeo = xlGeo;
    computerVadoseDao.type = outerNames.vadoseType; //这个很关键，不能省

    // 生成元胞
    computerVadoseDao.generate(true);
    // computerVadoseDao.generate(false);

    // 元胞类
    const vadoseZoneCell = new VadoseZoneCell(waterMatrix, rectangleCellDao.yNumber,
        rectangleCellDao.xNumber, hNumber, computerVadoseDao.dimensions, heightMatrix);
    
    
    // 设置污染源
    // vadoseZoneCell.setPollutantMass(6, 6, 1,  1000);
    // vadoseZoneCell.setPollutantMass(parseInt(rectangleCellDao.yNumber / 2),
    //     parseInt(rectangleCellDao.xNumber / 2), 1, 1000);

    // 设置参数
    outerNames.waterMatrix = waterMatrix;
    outerNames.computerVadoseDao = computerVadoseDao;
    outerNames.vadoseZoneCell = vadoseZoneCell;
    outerNames.splite = splite;
    outerNames.depth = depth;


}

//初始化、生成潜水层元胞网格
function initGdwaterCell() {

    if(!outerNames.splite || !outerNames.middleware){
        return;
    }

    const xlGeo = outerNames.xlGeo;
    const depth = outerNames.depth;
    const dimensions = outerNames.dimensions;
    
    const waterMatrix = outerNames.waterMatrix;
    
    const rectangleCellDao = outerNames.rectangleCellDao;

    const xNumber = rectangleCellDao.xNumber - rectangleCellDao.ex;
    const yNumber = rectangleCellDao.yNumber - rectangleCellDao.ey;
    const cloumns = rectangleCellDao.xNumber;
    const rows = rectangleCellDao.yNumber;

    // 生成立方体，默认高度为1
    dimensions.z = 1;
    const offset = new Cesium.Cartesian3(0,0,-depth);
    const style = {
        material: Cesium.Color.fromCssColorString(Color100[1][0]).withAlpha(0.6),
        show:false,
    }
    xlGeo.style = style;
    xlGeo.dimensions = dimensions;
    xlGeo.initBoxPositionUpdate(offset, cloumns, rows);
    xlGeo.generateByEntities(outerNames.gdwaterType); //关键设置，与cell类的name属性保持一致


    const gdwaterCell = new GdwaterLevelCell(
        waterMatrix, 
        xNumber, 
        yNumber,
        new Cesium.Cartesian2(rectangleCellDao.length, rectangleCellDao.width)
    )
    
    // 设置污染源
    // gdwaterCell.setPollutantMass(parseInt(rectangleCellDao.xNumber/2),
    //     parseInt(rectangleCellDao.yNumber/2), 1000);

    // 设置参数
    outerNames.gdwaterCell = gdwaterCell;
}



//地表质量更新
function surfaceSimulate() {
    const surfaceCell = outerNames.surfaceCell;
    const vadoseZoneCell = outerNames.vadoseZoneCell;

    let isPollutedArea = Array.from(surfaceCell.isPollutedArea) //当前污染区
    
    for (const currentPollutedGrid of isPollutedArea) {
        let nextPollutedArea = surfaceCell.simulateOneStep(currentPollutedGrid)
        if (nextPollutedArea.length == 0) {
            continue
        }
        // 质量输出到土壤
        const pos = currentPollutedGrid.position;

        if(vadoseZoneCell){
            // 简化直接扩散到包气带一、二层，均分
            vadoseZoneCell.setPollutantMass(...pos, 0, surfaceCell.verMass/2);
            vadoseZoneCell.setPollutantMass(...pos, 1, surfaceCell.verMass/2);
        }
    }

    

}

//包气带扩散仿真 粒子模拟 
function vadoseSimulate() {
    const vadoseZoneCell = outerNames.vadoseZoneCell;
    const gdwaterCell = outerNames.gdwaterCell;
    const computerVadoseDao = outerNames.computerVadoseDao;

    // 扩散
    vadoseZoneCell.simulate();

    // 质量输入潜水层
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

    // computerVadoseDao.updateColorCoupling(vadoseZoneCell.isPollutedArea);

}

/**
 * 潜水层扩散
 */
function gdwaterSimulate() {
    const surfaceCell = outerNames.surfaceCell;
    const vadoseCell = outerNames.vadoseZoneCell;
    const gdwaterCell = outerNames.gdwaterCell;
    const computerVadoseDao = outerNames.computerVadoseDao;

    // 扩散
    gdwaterCell.updateCellMassForMoleAndMech()

    // 更新颜色
    computerVadoseDao.updateColorCoupling(surfaceCell.isPollutedArea, vadoseCell.isPollutedArea, gdwaterCell.isPollutedArea);
    // computerVadoseDao.updateColorCoupling( gdwaterCell.isPollutedArea);   
}

// 切分函数
function split(type) { 
    const xlGeo = outerNames.xlGeo;
    const rectangleCellDao = outerNames.rectangleCellDao;
    const hiddenRadiox = xlParameters.xSplit;
    const hiddenRadioy = xlParameters.ySplit;
    const hiddenRadioz = xlParameters.zSplit;

    const lenx = rectangleCellDao.xNumber;
    const leny = rectangleCellDao.yNumber;
    const lenz = rectangleCellDao.zNumber;

    const numberX = Math.ceil(hiddenRadiox*lenx);
    const numberY = Math.ceil(hiddenRadioy*leny);
    const numberZ = Math.ceil(hiddenRadioz*lenz);

     // 全部显示
    for (let i = 0; i < xlGeo.boxEntities.length; i++) {
        const box = xlGeo.boxEntities[i];
        box.show = true;  
    }

    // 隐藏
    const boxEntities = xlGeo.boxEntities.filter((entity) => fiterFunc(entity, numberX, numberY, numberZ, lenz));
    for (let i = 0; i < boxEntities.length; i++) {
        const box = boxEntities[i];
        box.show = false; 
    }
}

function filterZ(entity, number, lenz) {
    if(number === 1){
        return entity.name === outerNames.surfaceType;
    }else if(number === lenz){
        return true;
    }else if(number === 0) {
        return false
    }else{
        return ((entity.xlCellPos[2] + 2) < number || entity.name === outerNames.surfaceType);
    }
}

function fiterFunc(entity, numberX, numberY, numberZ, lenz) {
    return (entity.xlCellPos[0] < numberX) || (entity.xlCellPos[1] < numberY) || (filterZ(entity, numberZ, lenz))
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
    
    compeleted = true
}


//主函数
function simulate() {
    const surfaceCell = outerNames.surfaceCell;
    const vadoseZoneCell = outerNames.vadoseZoneCell;
    const gdwaterCell = outerNames.gdwaterCell;
    // const gdwaterCell = outerNames.gdwaterCell;

    if(!surfaceCell || !vadoseZoneCell|| !gdwaterCell){
        console.log('请初始化！')
        return;
    }

    surfaceSimulate();
    vadoseSimulate();
    gdwaterSimulate();


    overSimulate();
}


$(document).ready(() => {

    document.getElementById('init').addEventListener("click", init)

    $('#simulate').click(simulate) //主程序

    $('#selectBoxs').click(function () {
        const middleware = outerNames.middleware
        const splite =  outerNames.splite 
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

    outerNames.surfaceCell = undefined //元胞网格对象
    outerNames.vadoseZoneCell = undefined //元胞网格对象
    outerNames.gdwaterLevelCell = undefined //元胞网格对
    let splite = outerNames.splite
    let middleware = outerNames.middleware

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
    const middleware = outerNames.middleware;
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
  .getObservable(xlParameters, "xSplit")
  .subscribe(function (newValue) {
    if (Number(newValue) && outerNames.surfaceCell) {
        split('x');
    }
});

Cesium.knockout
  .getObservable(xlParameters, "ySplit")
  .subscribe(function (newValue) {
    if (Number(newValue) && outerNames.surfaceCell) {
        split('y');
    }
});

Cesium.knockout
  .getObservable(xlParameters, "zSplit")
  .subscribe(function (newValue) {
    if (Number(newValue) && outerNames.surfaceCell) {
        split('z');
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
  .getObservable(xlParameters, "showImagery")
  .subscribe(function (newValue) {
    viewer.imageryLayers.get(0).show = Boolean(newValue); 
});
Cesium.knockout
  .getObservable(xlParameters, "simulateTimer")
  .subscribe(function (newValue) {
    if(Boolean(newValue)) {
        xlParameters.timer = setInterval(() => {
            simulate()
        }, 2000)
    }else {
        clearInterval(xlParameters.timer)
    }
});