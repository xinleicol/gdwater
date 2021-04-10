/**
 *污染物潜水面扩散仿真主程序
 */
import InitCell from './InitCell.js'
import XLBoxGeometry from '../utils/XLBoxGeometry.js'
import XLLabel from '../utils/XLLabel.js'
import XLPosition from '../utils/XLPosition.js'
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

var rows = 9 //元胞行数
var cloumns = 9 //元胞列数
var heights = 9 //元胞纵数

var centerPosition = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
var dimensions = new Cesium.Cartesian3(1.0, 1.0, 1.0)
var centerOffset = new Cesium.Cartesian3(0.0, 0.0, 5.0)

var initcell = undefined //元胞网格对象
var xlPos = undefined //计算元胞位置的对象
var xlLabel = undefined //标签对象
var xlGeo = undefined //盒子流动线对象
var xlEchart = undefined //echart图表对象

var time = 0 //计数器
var compeleted = false //初始化指示
var startColor = new Cesium.Color ( 1 , 0 , 0 , 1 )
var endColor = new Cesium.Color ( 1 , 1 , 0 , 0 )
var colorDiff = Cesium.Color.subtract (startColor, endColor, new Cesium.Color()) 


// 初始化
function init() {

    if (compeleted) {
        removeLabels()
        xlGeo.removeAllBoxsByEntities()

        time = 0
        compeleted = false
        $('#diffutionNumber').text(time);
    }

    initcell = new InitCell(waterLevel, 0, rows, cloumns, heights, dimensions) //初始化元胞网格
    xlPos = new XLPosition(centerPosition, dimensions, centerOffset, rows, cloumns, heights)
    xlPos.giveGridWorldAndModelPosition3D(initcell.spreadArea)
    xlGeo = new XLBoxGeometry(centerPosition, dimensions)
    xlGeo.setView([-75.59777, 40.03883])
    xlGeo.initBoxPosition3D(centerOffset, rows, cloumns, heights)
    xlLabel = new XLLabel()
    xlEchart = new XLEchart(document.getElementById('echart'),cloumns,rows,heights)
    
    compeleted = true
}

// 对流作用
function convectionSimulate() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    doSamething()

    if (time > 0) {
        initcell.updateCellMass() //质量更新
    }

    //颜色差值更新
    let currentColor = Cesium.Color.subtract(startColor , Cesium.Color.multiplyByScalar(colorDiff , time / (time+1),new Cesium.Color()),new Cesium.Color()) //颜色差值
    let length = initcell.nextPollutedArea.length
    for (let i = 0; i < length; i++) {
        let onePollutedCell = initcell.nextPollutedArea.pop()
        xlGeo.getAndSetBoxEntites(onePollutedCell.cellPosition,currentColor) //注意网格坐标的i是坐标系中的y   
    }
    

    doSamethingAfther()
}

// 相同代码提取
function doSamething() {
    let mass = inputPollutants(time)
    if (time == 0) { //test
        initcell.setPollutantMass(4, 4, 4, 100)
        xlGeo.getAndSetBoxEntites(new Cesium.Cartesian3(0, 0, 5),startColor)
    }
}

function doSamethingAfther() {
    if ($('#massLabel').prop('checked')) {
        removeLabels()
        generateLabels()
    }

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

function updateScatter3D(){
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    initcell.isPollutedArea.forEach(element => {
        let echartPosition = xlPos.gridToEchartPosition(element.position)
        xlEchart.setDataAndUpdate([...echartPosition,element.cellMass])
    })
}

//生成元胞
function generateBoxs() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    xlGeo.boxEntitiesStyle = {
        material:  Cesium.Color.AZURE.withAlpha(0.1),
    }
    xlGeo.generateByEntities()
}

function removeBoxs() {
    xlGeo.hideAllBoxsByEntities()

}

function generateLabels() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    let labelStyle = {
        font: 'sans-serif 10px',
        fillColor: Cesium.Color.MAGENTA,
        pixelOffset: new Cesium.Cartesian2(5, 5),
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.1),
    }
    xlLabel.addlabel3D(initcell.spreadArea, 'cellMass', labelStyle)

}

function removeLabels() {
    xlLabel.removeAll()
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

    $('#convectionSimulate').click(convectionSimulate)


    $('#massLabel').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }

        if ($(this).prop("checked") == true) {
            generateLabels()
        } else {
            removeLabels()
        }
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

    $('#cellAlpha').on('input propertychange',function () { 
        $('#cellAlphaText').val( $(this).val());
        if (!compeleted) {
            alert('请先初始化...')
            return
        }
        xlGeo.changeBoxAlpha( $(this).val())      
    });

    $('#showEchart').click(function () { 
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }
        if ($(this).prop('checked')) {
            $('#echart').show()
            $( "#echart" ).draggable();
            $('#isDraggable').attr('checked', true);
        }else{
            $('#echart').hide()
        }        
    });

    $('#isDraggable').click(function () { 
        if (!xlType.xlAlert(compeleted, '请先初始化...')) return
        if ($(this).prop('checked')) {
            $( "#echart" ).draggable({
                disabled: false
            });
        }else{
            $( "#echart" ).draggable('disable');
        }
    });

})