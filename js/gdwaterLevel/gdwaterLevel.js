/**
 *污染物潜水面扩散仿真主程序
 */
import InitCell from './InitCell.js'
import XLBoxGeometry from '../utils/XLBoxGeometry.js'
import XLLabel from '../utils/XLLabel.js'
import XLPosition from '../utils/XLPosition.js'
import xlType from '../utils/XLType.js'

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
var waterVeloty = 0.1 //流速
var centerPosition = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
var dimensions = new Cesium.Cartesian3(1.0, 1.0, 1.0)
var centerOffset = new Cesium.Cartesian3(0.0, 0.0, 5.0)

var initcell = undefined //元胞网格对象
var xlPos = undefined //计算元胞位置的对象
var xlLabel = undefined //标签对象
var xlGeo = undefined //盒子流动线对象

var time = 0 //计数器
var compeleted = false //初始化指示
var mechanicalDiffusionFlag = false //机械弥散指示
var molecularDiffusionFlag = false

// 初始化
function init() {

    if (compeleted) {
        removeLabels()
        removeWaterLine()
        removeBoxs()

        time = 0
        compeleted = false
        mechanicalDiffusionFlag = false
        molecularDiffusionFlag = false

        $('#diffutionNumber').text(time);
    }

    initcell = new InitCell(waterLevel, waterVeloty, rows, cloumns, dimensions) //初始化元胞网格
    xlPos = new XLPosition(centerPosition, dimensions, centerOffset, rows, cloumns)
    xlPos.giveGridWorldAndModelPosition(initcell.spreadArea)
    xlGeo = new XLBoxGeometry(centerPosition, dimensions)
    xlGeo.setView([-75.59777, 40.03883])
    xlGeo.initBoxPosition(centerOffset, rows, cloumns)
    xlLabel = new XLLabel()
    compeleted = true
}

// 机械扩散加分子扩散
function main() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    if (!xlType.xlAlert(!molecularDiffusionFlag, !mechanicalDiffusionFlag, '正在进行分子扩散或者机械弥散模拟...')) return
    doSamething()

    initcell.updateCellMassForMoleAndMech()
    doSamethingAfther()
}


// 机械弥散 
function mechanicalDiffusion() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    if (!xlType.xlAlert(!molecularDiffusionFlag, '正在进行分子扩散模拟...')) return
    doSamething()
    initcell.updateCellMass() // 更新质量，扩散模拟
    if (!mechanicalDiffusionFlag) {
        mechanicalDiffusionFlag = true
    }
    doSamethingAfther()

}

// 分子扩散
function molecularDiffusion() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    if (!xlType.xlAlert(!mechanicalDiffusionFlag, '正在进行机械弥散模拟...')) return
    doSamething()
    initcell.updateCellMassForMole()
    if (!molecularDiffusionFlag) {
        molecularDiffusionFlag = true
    }
    doSamethingAfther()
}

// 相同代码提取
function doSamething() {
    let mass = inputPollutants(time)
    initcell.setPollutantMass(4, 4, mass)
}

function doSamethingAfther() {
    if ($('#massLabel').prop('checked')) {
        removeLabels()
        generateLabels()
    }

    if (($('#selectBoxs').prop('checked') == true) & time == 0) {
        let selectVal = $('#boxs').val()
        if (selectVal == 'outlineBox') {
            generateOutlineBoxs()
        } else if (selectVal == 'filledBox') {
            generateFilledBoxs()
        }
    }

    $('#diffutionNumber').text(time);
    time++
}

function generateOutlineBoxs() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return

    xlGeo.attributeStyle = {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.DEEPPINK)
    }
    xlGeo.appearance = new Cesium.PerInstanceColorAppearance({
        flat: true
    })
    xlGeo.generate()
}

function generateFilledBoxs() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return

    let geometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: dimensions
    })
    xlGeo.attributeStyle = {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.MINTCREAM)
    }
    xlGeo.appearance = new Cesium.PerInstanceColorAppearance()
    xlGeo.generate(geometry)
}

function removeBoxs() {
    xlGeo.removeAllBoxs()

}

function generateLabels() {

    if (!xlType.xlAlert(compeleted, '请先初始化...')) return
    let labelStyle = {
        font: 'sans-serif 10px',
        fillColor: Cesium.Color.MAGENTA,
        pixelOffset: new Cesium.Cartesian2(5, 5),
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.1),
    }
    xlLabel.addlabel(initcell.spreadArea, 'cellMass', labelStyle)

}


function removeLabels() {
    xlLabel.removeAll()
}

function generateWaterLabel() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return

    var labelStyle = {
        font: 'sans-serif 10px',
        fillColor: Cesium.Color.BLUEVIOLET,
        pixelOffset: new Cesium.Cartesian2(7, 7),
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e8, 0.1),
    }
    xlLabel.addlabel(initcell.spreadArea, 'waterLevel', labelStyle)
}

// 生成水流线
function generateWaterLine() {
    if (!xlType.xlAlert(compeleted, '请先初始化...')) return

    let spreadArea = initcell.spreadArea
    spreadArea.forEach(element1 => {
        element1.forEach(element2 => {
            let waterFlow = element2.waterFlow
            if (waterFlow.length != 0) {
                let goalCell = spreadArea[waterFlow[0]][waterFlow[1]]
                xlGeo.generateLightingTrailPloyline(element2.worldPosition, goalCell.worldPosition)
            }
        });
    });
}

// 移除水流线
function removeWaterLine() {
    xlGeo.removeAllLightingTrailPolyline()
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

    document.getElementById('mechanicalDiffusion').addEventListener("click", mechanicalDiffusion)
    document.getElementById('init').addEventListener("click", init)

    $('#main').click(main)

    $('#molecularDiffusion').click(molecularDiffusion)

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

    $('#waterLabel').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }

        if ($(this).prop("checked") == true) {
            generateWaterLabel()
        } else {
            removeLabels()
        }
    })


    $('#waterLineCheck').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }

        if ($(this).prop("checked") == true) {
            generateWaterLine()
        } else {
            removeWaterLine()
        }
    })

    $('#selectBoxs').click(function () {
        if (!compeleted) {
            alert('请先初始化...')
            $(this).prop('checked', !$(this).prop('checked'))
            return
        }

        if ($(this).prop('checked') == true) {

            let selectVal = $('#boxs').val()
            if (selectVal == 'outlineBox') {
                generateOutlineBoxs()
            } else if (selectVal == 'filledBox') {
                generateFilledBoxs()
            }
        } else {
            removeBoxs()
        }
    });

    if ($('#selectBoxs').prop('checked') == true) {
        $('#boxs').change(function () {
            removeBoxs()
            let selectVal = $(this).val()
            if (selectVal == 'outlineBox') {
                generateOutlineBoxs()
            } else if (selectVal == 'filledBox') {
                generateFilledBoxs()
            }
        })
    } else {
        removeBoxs()
    }

})