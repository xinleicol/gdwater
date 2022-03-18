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


var waterLevel = [
    [26.9706, 26.8452, 26.7198, 26.5944, 26.469, 26.3437, 26.2183, 26.0929, 25.9675, 25.0871, 24.9617, 24.8363, 24.711, 24.6452, 24.6374, 24.6296, 24.6217, ],
    [27.1173, 26.9919, 26.8666, 26.7412, 26.6158, 26.4904, 26.365, 26.2396, 26.1142, 25.2339, 25.1085, 24.9831, 24.8577, 24.7944, 24.7866, 24.7787, 24.7709],
    [27.2641, 27.1387, 27.0133, 26.8879, 26.7625, 26.6371, 26.5117, 26.3863, 26.261, 25.3806, 25.2552, 25.1298, 25.0044, 24.9436, 24.9358, 24.9279, 24.9201],
    [27.4108, 27.2854, 27.16, 27.0346, 26.9092, 26.7839, 26.6585, 26.5331, 26.4077, 25.5273, 25.4019, 25.2765, 25.1512, 25.0928, 25.085, 25.0771, 25.0693],
    [27.5575, 27.4321, 27.3067, 27.1814, 27.056, 26.9306, 26.8052, 26.6798, 26.5544, 25.674, 25.5487, 25.4233, 25.2979, 25.242, 25.2342, 25.2263, 25.2185],
    [27.7042, 27.5789, 27.4535, 27.3281, 27.2027, 27.0773, 26.9519, 26.8265, 26.7011, 25.8208, 25.6954, 25.57, 25.4446, 25.3912, 25.3834, 25.3755, 25.3677],
    [27.851, 27.7256, 27.6002, 27.4748, 27.3494, 27.224, 27.0987, 26.9733, 26.8479, 25.9675, 25.8421, 25.7167, 25.5913, 25.5404, 25.5326, 25.5247, 25.5169],
    [27.9977, 27.8723, 27.7469, 27.6215, 27.4962, 27.3708, 27.2454, 27.12, 26.9946, 26.1142, 25.9888, 25.8635, 25.7381, 25.6896, 25.6818, 25.6739, 25.6661],
    [28.1444, 28.019, 27.8937, 27.7683, 27.6429, 27.5175, 27.3921, 27.2667, 27.1413, 26.261, 26.1356, 26.0102, 25.8848, 25.8388, 25.831, 25.8231, 25.8153],
    [28.1231, 27.9977, 27.8723, 27.7469, 27.6215, 27.4962, 27.3708, 27.2454, 27.12, 26.9946, 26.8692, 26.7438, 26.6184, 26.5848, 26.577, 26.5691, 26.5613],
    [28.2698, 28.1444, 28.019, 27.8937, 27.7683, 27.6429, 27.5175, 27.3921, 27.2667, 27.1413, 27.016, 26.8906, 26.7652, 26.734, 26.7262, 26.7183, 26.7105],
    [28.4166, 28.2912, 28.1658, 28.0404, 27.915, 27.7896, 27.6642, 27.5388, 27.4135, 27.2881, 27.1627, 27.0373, 26.9119, 26.8832, 26.8754, 26.8675, 26.8597],
    [28.5633, 28.4379, 28.3125, 28.1871, 28.0617, 27.9363, 27.811, 27.6856, 27.5602, 27.4348, 27.3094, 27.184, 27.0586, 27.0324, 27.0246, 27.0167, 27.0089],
    [28.71, 28.5846, 28.4592, 28.3338, 28.2085, 28.0831, 27.9577, 27.8323, 27.7069, 27.5815, 27.4561, 27.3308, 27.2054, 27.1816, 27.1738, 27.1659, 27.1581],
    [28.8567, 28.7314, 28.606, 28.4806, 28.3552, 28.2298, 28.1044, 27.979, 27.8536, 27.7283, 27.6029, 27.4775, 27.3521, 27.3308, 27.323, 27.3151, 27.3073],
    [29.0035, 28.8781, 28.7527, 28.6273, 28.5019, 28.3765, 28.2511, 28.1258, 28.0004, 27.875, 27.7496, 27.6242, 27.4988, 27.48, 27.4721, 27.4643, 27.4565],
    [29.1502, 29.0248, 28.8994, 28.774, 28.6487, 28.5233, 28.3979, 28.2725, 28.1471, 28.0217, 27.8963, 27.7709, 27.6456, 27.6292, 27.6213, 27.6135, 27.6057]
] //地下水位值

