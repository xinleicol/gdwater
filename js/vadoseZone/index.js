
import VadoseZoneCell from "../cells/VadoseZoneCell.js";
import ComputerGdwater from "../utils/computer/ComputerGdwater.js";
import ComputerVadoseDao from "../utils/computer/ComputerVadoseDao.js";
import Splite from "../utils/dispose/Splite.js";
import GdwaterLevelMatrix from "../utils/transform/GdwaterLevelMatrix.js";
import HeightMatrix from "../utils/transform/HeightMatrix.js";

let boundingPositions = [
    [118.7426057038760, 32.2504552130810],
    [118.7429255928240, 32.2497469657935],
    [118.7433262661830, 32.2499205123251],
    [118.7440610544440, 32.2503070328395],
    [118.7434864037540, 32.2510766586447],
    [118.7432226284700, 32.2509838788282],
];

/**
 * 求二维数组的最大值最小值
 * @param 二维数组{} matrix
 * ，fun max || min 
 * @returns 最大小值
 */
function maxmin(matrix, fun = 'max') {
    let arr = matrix.map(element => {
        return Math[fun].apply(null, element)
    })
    let res = Math[fun].apply(null, arr)
    return res;
}




/**
 * 
 * @param {最大高度} max 
 * @param {小} min 
 * @param {一个网格高度} zlength 
 * @returns 网格数量
 */
function getHNumber(max, min, zlength) {
    return Math.floor((max - min) / zlength) + 1
}


let computerVadoseDao, computerVadoseDao2, vadoseZoneCell, splite, func;
async function main(isPause = false, isRandom = false, number = 3) {
    // 地形
    viewer.terrainProvider = Cesium.createWorldTerrain();
    // 地形夸张
    // viewer.scene.globe.terrainExaggeration = 2

    // 深度检测
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // 计算开挖
    splite = new Splite(0, 0, boundingPositions)
    splite.setCellSize(5.0, 5.0)//更改元胞大小
    splite.dispose()
    const [rec, rectangleCellDao, recdaos] = [splite._rectangle, splite._rectangleCellDao, splite._recdaos]

    // 高度水位矩阵
    const {
        heightMatrix,
        waterMatrix
    } = await splite.getMatrix(splite.cellSize);
    let maxHeight = maxmin(heightMatrix)
    let minWater = maxmin(waterMatrix, 'min') //便于观察，水位下降10

    // 生成元胞网格
    // computerVadoseDao = new ComputerVadoseDao(rectangleCellDao.xNumber, rectangleCellDao.yNumber, hNumber,maxHeight-minWater);
    // computerVadoseDao.computer()
    // computerVadoseDao.generate(true)

    // 生成包围盒
    splite.generateBoundingBox(maxHeight, minWater, false);

    // 生成网格
    let hNumber = getHNumber(maxHeight, minWater, 1) //更改网格高度
    computerVadoseDao2 = new ComputerVadoseDao(rec, rectangleCellDao.xNumber, rectangleCellDao.yNumber, hNumber, maxHeight - minWater)
    computerVadoseDao2.computer()
    computerVadoseDao2.generate(true)

    // 元胞类
    vadoseZoneCell = new VadoseZoneCell(waterMatrix, rectangleCellDao.yNumber,
        rectangleCellDao.xNumber, hNumber, computerVadoseDao2.dimensions, heightMatrix)
    
    // 设置污染源
    if(isRandom){
        for (let i = 0; i < number; i++) {
            let x = Math.floor(Math.random() * rectangleCellDao.xNumber);
            let y = Math.floor(Math.random() * rectangleCellDao.yNumber);
            vadoseZoneCell.setPollutantMass(x,y,1,1000)
        }
    }else{
        vadoseZoneCell.setPollutantMass(parseInt(rectangleCellDao.yNumber / 2),
        parseInt(rectangleCellDao.xNumber / 2), 1, 1000)
    }

    // vadoseZoneCell.mechanicalDispersion()
    // console.log(vadoseZoneCell.nextPollutedArea);
    // vadoseZoneCell.mechanicalDispersion
    // 扩散函数
    func = computer(vadoseZoneCell, computerVadoseDao2, vadoseZoneCell.simulate);
    func(isPause);

}

/**
 * 指定时间计算一次
 * @param {cell} vadoseZoneCell 
 * @param {计算} computerVadoseDao2 
 * @returns 
 */
