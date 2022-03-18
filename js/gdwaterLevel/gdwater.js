import GdwaterLevelCell from "../cells/GdwaterLevelCell.js";
import ComputerGdwater from "../utils/computer/ComputerGdwater.js";
import Splite from "../utils/dispose/Splite.js";


let computerGdwater2;
let func;
let splite;

async function main(type='water',israndom=false, number=2, isPause=false){

    viewer.terrainProvider = Cesium.createWorldTerrain()

    // 相机碰撞检测
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    
    // 地形深度检测
    viewer.scene.globe.depthTestAgainstTerrain = false

    splite = new Splite(2,2)
    splite.setCellSize(5,5)
    splite.dispose()

    const [rec, rectangleCellDao, recdaos] = [splite._rectangle, splite._rectangleCellDao, splite._recdaos]

    // 正常水位矩形
    const computerGdwater = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const conerMatrix = await computerGdwater.getlevelMatrix()
    // computerGdwater.generate(conerMatrix)

    // 水位夸大后的矩形 
    computerGdwater2 = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const style = {
        material: Cesium.Color.BLUE.withAlpha(0.6),
        type : 'exag-gdwater-polygon',
    }
    const newMatrix = computerGdwater2.exaggerateWater(conerMatrix,  20)
    computerGdwater2.setStyle(style)
    computerGdwater2.generate(newMatrix,false)

    // 污染渐变矩形
    const computerGdwater3 = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const style3 = {
        type : 'pollution-gdwater-polygon',
        show: false,
    }
    computerGdwater3.setStyle(style3)
    computerGdwater3.generate(newMatrix,false)
    
    // 扩散，变成矩形个数
    rectangleCellDao.xNumber -= 2
    rectangleCellDao.yNumber -= 2
    const {
        waterMatrix
    } = await computerGdwater3.getWaterMatrix(rectangleCellDao, recdaos)
    const gdwaterCell = new GdwaterLevelCell(waterMatrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber, new Cesium.Cartesian2(rectangleCellDao.length, rectangleCellDao.width))
    
    // 设置污染源
    if(israndom){
        for (let i = 0; i < number; i++) {
            let x = Math.floor(rectangleCellDao.xNumber * Math.random()) 
            let y = Math.floor(rectangleCellDao.yNumber * Math.random()) 
            gdwaterCell.setPollutantMass(x,y,1000);
        }
    }else{
        gdwaterCell.setPollutantMass(parseInt(rectangleCellDao.xNumber/2),
        parseInt(rectangleCellDao.yNumber/2), 1000);
    }
    computerGdwater3.updateColor(gdwaterCell.isPollutedArea)

    //gdwaterCell.updateCellMassForMole
    let infun1 = gdwaterCell.updateCellMass;
    let infun2;
    if(type === 'mole'){
        infun1 = gdwaterCell.updateCellMassForMole
    }else if(type === 'water and mole'){
        infun1 = gdwaterCell.updateCellMass;
        infun2 = gdwaterCell.updateCellMassForMole
    }
    func = computer(gdwaterCell, computerGdwater3, infun1, infun2, 2000);
    func(isPause);
    // viewer.scene.postUpdate.addEventListener(func) 
}


/**
 * 指定时间计算一次
 * @param {cell} vadoseZoneCell 
 * @param {计算} computerVadoseDao2 
 * @returns 
 */
 function computer(gdwaterCell, computerGdwater, func, func2,time){
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
                console.log(nextPollutedArea.length);
                computerGdwater.updateColor(gdwaterCell.isPollutedArea)

                if(func2){
                    func2.call(gdwaterCell)
                    nextPollutedArea = gdwaterCell.nextPollutedArea
                    console.log(nextPollutedArea.length);
                    computerGdwater.updateColor(gdwaterCell.isPollutedArea)
                }
                
                if(nextPollutedArea.length === 0) clearInterval(timer) 
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
    computerGdwater2.show($(this).children("input").prop('checked'))
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
    viewer.dataSources.removeAll();
    splite.enableClip(false)
});
