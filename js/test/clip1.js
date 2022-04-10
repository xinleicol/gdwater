import SurfaceCell from "../cells/SurfaceCell.js";
import Middleware from "../coupling/middleware.js";
import PollutedCellDao from "../Dao/PollutedCellDao.js";
import WithTime from "../surface/withTime.js";
import ComputerColor from "../utils/computer/ComputerColor.js";
import AddRectangle from "../utils/entity/AddRectangle.js";


const boundingPositions = [
    [118.74304049607636, 32.248946734660244],
    [118.74306031151373, 32.24847724074635],
    [118.7435861153137, 32.24848736363488],
    [118.74383712601325, 32.2489590713677],
    [118.74349086211912, 32.24907215014732],
];
const xlparam = {
    middleware:null,
    size:[1,1],
    withTime:null,

}


async function init() {

    // viewer.scene.globe.terrainExaggeration = 2
    const middleware = new Middleware(viewer, boundingPositions)
    const size = xlparam.size;
    
    // 设置参数
    middleware.size = size
    
    await middleware.computer();

    xlparam.middleware = middleware;

}


function main() {
    const middleware = xlparam.middleware;
    if (!middleware) {
        alert('请先初始化！');
        return;
    }

    // 变量
    let computerRectangle = middleware.computerRectangle;
    let rectangleCellDao = middleware.rectangleCellDao;
    let matrix = middleware.matrix;


    const surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);
    let pollutedCellDao = new PollutedCellDao(
        [Math.floor(rectangleCellDao.xNumber / 2), Math.floor(rectangleCellDao.yNumber / 2)],
        1000);
    surfaceCell.setPollutedSourceCell(
        pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    )

    // 设置参数
    // surfaceCell.verKdiff = 3.96;
    surfaceCell.verKdiff = 0;
    // surfaceCell.fre = 0.8274;
    surfaceCell.n = 0.012;
    surfaceCell.isRain = true;


    // 时间扩散
    const withTime = new WithTime(computerRectangle, new AddRectangle(), new ComputerColor(), surfaceCell, 'simulateOneStep');
    withTime.simulateWithTime(false, 18, null);

    xlparam.withTime = withTime;
}



document.getElementById('init-btn').onclick = init;
document.getElementById('simulate-btn').onclick = main;
document.getElementById('show-cells').onclick = function(){
    if(this.checked){
        if(xlparam.withTime){
            xlparam.withTime.isShow(true);
        }
    }else{
        if(xlparam.withTime){
            xlparam.withTime.isShow(false);
        }
    }
}
  

