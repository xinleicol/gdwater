import SurfaceCell from "../cells/SurfaceCell.js";
import PollutedCellDao from "../Dao/PollutedCellDao.js";
import RectangleCellDao from "../Dao/RectangleCellDao.js";
import WithTime from "./withTime.js";
import BoundingBox from "../utils/base/BoundingBox.js";
import BoundingRectangle from "../utils/base/BoundingRectangle.js";
import ComputerColor from "../utils/computer/ComputerColor.js";
import ComputerRectangle from "../utils/computer/ComputerRectangles.js";
import RectangleClip from "../utils/dispose/RectangleClip.js";
import AddRectangle from "../utils/entity/AddRectangle.js";
import BaiduImageryProvider from "../utils/imagery/provider/BaiduImageryProvider.js";
import TencentImageryProvider from "../utils/imagery/provider/TencentImageryProvider.js";
import HeightMatrix from "../utils/transform/HeightMatrix.js";
import Middleware from "./middleware.js";


let middleware;
let oldTime;
let runTime;
let surfaceCell;
let withTime;
let boundingPositions = [
    [118.74304049607636, 32.248946734660244],
    [118.74306031151373, 32.24847724074635],
    [118.7435861153137, 32.24848736363488],
    [118.74383712601325, 32.2489590713677],
    [118.74349086211912, 32.24907215014732],
];


/**
 * 
 * @param {元胞大小} size 
 * @param {是否生成划分网格} flag 
 * @returns 
 */
async function init(size=[1,1], flag=true) {
    viewer.terrainProvider = Cesium.createWorldTerrain()
    // viewer.scene.globe.terrainExaggeration = 2

    //中间件
    middleware = new Middleware(viewer)//boundingPositions

    // 设置参数
    middleware.size = size

    await middleware.computer(flag);

    
    // alert('初始化完成！')
    
    return middleware;
}


function main(isSleep = true, number, time) {
    if (!middleware) {
        alert('请先初始化！');
        return;
    }

    // 变量
    let computerRectangle = middleware.computerRectangle;
    let rectangleCellDao = middleware.rectangleCellDao;
    let matrix = middleware.matrix;

    // 元胞类
    // 取参数
    let rain, raintime, rainout;
    if (surfaceCell) {
        [rain, raintime, rainout] = surfaceCell.getRain();
    }

    surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);
    let pollutedCellDao = new PollutedCellDao([Math.floor(rectangleCellDao.xNumber / 2), Math.floor(rectangleCellDao.yNumber / 2)], 100);
    surfaceCell.setPollutedSourceCell(
        pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    )

    // 设置参数
    surfaceCell.setRain(rain, raintime, rainout);
    surfaceCell.verKdiff = 3.96
    surfaceCell.fre = 0.8274;
    // surfaceCell.n = 0.012;
    surfaceCell.isRain = true;


    // 时间扩散
    withTime = new WithTime(computerRectangle, new AddRectangle(), new ComputerColor(), surfaceCell, 'simulateOneStep');
    withTime.simulateWithTime(isSleep, number, time);

    if (isSleep) {
        oldTime = Date.now();
        showTime()
    }
}


function rainTime(time) {
    if (!middleware) {
        alert('请先初始化！');
        return;
    }

    // 变量
    let computerRectangle = middleware.computerRectangle;
    let rectangleCellDao = middleware.rectangleCellDao;
    let matrix = middleware.matrix;

    // 元胞类
    // 取参数
    let rain, raintime, rainout;
    if (surfaceCell) {
        [rain, raintime, rainout] = surfaceCell.getRain();
    }

    surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);
    let pollutedCellDao = new PollutedCellDao(
        [Math.floor(rectangleCellDao.xNumber / 2), Math.floor(rectangleCellDao.yNumber / 2)],
        1000
    );
    surfaceCell.setPollutedSourceCell(
        pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    )

    // 设置参数
    surfaceCell.verKdiff = 3.96
    surfaceCell.fre = 0.8274;
    // surfaceCell.n = 0.012;

    // 时间扩散
    withTime = new WithTime(computerRectangle, new AddRectangle(), new ComputerColor(), surfaceCell, 'simulateOneStepWithRainTime');
    if (time) {
        withTime.simulateWithRainTime(time);
        return;
    }
    withTime.simulateByStep(1);
}



function showTime() {
    runTime = (Date.now() - oldTime) / 1000 / 60; //分钟
    runTime = runTime.toFixed(2);
    document.getElementById('time').innerText = runTime + "min"
    requestAnimationFrame(showTime);
}



function simulateByStep(step) {
    if (!middleware) {
        alert('请先初始化！');
        return;
    }

    if (withTime) {
        withTime.simulateByStep(step);
        return;
    }

    // 变量
    let computerRectangle = middleware.computerRectangle;
    let rectangleCellDao = middleware.rectangleCellDao;
    let matrix = middleware.matrix;

    // 元胞类 
    surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, rectangleCellDao.length, rectangleCellDao.width);
    let pollutedCellDao = new PollutedCellDao(
        [Math.floor(rectangleCellDao.xNumber / 2), Math.floor(rectangleCellDao.yNumber / 2)],
        1000
    );
    surfaceCell.setPollutedSourceCell(
        pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    )

    // 设置参数
    // surfaceCell.n = 0.012;
    surfaceCell.isRain = true;


    // 时间扩散
    withTime = new WithTime(computerRectangle, new AddRectangle(), new ComputerColor(), surfaceCell, 'simulateOneStep');
    withTime.simulateByStep(step);

    return {withTime, surfaceCell};
}




$('#init').click(function (e) {
    e.preventDefault();
    init();
});
$('#simulate').click(function (e) {
    e.preventDefault();
    main();
});
$('#set-view').click(function (e) {
    e.preventDefault();
    if (middleware) {
        middleware.setView();
    }
});
$('#rectangle-division').click(function (e) {
    let isPause = $(this).children("input").prop('checked')
    if (middleware) {
        middleware.showDivision(isPause);
    }
});
$('#show-terrain').click(function (e) {
    if ($(this).children("input").prop('checked')) {
        viewer.terrainProvider = Cesium.createWorldTerrain()
    } else {
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
    }
});
$('#reset').click(function (e) {
    if (withTime) {
        withTime.clearAll();
    }
    withTime = null;
    surfaceCell = null;
    viewer.dataSources.removeAll();
});
$('#simulate-with-time').click(function (e) {
    e.preventDefault();
    main(false, undefined, $('#time-text').val());
});
$('#time-range').change(function (e) {
    e.preventDefault();
    $('#time-text').val($(this).val())
});
$('#number-range').change(function (e) {
    e.preventDefault();
    $('#number-text').val($(this).val())
});
$('#simulate-with-number').click(function (e) {
    e.preventDefault();
    main(false, $('#number-text').val());
});
$('#set-rain-param').click(function (e) {
    e.preventDefault();
    if (surfaceCell) {
        surfaceCell.setRain($('#rain-text').val(), $('#rain-time-text').val(), $('#rain-out-text').val())
        alert('修改成功！')
    }
})

$('#rain-time-time-range').change(function (e) {
    e.preventDefault();
    $('#rain-time-time-text').val($(this).val())
});
$('#rain-time-time').click(function (e) {
    e.preventDefault();
    rainTime(Number($('#rain-time-time-text').val()));
});

$('#step-range').change(function (e) {
    e.preventDefault();
    $('#step-text').val($(this).val())
});
$('#step-cli').click(function (e) {
    e.preventDefault();
    simulateByStep(Number($('#step-text').val()));
});

$('#random-color').click(function (e) { 
    e.preventDefault();
    withTime.randomColor();
});