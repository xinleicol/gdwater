/**
 * 初始化元胞类
 * 
 */
class InitCell {
    _moleK = 1.28 * Math.pow(10, -9) //丙酮溶液分子扩散系数
    _rows = 9 //行数，Y
    _columns = 9 //列数，X
    _heights = 9 //纵数
    _halfGridX = Math.floor(this._columns / 2) // 元胞区域X方向半长
    _halfGridY = Math.floor(this._rows / 2) //元胞区域Y方向半长
    spreadArea = undefined //所有元胞对象数组
    isPollutedArea = [] //所有被污染的元胞数组
    nextPollutedArea = [] //下一时刻将被污染的元胞数组
    _dimensions = null //元胞大小
    _cellX = 0.0 //元胞x方向长度
    _cellY = 0.0 // y
    _cellZ = 0.0 //Z
    _cellDiagonal = 0.0 //斜向方向
    _moistureContentS = 0.5652 //饱和土壤体积含水率
    _moistureContentR = 0.1641 //剩余土壤体积含水率
    _paramN = 1.5003 //参数n
    _paramM = 1 - 1 / this._paramN
    _paramW = 0.12 //参数阿尔法
    _permeabilityKS = 0.50 //饱和土壤水渗透系数,m/d
    timeStep = 5 //时间步长为5秒
    constructor(waterLevel, waterVeloty, rows, columns, heights, dimensions) {
        this._waterLevel = waterLevel
        this._waterVeloty = waterVeloty
        this._dimensions = dimensions
        this._cellX = dimensions.x
        this._cellY = dimensions.y
        this._cellZ = dimensions.z
        this._cellDiagonal = Math.sqrt(Math.pow(this._cellX, 2) + Math.pow(this._cellY, 2))
        this._rows = Cesium.defaultValue(this._rows, rows)
        this._columns = Cesium.defaultValue(this._columns, columns)
        this._heights = Cesium.defaultValue(this._heights, heights)
        this._init()
    }

