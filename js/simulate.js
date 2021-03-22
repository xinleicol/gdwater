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
    new Cesium.Cartesian3(100000.0, -100000.0, 50000.0)]//(废弃)

let XLGeo = new XLBoxGeometry(centerPoint,dimensions)
let offset = new Cesium.Cartesian3(0.0, 0.0, 50000.0)
XLGeo.initBoxPosition(offset,9,9)
XLGeo.generate()


let XLPos = new XLBoxPosition(offsets[0],dimensions.x,dimensions.y,dimensions.z)
let leftButtom = XLPos.twoPositions.leftButtom
let rightTop = XLPos.twoPositions.rightTop

// let XLFun = new XLBoxFun(centerPoint,leftButtom,rightTop)
// let updateFun = XLFun.generateFun()
// XLPar.updateFun(updateFun)



let heightMatrix = [
[82,82,	82,	82,	82,	81,	80,	78,	76],
[82,83,	84,	84,	84,	83,	81,	80,	77],
[82,84,	85,	85,	85,	85,	83,	82,	79],
[82,85,	86,	86,	86,	86,	85,	83,	81],
[82,85,	86,	87,	87,	87,	85,	84,	82],
[82,85,	86,	87,	88,	87,	86,	85,	84],
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


let XLPar = new XLBoxParticle(centerPoint,offset)
let XLCom = new XLComputer(heightMatrix,mass)
var particles = undefined //存放所有的粒子数组

/**
 * 初始化污染元胞粒子，得到所有的粒子数组
 */
async function init() {
    XLPar.generate() 
    await XLPar.hasCompleted(XLPar.particleSystem)
    particles = XLPar.particles
}

/**
 * 
 * @returns 主程序入口，包括粒子模拟过程、流动线生成等
 */
function main() {
    if (!particles) {return}
    XLCom.isPollutedArea[0].particlePool = Array.from(particles) //给当前污染元胞添加粒子池(记得优化)

    let modelMatrix = XLGeo._modelMatrix //模型矩阵
    for (let i = 0; i < 5; i++) {
        let isPollutedArea =  Array.from(XLCom.isPollutedArea)//当前污染区
        for (const currentPollutedGrid of isPollutedArea) {
            let nextPollutedArea = XLCom.computerCellMass(currentPollutedGrid)
            if (nextPollutedArea.length == 0) {
                continue
            }
            let startModelPositon = XLCom.convertToModelPosition(currentPollutedGrid.position,dimensions,offset)
            let startWorldPositon = XLGeo.computerWorldPosition(startModelPositon,modelMatrix)
            for (let j = 0; j < nextPollutedArea.length; j++) {
                let endModelPositon = XLCom.convertToModelPosition(nextPollutedArea[j].position,dimensions,offset)
                let endWorldPositon = XLGeo.computerWorldPosition(endModelPositon,modelMatrix)
                //生成流动线
                XLGeo.generateTrailPloyLine(startWorldPositon,endWorldPositon) 

                //粒子模拟
               // particleSimulate(currentPollutedGrid,nextPollutedArea[j],endModelPositon,modelMatrix)
            }
            XLGeo._TrailPloyLineColor =  Cesium.Color.fromRandom () //每往外扩散一层，流动线变换一次颜色
        }

    }
    
}

/**
 * 模拟粒子飞行
 * @param {当前污染的元胞} currentPollutedGrid 
 * @param {被该元胞污染的下层元胞} nextPollutedGrid 
 * @param {粒子飞行的模型终点坐标} endModelPositon 
 * @param {旋转变化矩阵} modelMatrix 
 */
function particleSimulate(currentPollutedGrid,nextPollutedGrid,endModelPositon,modelMatrix) {
   let particlePool = nextPollutedGrid.particlePool
   if (particlePool.length != 0 ) { //当前元胞粒子池中有粒子
        let len = particlePool.length
       let mass = nextPollutedGrid.cellMass
       let massFormate = Math.ceil(mass)
       if (massFormate > len) {
           let catchParticleNum = massFormate - len
           particleCatch(currentPollutedGrid,nextPollutedGrid,catchParticleNum,endModelPositon,modelMatrix)
       }
   }else{ //无粒子
        let mass = nextPollutedGrid.cellMass
        let massFormate = Math.ceil(mass)
        particleCatch(currentPollutedGrid,nextPollutedGrid,massFormate,endModelPositon,modelMatrix)
   }
}
// particleSimulate()

/**
 * 从父节点拿元胞粒子，飞行模拟，父节点再从父节点拿去，迭代
 * @param {当前污染元胞} currentPollutedGrid 
 * @param {下一个被污染的元胞} nextPollutedGrid 
 * @param {需要运动的粒子个数} catchParticleNum 
 * @param {终点的模型坐标} endModelPositon 
 * @param {模型矩阵} modelMatrix 
 */
function particleCatch(currentPollutedGrid,nextPollutedGrid,catchParticleNum,endModelPositon,modelMatrix) {
    let particlePool = currentPollutedGrid.particlePool
    if (particlePool.length != 0 ) {
        for (let i = 0; i < catchParticleNum; i++) {
            let particle = particlePool.pop() //起始点元胞粒子池删除该粒子
            nextPollutedGrid.particlePool.push(particle) //终点元胞粒子池中添加粒子
            if (i == 0) {
                let endWorldPositon = XLGeo.computerWorldPosition(endModelPositon,modelMatrix)
                catchOriginParticle(particle,XLPar.particleSystem,endWorldPositon) //添加终点位置
            }else{ // 给粒子添加偏移，不然都去终点，粒子会重合
                let offsetMultipy = Cesium.Math.randomBetween(0, 0.3)
                let offset = Cesium.Cartesian3.multiplyByScalar(dimensions,offsetMultipy,new Cesium.Cartesian3())
                let endModelPositonScrach = Cesium.Cartesian3.add(endModelPositon,offset,new Cesium.Cartesian3())
                let endWorldPositon = XLGeo.computerWorldPosition(endModelPositonScrach,modelMatrix)
                catchOriginParticle(particle,XLPar.particleSystem,endWorldPositon)
            }
        }
        
    }
}

/**
 * 
 * @param {粒子对象} particle 
 * @param {粒子系统对象} system 
 * @param {飞行终点的世界坐标} endWorldPositon 
 */
function catchOriginParticle(particle,system,endWorldPositon) { //获取粒子池中的粒子,给粒子添加终点位置
    system._Particles[particle.id].endPosition = endWorldPositon
}


/**
 * 计算每个污染源的t+1时刻污染质量（废弃）
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

//监听控件点击事件
document.getElementById('start').addEventListener("click", main)
document.getElementById('init').addEventListener("click", init)
// scene.primitives.add(
//         new Cesium.DebugModelMatrixPrimitive({
//             modelMatrix: XLPar._modelMatrix,
//             length: 2000000.0,
//         })
// );