import GdwaterLevelCell from "../cells/GdwaterLevelCell.js";
import ComputerGdwater from "../utils/computer/ComputerGdwater.js";
import Splite from "../utils/dispose/Splite.js";


let func;
let splite;

const gdwaterParam = {
    cellSize: [5,5], //元胞大小
    extendNumber : [2,2], //向右上延伸出的点位个数
    computerGdwater2: null,//地下水位夸大矩形类
    computerGdwater3: null, //污染物扩散类
}

async function main(type='water',israndom=false, number=2, isPause=false){

    viewer.terrainProvider = Cesium.createWorldTerrain()

    // 相机碰撞检测
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    
    // 地形深度检测
    viewer.scene.globe.depthTestAgainstTerrain = false

    const cellSize = gdwaterParam.cellSize;
    const extendNumber = gdwaterParam.extendNumber;
    splite = new Splite(extendNumber[0], extendNumber[1]);
    splite.setCellSize(cellSize[0], cellSize[1]);
    splite.dispose()

    // 固定视角
    splite.lookAt();

    const [rec, rectangleCellDao, recdaos] = [splite._rectangle, splite._rectangleCellDao, splite._recdaos]

    // 正常水位矩形
    const computerGdwater = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const conerMatrix = await computerGdwater.getlevelMatrix()
    // computerGdwater.generate(conerMatrix)

    // 水位夸大后的矩形 
    let computerGdwater2 = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const style = {
        material: Cesium.Color.fromCssColorString('#005C97').withAlpha(0.6),
        type : 'exag-gdwater-polygon',
    }
    const newMatrix = computerGdwater2.exaggerateWater(conerMatrix,  20)
    computerGdwater2.setStyle(style)
    computerGdwater2.generate(newMatrix,false)

    // 污染渐变矩形
    let computerGdwater3 = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const style3 = {
        type : 'pollution-gdwater-polygon',
        show: false,
    }
    computerGdwater3.setStyle(style3)
    computerGdwater3.generate(newMatrix,true)
    
    // 扩散，变成矩形个数
    const {
        waterMatrix
    } = await computerGdwater3.getWaterMatrix(rectangleCellDao, recdaos)
    const xNumber = rectangleCellDao.xNumber - rectangleCellDao.ex;
    const yNumber = rectangleCellDao.yNumber - rectangleCellDao.ey;
    const gdwaterCell = new GdwaterLevelCell(
        waterMatrix, 
        xNumber, 
        yNumber,
        new Cesium.Cartesian2(rectangleCellDao.length, rectangleCellDao.width)
    )
    
    // 设置污染源
    if(israndom){
        for (let i = 0; i < number; i++) {
            let x = Math.floor(xNumber * Math.random()) 
            let y = Math.floor(yNumber * Math.random()) 
            gdwaterCell.setPollutantMass(x,y,1000);
        }
    }else{
        gdwaterCell.setPollutantMass(parseInt(rectangleCellDao.xNumber/2),
        parseInt(rectangleCellDao.yNumber/2), 1000);
    }
    computerGdwater3.updateColor(gdwaterCell.isPollutedArea)

    //gdwaterCell.updateCellMassForMole
    let infun1 = gdwaterCell.updateCellMass;
    if(type === 'mole'){
        infun1 = gdwaterCell.updateCellMassForMole
    }else if(type === 'water and mole'){
        infun1 = gdwaterCell.updateCellMassForMoleAndMech;
    }
    func = computer(gdwaterCell, computerGdwater3, infun1, 2000);
    func(isPause);
    // viewer.scene.postUpdate.addEventListener(func) 

    // 赋值
    gdwaterParam.computerGdwater2 = computerGdwater2;
    gdwaterParam.computerGdwater3 = computerGdwater3;
}


/**
 * 指定时间计算一次
 * @param {cell} vadoseZoneCell 
 * @param {计算} computerVadoseDao2 
 * @returns 
 */
 function computer(gdwaterCell, computerGdwater, func,time){
    let timer;
    let nextPollutedArea;
    return function(isPause){  
         // 预处理函数 
        if(isPause) {
            clearInterval(timer)
            timer = null;
            return
        }
        if(!timer){
            timer = setInterval(() => {
                func.call(gdwaterCell)
                nextPollutedArea = gdwaterCell.nextPollutedArea
                // console.log(nextPollutedArea.length);
                // console.log(gdwaterCell.isPollutedArea);
                computerGdwater.updateColor(gdwaterCell.isPollutedArea)
            }, time);
        }
    }
}


$('#water').click(function (e) {
    e.preventDefault();
    main();
});
$('#mole').click(function (e) {
    e.preventDefault();
    main('mole');
});
$('#water-mole').click(function (e) {
    e.preventDefault();
    main('water and mole');
});
$('#show-water-button').click(function (e) { 
    if(gdwaterParam.computerGdwater2){
        gdwaterParam.computerGdwater2.show($(this).children("input").prop('checked'))
    }
});
$('#show-depth-button').click(function (e) { 
    viewer.scene.globe.depthTestAgainstTerrain = $(this).children("input").prop('checked')
});
$('#continue-simulate').click(function (e) { 
    let isPause = $(this).children("input").prop('checked')
    func(!isPause)
});
$('#set-view').click(function (e) { 
    if(splite){
        splite.setView();
    }
});
$('#show-imagery-layers').click(function (e) { 
    let layers = viewer.imageryLayers
    for (let i = 0; i < layers.length; i++) {
        layers.get(i).show = $(this).children("input").prop('checked')
    }
});
$('#show-terrain').click(function (e) { 
    if($(this).children("input").prop('checked')){
        viewer.terrainProvider = Cesium.createWorldTerrain()
    }else{
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
    }
});
$('#clip-direction').click(function (e) {  
    if($('#clip-enable').children("input").prop('checked')){   
        if(splite){
            splite.changeClipDirection();
        }
    }
});
$('#clip-enable').click(function (e) { 
    let f= $(this).children("input").prop('checked')
    splite.enableClip(f)
})
$('#points-number-range').change(function (e) { 
    e.preventDefault();
    $('#points-number-text').val($(this).val())
});
$('#multi-points-water').click(function (e) {  
    let isPause = $(this).children("input").prop('checked')
  main('water',true, $('#points-number-text').val(),isPause)
});
$('#multi-points-mole').click(function (e) {  
    let isPause = $(this).children("input").prop('checked')
    main('mole',true, $('#points-number-text').val(),isPause)
});
$('#multi-points-wm').click(function (e) {  
    let isPause = $(this).children("input").prop('checked')
    main('water and mole',true, $('#points-number-text').val(),isPause)
});
$('#reset').click(function (e) { 
    e.preventDefault();
    $('#continue-simulate').children("input").prop('checked', true)
    viewer.dataSources.removeAll();
    splite.enableClip(false)
    
});
$('#show-pollution-button').click(function (e) { 
    if(gdwaterParam.computerGdwater3){
        gdwaterParam.computerGdwater3.show($(this).children("input").prop('checked'))
    }
});
$('#look-at').click(function (e) {
    if(!splite){
        return;
    }
    if($(this).children("input").prop('checked')){
        splite.lookAt();
    }else{
        splite.cancleLookAt();
    }
    
    
});