    /**
     * 初始化元胞空间
     */
    _init() {
        this.spreadArea = new Array(this._rows)
        for (let i = 0; i < this._rows; i++) {
            this.spreadArea[i] = new Array(this._columns)
            for (let j = 0; j < this._columns; j++) {
                this.spreadArea[i][j] = new Array(this._heights)
            }
        }
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                for (let k = 0; k < this._heights; k++) {
                    this.spreadArea[i][j][k] = {
                        'position': [i, j, k], //注意网格坐标的i是坐标系中的y
                        'cellMass': 0.0,
                        'isUpdateCellMass': 0.0,
                        'waterFlow': [], //水流方向
                        'waterLevel': this._waterLevel[i][j],
                        'moistureContent': this._setMoistureContent(this._waterLevel[i][j]), //含水率
                        'permeabilityCoeff': 0.0, //非饱和土壤水渗透系数
                        'cellSlop': null, //坡降
                        'lessWaterCells': [], //临近元胞中水位更小的元胞
                        'cellDistance': null, //流向方向上的元胞距离
                        'boundary': 'noBoundary', //边界条件
                        'isPolluted': false, //是否被污染 
                        'worldPosition': undefined, //元胞世界坐标
                        'modelPosition': undefined, //模型坐标
                        'cellPosition':undefined, //没有乘以元胞边长的模型坐标

                    }
                    if (k == 0) {
                        this.spreadArea[i][j][k].boundary = '0' //正方体最上方的那个面
                    }
                    if (i == 0) {
                        this.spreadArea[i][j][k].boundary = '1' //正方体最后方的那个面（瞬时针排序）
                    }
                    if (j == this._columns - 1) {
                        this.spreadArea[i][j][k].boundary = '2' //正方体最右方的那个面
                    }
                    if (i == this._rows - 1) {
                        this.spreadArea[i][j][k].boundary = '3' // 正方体最前方的那个面
                    }
                    if (j == 0) {
                        this.spreadArea[i][j][k].boundary = '4' //正方体最左方的那个面
                    }
                    if (k == this._heights - 1) {
                        this.spreadArea[i][j][k].boundary = '5' //正方体最底部的那个面
                    }
                    // 边界条件后面再改进

                    //土壤水渗透系数
                    this._setPermeabilityCoeff(this.spreadArea[i][j][k])
                }
            }
        }
        this._updateWaterFlow()

    }

    /**
     * 给污染元胞赋于污染物质量
     * @param {行号} row 
     * @param {列号} col 
     * @param {污染物质量} value 
     */
    setPollutantMass(row, col, heigths, value) {
        this.spreadArea[row][col][heigths].cellMass += value
        if ((!this.spreadArea[row][col][heigths].isPolluted) & (this.spreadArea[row][col][heigths].cellMass > 0)) {
            this.spreadArea[row][col][heigths].isPolluted = true
            this.isPollutedArea.push(this.spreadArea[row][col][heigths])
        }
    }

    /**
     * 
     * @param {当前水位值} waterLevelValue 
     * @returns 土壤体积含水率
     */
    _setMoistureContent(waterLevelValue) {
        return this._moistureContentR + (this._moistureContentS - this._moistureContentR) / Math.pow((1 + Math.pow(this._paramW * waterLevelValue, this._paramN)), this._paramM)
    }

    /**
     * 给当前元胞的非饱和渗透系数赋值
     * @param {当前元胞} spreadAreaGrid 
     */
    _setPermeabilityCoeff(spreadAreaGrid) {
        let permeabilitySe = (spreadAreaGrid.moistureContent - this._moistureContentR) / (this._moistureContentS - this._moistureContentR)
        spreadAreaGrid.permeabilityCoeff = this._permeabilityKS * Math.pow(permeabilitySe, 0.5) * Math.pow(1 - Math.pow(1 - Math.pow(permeabilitySe, 1 / this._paramM), this._paramM), 2)
    }

    /**
     * 同一个平面上的元胞距离
     * @param {中心行号} i 
     * @param {列号} j 
     * @param {当前行} m 
     * @param {当前列} n 
     * @returns 
     */
    _judgeDistance(i, j, m, n) {
        let cellDistance = 0.0
        if ((m == i & n == j + 1) | (m == i & n == j - 1)) {
            cellDistance = this._cellX
        } else if ((m == i - 1 & n == j) | (m == i + 1 & n == j + 1)) {
            cellDistance = this._cellY
        } else {
            cellDistance = this._cellDiagonal
        }
        return cellDistance
    }

    /**
     * D8算法计算水流方向
     * @param {中心元胞行号} i 
     * @param {列号} j 
     * @param {起始行号} k1 
     * @param {结束行号} k2 
     * @param {起始列号} t1 
     * @param {结束列号} t2 
     * @returns 流向和坡降
     * 这里暂时和高度没有关系，因为我拿到的水位数据是二维的
     */
    _computerWaterFlow(i, j, k, k1, k2, t1, t2, v1, v2) {
        let cellSlop = 0.0
        let waterFlow = []
        const centerWaterLevel = this._waterLevel[i][j]
        let spreadArea = this.spreadArea[i][j][k]
        for (let m = k1; m < k2 + 1; m++) {
            const waterLevelJ = this._waterLevel[m]
            for (let n = t1; n < t2 + 1; n++) {
                let cellDistance = this._judgeDistance(i, j, m, n)
                const waterLevel = waterLevelJ[n];
                if (waterLevel < centerWaterLevel) {
                    if (!spreadArea.lessWaterCells.includes([m, n, v2])) { //注意v1，只会流向，流向元胞的底部的的元胞
                        spreadArea.lessWaterCells.push([m, n, v2])
                    }

                    let cellDistanceScrach = Math.sqrt(Math.pow(cellDistance, 2) + Math.pow(this._cellZ, 2)) //三维中的距离，中央元胞与底部元胞
                    let cellSlopScrach = (centerWaterLevel - waterLevel) / cellDistanceScrach
                    if (cellSlopScrach > cellSlop) {
                        cellSlop = cellSlopScrach
                        waterFlow = [m, n, v2]
                    }
                    spreadArea.cellDistance = cellDistance
                }
            }
        }
        return {
            'cellSlop': cellSlop,
            'waterFlow': waterFlow
        }
    }

    /**
     * 更新单个元胞水流方向和坡降
     * @param {当前行号} i 
     * @param {列号} j 
     */
    _updateCellWaterFlow(i, j, k) {
        if (this.spreadArea[i][j][k].boundary == 'noBoundary') { //边界条件有点复杂，后面改进、

            let results = this._computerWaterFlow(i, j, k, i - 1, i + 1, j - 1, j + 1, k - 1, k + 1)
            this.spreadArea[i][j][k].cellSlop = results.cellSlop
            this.spreadArea[i][j][k].waterFlow = results.waterFlow
        }



    }

    /**
     * 更新水流和坡降
     */
    _updateWaterFlow() {
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                for (let k = 0; k < this._heights; k++) {
                    this._updateCellWaterFlow(i, j, k)
                }
            }
        }
    }

    /**
     * 
     * @param {被污染元胞} currentCell 
     * @param {污染物质量} mass 
     */
    _updatePollutedState(currentCell,mass){
        if (mass > 0 & currentCell.isPolluted == false) {
            currentCell.isPolluted = true
            this.nextPollutedArea.push(currentCell)
            this.isPollutedArea.push(currentCell)
        }
        currentCell.cellMass += mass
    }

    /**
     * 更新一个步长的污染物质量
     * @param {污染源网格坐标} position1 
     * @param {水流方向网格坐标} position2 
     * @param {横向扩散质量} massX 
     * @param {纵向} massY 
     * @param {垂直} massZ 
     * @param {*} massXY 
     * @param {*} massXZ 
     * @param {*} massYZ 
     * @param {*} massXYZ 
     */
    _updateCellMassOneStep(position1,position2, massX, massY, massZ, massXY, massXZ, massYZ, massXYZ){
        const x1 = position1[1] //xy是反的
        const y1 = position1[0]
        const z1 = position1[2]
        const x2 = position2[1] 
        const y2 = position2[0]
        const z2 = position2[2]

        this._updatePollutedState(this.spreadArea[x2][y1][z1],massX)
        this._updatePollutedState( this.spreadArea[x2][y2][z1], massXY)
        this._updatePollutedState(this.spreadArea[x1][y2][z1], massY)
        this._updatePollutedState( this.spreadArea[x2][y1][z2],massXZ)
        this._updatePollutedState(this.spreadArea[x2][y2][z2], massXYZ)
        this._updatePollutedState(this.spreadArea[x1][y2][z2], massYZ)
        this._updatePollutedState(this.spreadArea[x1][y1][z2], massZ)
        this._updatePollutedState(this.spreadArea[x1][y1][z1],-(massX+massY+massZ+massXY+massXZ+ massYZ+massXYZ))  
        
    }

    /**
     * 计算一个步长后的污染物质量
     * @param {当前污染元胞} currentCell 
     */
    _getOutMass(currentCell) {
        if (currentCell.cellSlop != null) { //说明不是该点水流洼地
            let speed = currentCell.permeabilityCoeff * currentCell.cellSlop
            let goalCellPosition = currentCell.waterFlow

            let speedX = speed * this._cellX * Math.abs(goalCellPosition[0] - currentCell.position[0]) / currentCell.cellDistance
            let speedY = speed * this._cellY * Math.abs(goalCellPosition[1] - currentCell.position[1]) / currentCell.cellDistance
            let speedZ = speed * this._cellZ * Math.abs(goalCellPosition[2] - currentCell.position[2]) / currentCell.cellDistance
            let massX = currentCell.moistureContent * speedX * currentCell.cellMass * this._cellY * this._cellZ * this.timeStep //浓度换成质量，不然体积含水率就消掉了，然后时间的问题可以用阈值试试
            let massY = currentCell.moistureContent * speedY * currentCell.cellMass * this._cellX * this._cellZ * this.timeStep // 当元胞的浓度达到一定的一定的阈值，说明该元胞已经被污染
            let massZ = currentCell.moistureContent * speedZ * currentCell.cellMass * this._cellX * this._cellY * this.timeStep
            let massXY = 0.0
            let massXZ = 0.0
            let massYZ = 0.0
            let massXYZ = 0.0

            let speedXY = Math.sqrt(Math.pow(speedX, 2) + Math.pow(speedY, 2))
            let speedXZ = Math.sqrt(Math.pow(speedX, 2) + Math.pow(speedZ, 2))
            let speedYZ = Math.sqrt(Math.pow(speedZ, 2) + Math.pow(speedY, 2))

            if (speedX == 0) {
                massYZ = currentCell.moistureContent * speedYZ * currentCell.cellMass * this._cellX * this._cellZ / 2 * this.timeStep
            }
            
            if (speedY == 0) {
                massXZ = currentCell.moistureContent * speedXZ * currentCell.cellMass * this._cellY * this._cellZ / 2 * this.timeStep
            }

            if (speedX != 0 & speedY != 0 & speedZ != 0) { //说明目标流向在斜对角,情况复杂，即相交一条线的情况       
                massXY = currentCell.moistureContent * speedXY * currentCell.cellMass * this._cellZ * this._cellDiagonal / 2 * this.timeStep
                massXZ = currentCell.moistureContent * speedXZ * currentCell.cellMass * this._cellY * this._cellZ / 2 * this.timeStep
                massYZ = currentCell.moistureContent * speedYZ * currentCell.cellMass * this._cellX * this._cellZ / 2 * this.timeStep
                massXYZ = currentCell.moistureContent * speed * currentCell.cellMass * this._cellZ * this._cellDiagonal / 2 * this.timeStep
            }

            this._updateCellMassOneStep(currentCell.position, goalCellPosition,massX, massY, massZ, massXY, massXZ, massYZ, massXYZ)
        }
    }
    // 污染物质量更新
    updateCellMass() {
        let isPollutedArea = this.isPollutedArea
        isPollutedArea.forEach((element) => {   
            this._getOutMass(element)               
        })
    }

}
export default InitCell