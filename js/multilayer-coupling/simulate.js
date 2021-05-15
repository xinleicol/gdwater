 /**
 *污染物地表-包气带-潜水面耦合扩散模拟
 */
import SurfaceCell from './SurfaceCell.js'
import VadoseZoneCell from './VadoseZoneCell.js'
import GdwaterLevelCell from './GdwaterLevelCell.js'
import XLBoxGeometry from '../utils/XLBoxGeometry.js'
import XLPosition from '../utils/XLPosition.js'
import XLBoxParticle from '../utils/XLBoxParticle.js'
import xlType from '../utils/XLType.js'
import XLEchart from '../utils/XLEchart.js'


var waterLevel = [
    [26.9706, 26.8452, 26.7198, 26.5944, 26.469, 26.3437, 26.2183, 26.0929, 25.9675],
    [27.1173, 26.9919, 26.8666, 26.7412, 26.6158, 26.4904, 26.365, 26.2396, 26.1142],
    [27.2641, 27.1387, 27.0133, 26.8879, 26.7625, 26.6371, 26.5117, 26.3863, 26.261],
    [27.4108, 27.2854, 27.16, 27.0346, 26.9092, 26.7839, 26.6585, 26.5331, 26.4077],
    [27.5575, 27.4321, 27.3067, 27.1814, 27.056, 26.9306, 26.8052, 26.6798, 26.5544],
    [27.7042, 27.5789, 27.4535, 27.3281, 27.2027, 27.0773, 26.9519, 26.8265, 26.7011],
    [27.851, 27.7256, 27.6002, 27.4748, 27.3494, 27.224, 27.0987, 26.9733, 26.8479],
    [27.9977, 27.8723, 27.7469, 27.6215, 27.4962, 27.3708, 27.2454, 27.12, 26.9946],
    [28.1444, 28.019, 27.8937, 27.7683, 27.6429, 27.5175, 27.3921, 27.2667, 27.1413]
] //地下水位值
var heightMatrix = [
    [82, 82, 82, 82, 82, 81, 80, 78, 76],
    [82, 83, 84, 84, 84, 83, 81, 80, 77],
    [82, 84, 85, 85, 85, 85, 83, 82, 79],
    [82, 85, 86, 86, 86, 86, 85, 83, 81],
    [82, 85, 86, 87, 87, 87, 85, 84, 82],
    [82, 85, 86, 87, 88, 87, 86, 85, 84],
    [81, 84, 85, 86, 87, 87, 87, 86, 85],
    [81, 84, 85, 86, 87, 87, 87, 86, 85],
    [79, 83, 84, 85, 86, 86, 86, 86, 86]
] //高程值
var mass = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 100, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
] //污染物质量

var rows = 9 //元胞行数
var cloumns = 9 //元胞列数
var heights = 9 //元胞纵数
var waterVeloty = 0.1 //潜水层水流速
var centerPosition = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
var dimensions = new Cesium.Cartesian3(1.0, 1.0, 1.0)
var centerOffset1 = new Cesium.Cartesian3(0.0, 0.0, 11.0) //改进 2021年5月15日15:50:35
var centerOffset2 = new Cesium.Cartesian3(0.0, 0.0, 6.0)
var centerOffset3 = new Cesium.Cartesian3(0.0, 0.0, 1.0)

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

var time = 0 //计数器
var compeleted = false //初始化指示
var startColor = new Cesium.Color(1, 0, 0, 1)
var endColor = new Cesium.Color(1, 1, 0, 0)
var colorDiff = Cesium.Color.subtract(startColor, endColor, new Cesium.Color())

//初始化、生成地表元胞网格
function initSurfaceCell() {
    surfaceCell = new SurfaceCell(heightMatrix, mass)
    xlPosSurface = new XLPosition(centerPosition, dimensions, centerOffset1)
    xlPosSurface.giveGridWorldAndModelPosition(surfaceCell.spreadArea)
    xlGeoSurface = new XLBoxGeometry(centerPosition, dimensions)
    xlGeoSurface.initBoxPosition(centerOffset1, rows, cloumns)
    xlGeoSurface.generate()
    
}