var heightMatrix = [
    [82, 82, 82, 82, 82, 81, 80, 78, 76, 75, 75, 75, 75, 76, 76, 77, 78],
    [82, 83, 84, 84, 84, 83, 81, 80, 77, 77, 76, 76, 76, 76, 76, 76, 77],
    [82, 84, 85, 85, 85, 85, 83, 82, 79, 78, 78, 78, 77, 76, 76, 76, 76],
    [82, 85, 86, 86, 86, 86, 85, 83, 81, 80, 80, 78, 77, 76, 76, 76, 76],
    [82, 85, 86, 87, 87, 87, 85, 84, 82, 81, 81, 79, 78, 77, 76, 76, 76],
    [82, 85, 86, 87, 88, 87, 86, 85, 84, 81, 81, 79, 78, 77, 76, 76, 76],
    [81, 84, 85, 86, 87, 87, 87, 86, 85, 82, 82, 81, 80, 78, 76, 76, 77],
    [81, 84, 85, 86, 87, 87, 87, 86, 85, 84, 84, 83, 81, 80, 77, 77, 78],
    [79, 83, 84, 85, 86, 86, 86, 86, 86, 85, 85, 85, 83, 82, 79, 79, 79],
    [78, 78, 78, 78, 79, 80, 82, 85, 86, 87, 87, 87, 86, 85, 84, 84, 84],
    [77, 77, 77, 77, 78, 79, 81, 84, 85, 86, 87, 87, 87, 86, 85, 85, 86],
    [77, 77, 77, 77, 78, 79, 81, 84, 85, 86, 87, 87, 87, 86, 85, 85, 86],
    [77, 77, 77, 77, 77, 78, 79, 83, 84, 85, 86, 86, 86, 86, 86, 86, 86],
    [77, 77, 77, 77, 77, 77, 78, 81, 82, 84, 84, 85, 85, 85, 85, 85, 85],
    [77, 77, 77, 77, 77, 77, 77, 79, 81, 82, 83, 83, 83, 83, 82, 82, 83],
    [77, 77, 77, 77, 77, 77, 77, 78, 80, 81, 81, 82, 82, 81, 79, 79, 79],
    [77, 77, 77, 77, 77, 77, 77, 78, 80, 81, 81, 81, 80, 80, 77, 76, 76],
] //高程值

var rows = 9 //元胞行数
var cloumns = 9 //元胞列数
var heights = 9 //元胞纵数
var gdwaterRows = 17; //潜水层元胞行数
var gdwaterCols = 17; //潜水层元胞列数
var centerCellOffset = (gdwaterRows - rows) / 2 //元胞行列号中心偏移量，潜水层相对于包气带
var waterVeloty = 0.1 //潜水层水流速
var centerPosition = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
var dimensions = new Cesium.Cartesian3(1.0, 1.0, 1.0)
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

//初始化、生成地表元胞网格
function initSurfaceCell() {
    surfaceCell = new SurfaceCell(heightMatrix)
    surfaceCell.setPollutedSourceCell(...pollutionSourcePos, 100) //输入污染物质量
    // xlPosSurface = new XLPosition(centerPosition, dimensions, centerOffset1)
    // xlPosSurface.giveGridWorldAndModelPosition(surfaceCell.spreadArea)
    xlGeoSurface = new XLBoxGeometry(centerPosition, dimensions)
    xlGeoSurface.initBoxPositionUpdate(centerOffset1, cloumns, rows )
    xlGeoSurface.styleOne(); //第一种样式
    xlGeoSurface.generateByEntities()

}