function computer(vadoseZoneCell, computerVadoseDao2, func) {
    let timer;
    let nextPollutedArea;
    return function (isPause) {
        // 预处理函数 
        if (isPause) {
            clearInterval(timer)
            timer = null;
            return
        }
        if (!timer) {
            timer = setInterval(() => {
                func.call(vadoseZoneCell)
                nextPollutedArea = vadoseZoneCell.nextPollutedArea
                // console.log(nextPollutedArea.length);
                computerVadoseDao2.updateColor(vadoseZoneCell.isPollutedArea)
                if (nextPollutedArea.length === 0) clearInterval(timer)
            }, 2000);
        }
    }
}

//生成水流轨迹
function generateWaterFlow(cells, computerVadoseDao) {
    computerVadoseDao.giveCellWorldPosition(cells)
    cells.forEach(element1 => {
        element1.forEach(element2 => {
            element2.forEach(element3 => {
                if (!element3.waterFlow) return
                let [i, j, k] = element3.waterFlow
                if (k > 2) return
                let results = []
                let waterFlowCell = cells[i][j][k]
                if (element3.worldPosition && waterFlowCell.worldPosition) {
                    results.push(element3.worldPosition, waterFlowCell.worldPosition)
                    computerVadoseDao.generatePloyline(results)
                }
            })

        })

    })
}

let computerGdwater;
// 生成地下水位曲面
async function generateWater(exagValue=1) {

    const splite = new Splite(2, 2)
    splite.setCellSize(5, 5)
    splite.disposeWithoutClip()

    const [rec, rectangleCellDao, recdaos] = [splite._rectangle, splite._rectangleCellDao, splite._recdaos]

    // 正常水位曲面
    computerGdwater = new ComputerGdwater(rec, rectangleCellDao, recdaos)
    const conerMatrix = await computerGdwater.getlevelMatrix()
    
    const style = {
        material: Cesium.Color.BLUE.withAlpha(0.6),
        type : 'exag-gdwater-polygon',
    }
    const newMatrix = computerGdwater.exaggerateWater(conerMatrix,  exagValue)
    computerGdwater.setStyle(style)
    computerGdwater.generate(newMatrix,false)
}


$('#main').click(function (e) {
    e.preventDefault();
    main();
});

$('#big-show').click(function (e) {
    let f = $(this).children("input").prop('checked')
    if (splite) {
        splite.showBoundingBox(f)
    }
});
$('#small-show').click(function (e) {
    computerVadoseDao2.isShowEnitty($(this).children("input").prop('checked'));
});
$('#change-color').click(function (e) {
    e.preventDefault();
    if (computerVadoseDao2 && vadoseZoneCell) {
        computerVadoseDao2.randomColor(vadoseZoneCell.isPollutedArea)
    }
});
$('#depthTestAgainstTerrain').click(function (e) {
    let f = $(this).children("input").prop('checked')
    viewer.scene.globe.depthTestAgainstTerrain = f
});
$('#show-water-line').click(function (e) {
    let f = $(this).children("input").prop('checked')
    if (computerVadoseDao2) {
        let flag = computerVadoseDao2.isGenerate();
        if (flag) {
            computerVadoseDao2.isShowTrail(f);
        } else if (f) {
            generateWaterFlow(vadoseZoneCell.spreadArea, computerVadoseDao2)
        }
    }
});
$('#pause-main').click(function (e) {
    if (func) {
        let f = $(this).children("input").prop('checked')
        func(f);
    }
});
$('#terrain-checked').click(function (e) { 
    viewer.scene.globe.terrainExaggeration = $(this).prop('checked')
    
});
$('#terrain-exag-range').change(function (e) {
    if ($('#terrain-checked').prop('checked')) {
        $('#terrain-exag-text').val($(this).val())
        viewer.scene.globe.terrainExaggeration = $(this).val()
    }
});

$('#water-checked').click(function (e) {
    if ($(this).prop('checked')) {
        generateWater();
    }else{
        computerGdwater.clearAll();
    }
});
$('#water-exag-range').change(function (e) {
    if ($('#water-checked').prop('checked')) {  
        $('#water-exag-text').val($(this).val())
        if(computerGdwater){
            computerGdwater.clearAll();
            generateWater($(this).val())
        }
    }
});
$('#show-cell-box').click(function (e) {
    if(computerVadoseDao2){
        if(!computerVadoseDao2._xlGeoOther){
            computerVadoseDao2.generateOther();
        }else{
            computerVadoseDao2.isShowOther( $(this).children("input").prop('checked'));
        }
    }
});
$('#reset').click(function (e) { 
    e.preventDefault();
    viewer.entities.removeAll();
    if(splite){
        splite.setView();
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

$('#points-simulate').click(function (e) {  
    let isPause = $('#pause-main').children("input").prop('checked')
  main(isPause,true, $('#points-number-range').val())
});