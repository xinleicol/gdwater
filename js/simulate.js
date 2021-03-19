import XLBoxGeometry from './utils/XLBoxGeometry.js'
import XLBoxParticle from './utils/XLBoxParticle.js'
import XLBoxPosition from './utils/XLBoxPosition.js'
import XLBoxFun from './utils/XLBoxFun.js'
import XLComputer from './utils/XLComputer.js'

let dimensions = new Cesium.Cartesian3(100000.0, 100000.0, 50000.0)
let centerPoint = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
let offsets = [
    new Cesium.Cartesian3(0.0, 0.0, 50000.0),
    new Cesium.Cartesian3(100000.0, 0.0, 50000.0),
    new Cesium.Cartesian3(100000.0, 100000.0, 50000.0),
    new Cesium.Cartesian3(-100000.0, 100000.0, 50000.0),
    new Cesium.Cartesian3(0.0, 100000.0, 50000.0),
    new Cesium.Cartesian3(-100000.0, 0.0, 50000.0),
    new Cesium.Cartesian3(-100000.0, -100000.0, 50000.0),
    new Cesium.Cartesian3(0.0, -100000.0, 50000.0),
    new Cesium.Cartesian3(100000.0, -100000.0, 50000.0)]

let XLGeo = new XLBoxGeometry(centerPoint,dimensions,offsets)
XLGeo.generate()

let XLPar = new XLBoxParticle(centerPoint,offsets[0])
XLPar.generate()
let particleSystem = XLPar.particleSystem


let XLPos = new XLBoxPosition(offsets[0],dimensions.x,dimensions.y,dimensions.z)
let leftButtom = XLPos.twoPositions.leftButtom
let rightTop = XLPos.twoPositions.rightTop

let XLFun = new XLBoxFun(centerPoint,leftButtom,rightTop)
let updateFun = XLFun.generateFun()
XLPar.updateFun(updateFun)



let heightMatrix = [
[82,82,	82,	82,	82,	81,	80,	78,	76],
[82,83,	84,	84,	84,	83,	81,	80,	77],
[82,84,	85,	85,	85,	85,	83,	82,	79],
[82,85,	86,	86,	86,	86,	85,	83,	81],
[82,85,	86,	87,	87,	87,	85,	84,	82],
[82,85,	86,	87,	87,	87,	86,	85,	84],
[81,84,	85,	86,	87,	87,	87,	86,	85],
[81,84,	85,	86,	87,	87,	87,	86,	85],
[79,83,	84,	85,	86,	86,	86,	86,	86]
]
   
    
let mass = [ 
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,100,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0]
]


let XLCom = new XLComputer(heightMatrix,mass)
function main() {
    for (let i = 0; i < 4; i++) {
        let isPollutedArea = XLCom.isPollutedArea//当前污染区
        gotoIterate(isPollutedArea)//计算下个时刻污染物质量

        XLCom.updateCellMass()//更新当前粒子质量
    }
    
}
//main()

/**
 * 计算每个污染源的t+1时刻污染质量
 * @param {已经被污染的粒子区域数组} isPollutedArea 
 */
function gotoIterate(isPollutedArea){
    for (const currentPollutedGrid of isPollutedArea) {
        let currentPosition = currentPollutedGrid.position
        let updateSpreadArea = XLCom.computerCellMass(currentPosition[0],currentPosition[1])
        if (updateSpreadArea.length != 0) {//含有蔓延的污染源
            let currentModelPosition = XLCom.convertToModelPosition(currentPosition,dimensions)
            let currentWorldPosition = XLPar.computerWorldPositionFromCenter(currentModelPosition,centerPoint)
            for (const updatePollutedGrid of updateSpreadArea) {
                if (XLCom.heightIsLess(updatePollutedGrid,currentPollutedGrid)) {
                    let nextPosition = updatePollutedGrid.position
                    let nextModelPosition = XLCom.convertToModelPosition(nextPosition,dimensions)
                    let nextWorldPosition = XLPar.computerWorldPositionFromCenter(nextModelPosition,centerPoint)
                    //添加箭头
                }
            }
        }
    }
}

// let particles = await XLPar.hasCompleted(particleSystem)
// console.log('zhijie,,,');

// scene.primitives.add(
//         new Cesium.DebugModelMatrixPrimitive({
//             modelMatrix: XLPar._modelMatrix,
//             length: 2000000.0,
//         })
// );