//初始化、生成包气带元胞网格
function initVadoseCell(){
    vadoseZoneCell = new VadoseZoneCell(waterLevel, rows, cloumns, heights, dimensions, heightMatrix)
    xlPos = new XLPosition(centerPosition, dimensions, centerOffset2, rows, cloumns, heights)
    xlPos.giveGridWorldAndModelPosition3D(vadoseZoneCell.spreadArea)
    xlGeo = new XLBoxGeometry(centerPosition, dimensions)
    xlGeo.initBoxPosition3DUpdate(centerOffset2, rows, cloumns, heights)
    xlGeo.boxEntitiesStyle.material = Cesium.Color.AZURE.withAlpha(0.1)
    xlGeo.generateByEntities()
}

//初始化、生成潜水层元胞网格
function initGdwaterCell() {
    gdwaterLevelCell = new GdwaterLevelCell(waterLevel, gdwaterRows, gdwaterCols, dimensions)
    xlPosGdwater = new XLPosition(centerPosition, dimensions, centerOffset3, gdwaterRows, gdwaterCols, 0)
    if (time == 0) xlPosGdwater.giveGridWorldAndModelPosition(gdwaterLevelCell.spreadArea);
    xlGeoGdwater = new XLBoxGeometry(centerPosition, dimensions)
    xlGeoGdwater.initBoxPosition(centerOffset3, gdwaterRows, gdwaterCols)
    xlGeoGdwater.attributeStyle = {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.DEEPPINK)
    }
    xlGeoGdwater.appearance = new Cesium.PerInstanceColorAppearance({
        flat: true
    })
    xlGeoGdwater.generate()
}

// 初始化
function init() {
    if (compeleted) {
        xlGeo.removeAllBoxsByEntities()
        time = 0
        compeleted = false
        $('#diffutionNumber').text(time);
    }

    initSurfaceCell();
    // initVadoseCell();
    // initGdwaterCell();
    // xlGeo.setView([-75.59777, 40.03883])
    xlGeoSurface.lookAt(0, -10, 29);

    xlGeoSurface.drawAxis();

    // xlEchart = new XLEchart(document.getElementById('echart'), cloumns, rows, heights)
    compeleted = true
}

//地表初始化粒子系统
function initParticle() {
    particleMounted = new ParticleMounted(centerPosition, dimensions, cloumns, rows, 0 );


    // xlPar = new XLBoxParticle(centerPosition, dimensions, centerOffset1)
    // xlPar.maxDistance = 0.1
    // xlPar.speedRatio = 0.5
    // xlPar.particleStyle.particleNumber = 1000
    // xlPar.massRatio = 1 //代表污染物浓度的粒子个数比率
    // xlPar.generateCoupling();
    // await xlPar.hasCompleted() //等待获取粒子对象
    // surfaceCell.isPollutedArea[0].particlePool = Array.from(xlPar.particles)
}

//地表质量更新、
function surfaceSimulate() {
    let isPollutedArea = Array.from(surfaceCell.isPollutedArea) //当前污染区
    for (const currentPollutedGrid of isPollutedArea) {
        const nextPollutedArea = surfaceCell.simulateOneStep(currentPollutedGrid)
        if (nextPollutedArea.length == 0) {
            continue
        }
        particleDiffusion(currentPollutedGrid, nextPollutedArea);
    }
    return surfaceCell.verMass //向下输入的污染物质量
}

//粒子飞行 生成流动线，
//生成流动线可以改进，第一个参数可以舍去
function particleDiffusion(currentPollutedGrid, nextPollutedArea) {
    let directions = [];
    for (let j = 0; j < nextPollutedArea.length; j++) {
        const direction = particleMounted.getDirections(currentPollutedGrid.position, nextPollutedArea[j].position)
        directions.push(direction)
        nextPollutedArea[j].isParticle =  true;  
    }
    const offset = particleMounted.getOffset(currentPollutedGrid.position, centerOffset1);
    const option = {
        translation: offset,
        direction : directions,
    }
    particleMounted.systemOptions = option
    particleMounted.generate();
}