//初始化、生成包气带元胞网格
function initVadoseCell(){
    vadoseZoneCell = new VadoseZoneCell(waterLevel, 0, rows, cloumns, heights, dimensions)
    xlPos = new XLPosition(centerPosition, dimensions, centerOffset2, rows, cloumns, heights)
    xlPos.giveGridWorldAndModelPosition3D(vadoseZoneCell.spreadArea)
    xlGeo = new XLBoxGeometry(centerPosition, dimensions)
    xlGeo.initBoxPosition3D(centerOffset2, rows, cloumns, heights)
    xlGeo.boxEntitiesStyle = {
        material: Cesium.Color.AZURE.withAlpha(0.1),
    }
    xlGeo.generateByEntities()
}

//初始化、生成潜水层元胞网格
function initGdwaterCell(){
    gdwaterLevelCell = new GdwaterLevelCell(waterLevel, waterVeloty, rows, cloumns, dimensions) 
    xlPosGdwater = new XLPosition(centerPosition, dimensions, centerOffset3, rows, cloumns, heights)
    xlPosGdwater.giveGridWorldAndModelPosition3D(gdwaterLevelCell.spreadArea)
    xlGeoGdwater = new XLBoxGeometry(centerPosition, dimensions)
    xlGeoGdwater.initBoxPosition(centerOffset3, rows, cloumns)
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
    initVadoseCell();
    initGdwaterCell();
    xlGeo.setView([-75.59777, 40.03883])

    xlEchart = new XLEchart(document.getElementById('echart'), cloumns, rows, heights)

    compeleted = true
}

//地表初始化粒子系统
async function initParticle(){
    xlPar = new XLBoxParticle(centerPosition, dimensions,centerOffset1)
    xlPar.maxDistance = 0.1
    xlPar.speedRatio = 0.5
    xlPar.particleStyle.particleNumber = 500
    xlPar.massRatio = 5 //代表污染物浓度的粒子个数比率
    xlPar.generateCoupling();
    await xlPar.hasCompleted() //等待获取粒子对象
    surfaceCell.isPollutedArea[0].particlePool = Array.from(xlPar.particles)
}

//地表生成流动线、质量更新、粒子飞行
function surfaceSimulate(){
    let isPollutedArea = Array.from(surfaceCell.isPollutedArea) //当前污染区
    for (const currentPollutedGrid of isPollutedArea) {
        let nextPollutedArea = surfaceCell.computerCellMass(currentPollutedGrid)
        if (nextPollutedArea.length == 0) {
            continue
        }
     
        for (let j = 0; j < nextPollutedArea.length; j++) {
            if (!nextPollutedArea[j].isTrailPloy) { //是否生成过流动线
                xlGeoSurface.generateTrailPloyline(currentPollutedGrid.worldPosition, nextPollutedArea[j].worldPosition) //生成流动线
                nextPollutedArea[j].isTrailPloy = true
            }
            //粒子模拟
            // particleSimulate(currentPollutedGrid, nextPollutedArea[j])
            xlPar.particleSimulate(currentPollutedGrid, nextPollutedArea[j],surfaceCell.spreadArea)
        }
        xlGeoSurface._TrailPloyLineColor = Cesium.Color.fromRandom() //每往外扩散一层，流动线变换一次颜色
    }
}

//主函数
async function simulate(){
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    if (time == 0) await initParticle();
    surfaceSimulate()
    time++;
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
        xlEchart.setDataAndUpdate([...echartPosition, element.cellMass,element.cellOncentration])
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
           $('#paramDrag').prop('checked',true)

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
        }else{
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
        }else {
            $("#parametersPanel").draggable('disable');
        }
    });
})