import XLBoxGeometry from './utils/XLBoxGeometry.js'
import XLBoxParticle from './utils/XLBoxParticle.js'
import XLBoxPosition from './utils/XLBoxPosition.js'
import XLBoxFun from './utils/XLBoxFun.js'
import XLComputer from './utils/XLComputer.js'
import XLPosition from './utils/XLPosition.js'
import XLLabel from './utils/XLLabel.js'


let dimensions = new Cesium.Cartesian3(100000.0, 100000.0, 50000.0)
let centerPoint = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)

let XLGeo = new XLBoxGeometry(centerPoint, dimensions)
let centerOffset = new Cesium.Cartesian3(0.0, 0.0, 50000.0)
let boxPositons = XLGeo.initBoxPosition(centerOffset, 9, 9)
XLGeo.generate()


// let XLBoxPos = new XLBoxPosition(offsets[0],dimensions.x,dimensions.y,dimensions.z)
// let leftButtom = XLBoxPos.twoPositions.leftButtom
// let rightTop = XLBoxPos.twoPositions.rightTop

// let XLFun = new XLBoxFun(centerPoint,leftButtom,rightTop)
// let updateFun = XLFun.generateFun()
// XLPar.updateFun(updateFun)



let heightMatrix = [
    [82, 82, 82, 82, 82, 81, 80, 78, 76],
    [82, 83, 84, 84, 84, 83, 81, 80, 77],
    [82, 84, 85, 85, 85, 85, 83, 82, 79],
    [82, 85, 86, 86, 86, 86, 85, 83, 81],
    [82, 85, 86, 87, 87, 87, 85, 84, 82],
    [82, 85, 86, 87, 88, 87, 86, 85, 84],
    [81, 84, 85, 86, 87, 87, 87, 86, 85],
    [81, 84, 85, 86, 87, 87, 87, 86, 85],
    [79, 83, 84, 85, 86, 86, 86, 86, 86]
]


let mass = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 100, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
]


var XLPar = new XLBoxParticle(centerPoint, dimensions,centerOffset)
var XLCom = new XLComputer(heightMatrix, mass)
var XLPos = new XLPosition(centerPoint, dimensions, centerOffset)
var XLLab = new XLLabel(centerPoint)
var particles = undefined //存放所有的粒子数组

/**
 * 初始化污染元胞粒子，得到所有的粒子数组
 */
async function init() {
    XLPar.generate() //生成粒子
    XLPar.maxDistance = 100
    XLPar.speedRatio = 10000
    XLPos.giveGridWorldAndModelPosition(XLCom.spreadArea) //给污染区域中的网格赋予世界坐标
    await XLPar.hasCompleted() //等待获取粒子对象
    particles = XLPar.particles
    XLCom.isPollutedArea[0].particlePool = Array.from(particles) //给当前污染元胞添加粒子池(记得优化)
}


function showMassInfo() {
    XLLab.removeAll()
    let styles={
        font:'sans-serif 20px',
        pixelOffset: new Cesium.Cartesian2(5, 5),
        scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.5, 1.5e9, 0.1),
    }
    XLLab.styles = styles
    for (let i = 0; i < XLCom.spreadArea.length; i++) {
        const spreadAreaJ = XLCom.spreadArea[i]
        for (let j = 0; j < spreadAreaJ.length; j++) {
            const sigleGrid = spreadAreaJ[j]
            XLLab.gennerate(sigleGrid.worldPosition, sigleGrid.cellMass)
        }
    }
}

/**
 * 
 *  主程序入口，包括粒子模拟过程、流动线生成等
 */
function main() {
    if (!particles) {
        alert('初始化还未完成...')
        return
    }
    let isPollutedArea = Array.from(XLCom.isPollutedArea) //当前污染区

    for (const currentPollutedGrid of isPollutedArea) {
        let nextPollutedArea = XLCom.computerCellMass(currentPollutedGrid)
        if (nextPollutedArea.length == 0) {
            continue
        }
     
        for (let j = 0; j < nextPollutedArea.length; j++) {
            if (!nextPollutedArea[j].isTrailPloy) { //是否生成过流动线
                XLGeo.generateTrailPloyline(currentPollutedGrid.worldPosition, nextPollutedArea[j].worldPosition) //生成流动线
                nextPollutedArea[j].isTrailPloy = true
            }
            //粒子模拟
            // particleSimulate(currentPollutedGrid, nextPollutedArea[j])
            XLPar.particleSimulate_backpack(currentPollutedGrid, nextPollutedArea[j],XLCom.spreadArea)
        }
        XLGeo._TrailPloyLineColor = Cesium.Color.fromRandom() //每往外扩散一层，流动线变换一次颜色
    }

}

//监听控件点击事件
document.getElementById('start').addEventListener("click", main)
document.getElementById('init').addEventListener("click", init)
document.getElementById('showMassInfo').addEventListener("click", showMassInfo)
// scene.primitives.add(
//         new Cesium.DebugModelMatrixPrimitive({
//             modelMatrix: XLPar._modelMatrix,
//             length: 2000000.0,
//         })
// );