//包气带扩散仿真 粒子模拟 
//因为机械弥散会向上扩散，所以先只考虑对流作用
function vadoseSimulate(verMass) {
    vadoseZoneCell.setPollutantMass(...pollutionSourcePos, 1, verMass); //这里的1，是因为包气带元胞中没考虑边界条件
    let buttomPollutedCells = [] //污染到达包气带底部，即将进入潜水满
    let isPollutedArea = Array.from(vadoseZoneCell.isPollutedArea);
    if (time == 0) { //第一次，污染物输出包气带，不会进行扩散
        particleDiffusion(surfaceCell.pollutionSourceCell, isPollutedArea);
        return buttomPollutedCells;
    }
    for (const currentPollutedCell of isPollutedArea) {
        vadoseZoneCell._getOutMass(currentPollutedCell)
        let nextPollutedArea = vadoseZoneCell.nextPollutedArea;
        particleDiffusion(currentPollutedCell, nextPollutedArea);
        vadoseZoneCell.nextPollutedArea = [];
        if (currentPollutedCell.boundary == '5') { //该污染元胞在包气带底部，每次都要判断，是否可以改进？
            buttomPollutedCells.push(currentPollutedCell);
        }
    }
    return buttomPollutedCells;

}

/**
 * 当前只考虑机械弥散作用
 * @param {包气带底部的元胞们...} buttomPollutedCells 
 * @returns 
 */
function gdwaterSimulate(buttomPollutedCells) {
    let nextPollutedArea = [];
    if (buttomPollutedCells.length > 0) { //到达底部 
        if (gdwaterLevelCell.isPollutedArea.length == 0) { //表示首次进入潜水层，潜水层不发生污染扩散
            for (const buttomPollutedCell of buttomPollutedCells) {
                let newMass = vadoseZoneCell.verKdiff * buttomPollutedCell.cellMass //向下扩散的质量
                //centerCellOffset注意这是中心点偏移量
                gdwaterLevelCell.setPollutantMass(buttomPollutedCell.position[0], buttomPollutedCell.position[1], newMass, buttomPollutedCell.position[2], centerCellOffset);
            }
        } else { //不是首次进入潜水层，开始在潜水层中发生扩散
            for (const buttomPollutedCell of buttomPollutedCells) {
                let newMass = vadoseZoneCell.verKdiff * buttomPollutedCell.cellMass //向下扩散的质量
                gdwaterLevelCell.setPollutantMass(buttomPollutedCell.position[0], buttomPollutedCell.position[1], newMass, buttomPollutedCell.position[2],centerCellOffset);
                gdwaterLevelCell.updateCellMass();
            }
        }
        nextPollutedArea = Array.from(gdwaterLevelCell.nextPollutedArea);
        particleDiffusion(null, nextPollutedArea);
        gdwaterLevelCell.nextPollutedArea = [];
    }
}

/**
 * 一次扩散之后，更新计数器
 */
function overSimulate() {
    time++
    $('#diffutionNumber').text(time);
}

//主函数
async function simulate() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    if (time == 0) initParticle();
    let verMass = surfaceSimulate()
    // let buttomPollutedCells = vadoseSimulate(verMass);
    // gdwaterSimulate(buttomPollutedCells);
    overSimulate();
    // xlPar.changeColor(Cesium.Color.fromRandom({
    //     minimumAlpha:1.0
    // })); //随机颜色

}



// 对流作用
function convectionSimulate() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    doSamething()

    if (time > 0) { //第一次点击只输入污染物质量
        initcell.updateCellMass() //质量更新
    }

    //颜色差值更新
    let currentColor = Cesium.Color.subtract(startColor, Cesium.Color.multiplyByScalar(colorDiff, time / (time + 1), new Cesium.Color()), new Cesium.Color()) //颜色差值
    let length = initcell.nextPollutedArea.length
    for (let i = 0; i < length; i++) {
        let onePollutedCell = initcell.nextPollutedArea.pop()
        xlGeo.getAndSetBoxEntites(onePollutedCell.modelPosition, currentColor) //注意网格坐标的i是坐标系中的y   
    }

    doSamethingAfther()
}

//机械弥散
function mechanicalDispersion() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    doSamething()

    if (time > 0) { //第一次点击只输入污染物质量
        initcell.mechanicalDispersion() //质量更新
    }

    //颜色差值更新
    let currentColor = Cesium.Color.subtract(startColor, Cesium.Color.multiplyByScalar(colorDiff, time / (time + 1), new Cesium.Color()), new Cesium.Color()) //颜色差值
    let length = initcell.nextPollutedArea.length
    for (let i = 0; i < length; i++) {
        let onePollutedCell = initcell.nextPollutedArea.pop()
        xlGeo.getAndSetBoxEntites(onePollutedCell.modelPosition, currentColor) //注意网格坐标的i是坐标系中的y   
    }

    doSamethingAfther()

}


// 相同代码提取
function doSamething() {
    let mass = inputPollutants(time)
    if (time == 0) { //test
        initcell.setPollutantMass(4, 4, 4, 100)
        xlGeo.getAndSetBoxEntites(new Cesium.Cartesian3(0, 0, 5), startColor)
    }
}

function doSamethingAfther() {

    if (($('#selectBoxs').prop('checked') == true) & time == 0) {
        generateBoxs()
    }

    //更新散点图
    if ($('#showEchart').prop('checked')) {
        updateScatter3D()
    }

    $('#diffutionNumber').text(time);
    time++
}

//更新3D散点图
function updateScatter3D() {
    xlEchart.removeData()
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    initcell.isPollutedArea.forEach(element => {
        let echartPosition = xlPos.gridToEchartPosition(element.position)
        xlEchart.setDataAndUpdate([...echartPosition, element.cellMass, element.cellOncentration])
    })
}

//生成元胞
function generateBoxs() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    xlGeo.boxEntitiesStyle = {
        material: Cesium.Color.AZURE.withAlpha(0.1),
    }
    xlGeo.generateByEntities()
}

//隐藏元胞
function removeBoxs() {
    xlGeo.hideAllBoxsByEntities()
}

/**
 * 获取污染输出量
 * @param {污染输入次数} time 
 * @returns 
 */
function inputPollutants(time) {
    return -0.6 * Math.pow((time - 5), 2) + 15
}



$(document).ready(() => {

    document.getElementById('init').addEventListener("click", init)

    $('#simulate').click(simulate) //主程序
    // $('#mechanicalDispersion').click(mechanicalDispersion) //机械弥散

    //属性面板
    $('#checkPanel').click(function () {

        if ($(this).prop("checked") == true) {
            $('#parametersPanel').show();
            $('#paramDrag').prop('checked', true)

            //拖动
            $('#parametersPanel').draggable({
                disabled: false
            })
        } else {
            $('#parametersPanel').hide();
        }

        $.each($('#paramFrom input'), function (i, element) {
            let name = $(element).attr('name')
            if (initcell) {
                $(element).attr(name, initcell[name]);
            }
        });
    })


    $('#selectBoxs').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }

        if ($(this).prop('checked') == true) {
            generateBoxs()
        } else {
            removeBoxs()
        }
    });

    $('#selectOutline').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }
        xlGeo.changeBoxOutline($(this).prop('checked'))

    });

    $('#cellAlpha').on('input propertychange', function () {
        $('#cellAlphaText').val($(this).val());
        if (!compeleted) {
            alert('请先初始化...')
            return
        }
        xlGeo.changeBoxAlpha($(this).val())
    });

    $('#showEchart').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }
        if ($(this).prop('checked')) {
            $('#echart').show()
            $("#echart").draggable();
            $('#isDraggable').attr('checked', true);
        } else {
            $('#echart').hide()
        }
    });

    $('#isDraggable').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }
        if ($(this).prop('checked')) {
            $("#echart").draggable({
                disabled: false
            });
        } else {
            $("#echart").draggable('disable');
        }
    });

    $('#paramFrom').submit(function (e) {
        e.preventDefault();
        let data = $(this).serializeArray()
        if (initcell) {
            $.each(data, function (i, element) {
                let name = element.name
                initcell[name] = element.value
            });
        } else {
            alert('未进行初始化，设置参数失败..')
            throw new Error('设置参数失败..')
        }
        $('#parametersPanel').hide();
        $('#checkPanel').prop('checked', false);
    });

    $('#paramDrag').click(function (e) {
        if ($(this).prop('checked')) {
            $('#parametersPanel').draggable({
                disabled: false
            })
        } else {
            $("#parametersPanel").draggable('disable');
        }
    });
})