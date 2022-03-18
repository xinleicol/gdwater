/**
 * 初始化元胞类
 * 
 */
class InitCell {
    _m = 0.084 //静态扩散系数
    _d = 0.16 //斜向扩散系数
    _moleK = 1.28 * Math.pow(10,-9) //丙酮溶液分子扩散系数
    _rows = 9 //行数，Y
    _columns = 9 //列数，X
    _halfGridX = Math.floor(this._columns / 2) // 元胞区域X方向半长
    _halfGridY = Math.floor(this._rows / 2) //元胞区域Y方向半长
    spreadArea = undefined //所有元胞对象数组
    isPollutedArea = [] //所有被污染的元胞数组
    nextPollutedArea = [] //下一时刻将被污染的元胞数组
    _dimensions = null //元胞大小
    _cellX = 0.0 //元胞x方向长度
    _cellY = 0.0 // y
    _cellDiagonal = 0.0 //斜向方向
    constructor(waterLevel, waterVeloty, rows, columns, dimensions) {
        this._waterLevel = waterLevel
        this._waterVeloty = waterVeloty
        this._dimensions = dimensions
        this._cellX = dimensions.x
        this._cellY = dimensions.y
        this._cellDiagonal = Math.sqrt(Math.pow(this._cellX, 2) + Math.pow(this._cellY, 2))
        this._rows = Cesium.defaultValue(rows,this._rows )
        this._columns = Cesium.defaultValue(columns,this._columns)
        this._init()
    }

    /**
     * 初始化元胞空间
     */
    _init() {
        this.spreadArea = new Array(this._rows)
        for (let i = 0; i < this._rows; i++) {
            this.spreadArea[i] = new Array(this._columns)
        }
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                this.spreadArea[i][j] = {
                    'position': [i, j],
                    'cellMass': 0.0,
                    'isUpdateCellMass':0.0,
                    'waterLevel': this._waterLevel[i][j],
                    'waterFlow': [], //水流方向
                    'cellSlop': null, //坡降
                    'lessWaterCells': [], //临近元胞中水位更小的元胞
                    'cellDistance': null, //流向方向上的元胞距离
                    'boundary': 'noBoundary', //边界条件
                    'isPolluted': false, //是否被污染
                    'fatherNode': null, //父节点
                    'childNode': [], //子节点
                    'particlePool': [], //粒子池
                    'isTrailPloy': false, //当前元胞是否已经有流动线
                    'worldPosition': undefined, //元胞世界坐标
                    'modelPosition': undefined, //模型坐标
                    'particlePool':[],
                    'name':"gdwaterCell",

                }
                if (i == 0) {
                    this.spreadArea[i][j].boundary = 'topBoundary'
                }
                if (j == 0) {
                    this.spreadArea[i][j].boundary = 'leftBoundary'
                }
                if (i == this._rows - 1) {
                    this.spreadArea[i][j].boundary = 'buttomBoundary'
                }
                if (j == this._columns - 1) {
                    this.spreadArea[i][j].boundary = 'rightBoundary'
                }
                if (i == 0 & j == 0) {
                    this.spreadArea[i][j].boundary = 'leftTopBoundary'
                }
                if (i == 0 & j == this._columns - 1) {
                    this.spreadArea[i][j].boundary = 'rightTopBoundary'
                }
                if (i == this._rows - 1 & j == 0) {
                    this.spreadArea[i][j].boundary = 'leftButtomBoundary'
                }
                if (i == this._rows - 1 & j == this._columns - 1) {
                    this.spreadArea[i][j].boundary = 'rightButtomBoundary'
                }
            }
        }
        this.updateWaterFlow()
    }

    /**
     * 给污染元胞赋值
     * @param {行号} row 
     * @param {列号} col 
     * @param {污染物质量} value 
     * @param {包气带元胞的深度} vadoseHeight 
     */
    setPollutantMass(row, col, value, vadoseHeight, centerCellOffset) {
        if(!centerCellOffset) centerCellOffset = 0 ;
        let rowChange = row + centerCellOffset;
        let colChange = col + centerCellOffset;
        this.spreadArea[rowChange][colChange].cellMass += value
        if ((!this.spreadArea[rowChange][colChange].isPolluted) & (this.spreadArea[rowChange][colChange].cellMass > 0)) {
            this.spreadArea[rowChange][colChange].isPolluted = true
            this.isPollutedArea.push(this.spreadArea[rowChange][colChange])
            this.spreadArea[rowChange][colChange].fatherNode = [row, col, vadoseHeight];
            this.nextPollutedArea.push(this.spreadArea[rowChange][colChange]);
        }
    }

    /**
     * 
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
     * 判断元胞流向位置的相邻元胞是否水位也比中间低，
     * 主要是拿到水流方向元胞的相邻元胞坐标
     * @param {行号} i 
     * @param {列} j 
     * @returns 
     */
    _judgeAdjacent(i, j) {
        let lessWaterCells = this.spreadArea[i][j].lessWaterCells
        let waterFlow = this.spreadArea[i][j].waterFlow
        let results = []
        lessWaterCells.forEach(element => {
            Math.abs(element[0] - waterFlow[0]) + Math.abs(element[1] - waterFlow[1]) == 1 ? results.push(element) : false
        });
        return results
    }

    /**
     * 
     * @param {中心元胞行号} i 
     * @param {列号} j 
     * @param {起始行号} k1 
     * @param {结束行号} k2 
     * @param {起始列号} t1 
     * @param {结束列号} t2 
     * @returns 流向和坡降
     */
    _computerWaterFlow(i, j, k1, k2, t1, t2) {
        let cellSlop = 0.0
        let waterFlow = []
        const centerWaterLevel = this._waterLevel[i][j]
        let spreadArea = this.spreadArea[i][j]
        for (let m = k1; m < k2 + 1; m++) {
            const waterLevelJ = this._waterLevel[m]
            for (let n = t1; n < t2 + 1; n++) {
                const cellDistance = this._judgeDistance(i, j, m, n)
                const waterLevel = waterLevelJ[n];
                if (waterLevel < centerWaterLevel) {
                    if (!spreadArea.lessWaterCells.includes([m, n])) {
                        spreadArea.lessWaterCells.push([m, n])
                    }

                    let cellSlopScrach = (centerWaterLevel - waterLevel) / cellDistance
                    if (cellSlopScrach > cellSlop) {
                        cellSlop = cellSlopScrach
                        waterFlow = [m, n]
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
    _updateCellWaterFlow(i, j) {
        let results = null

        if (this.spreadArea[i][j].boundary == 'leftTopBoundary') {
            results = this._computerWaterFlow(i, j, i, i + 1, j, j + 1)

        } else if (this.spreadArea[i][j].boundary == 'rightTopBoundary') {
            results = this._computerWaterFlow(i, j, i, i + 1, j - 1, j)

        } else if (this.spreadArea[i][j].boundary == 'leftButtomBoundary') {
            results = this._computerWaterFlow(i, j, i - 1, i, j, j + 1)

        } else if (this.spreadArea[i][j].boundary == 'rightButtomBoundary') {
            results = this._computerWaterFlow(i, j, i - 1, i, j - 1, j)

        } else if (this.spreadArea[i][j].boundary == 'topBoundary') {
            results = this._computerWaterFlow(i, j, i, i + 1, j - 1, j + 1)

        } else if (this.spreadArea[i][j].boundary == 'leftBoundary') {
            results = this._computerWaterFlow(i, j, i - 1, i + 1, j, j + 1)

        } else if (this.spreadArea[i][j].boundary == 'rightBoundary') {
            results = this._computerWaterFlow(i, j, i - 1, i + 1, j - 1, j)

        } else if (this.spreadArea[i][j].boundary == 'buttomBoundary') {
            results = this._computerWaterFlow(i, j, i - 1, i, j - 1, j + 1)

        } else {
            results = this._computerWaterFlow(i, j, i - 1, i + 1, j - 1, j + 1)
        }

        this.spreadArea[i][j].cellSlop = results.cellSlop
        this.spreadArea[i][j].waterFlow = results.waterFlow
    }

    /**
     * 更新水流和坡降
     */
    updateWaterFlow() {
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                this._updateCellWaterFlow(i, j)
            }
        }
    }

    // 污染物质量更新, 机械弥散
    updateCellMass() {
        let isPollutedArea = this.isPollutedArea.splice()
        isPollutedArea.forEach((element) => {
            if (element.waterFlow.length != 0) {

                // 水流方向扩散
                let nextPollutedCell = this.spreadArea[element.waterFlow[0]][element.waterFlow[1]]
                let outMassFlow = this._waterVeloty * element.cellDistance * (element.cellMass - nextPollutedCell.cellMass)
                nextPollutedCell.cellMass += outMassFlow

                // 更新元胞状态
                if (!nextPollutedCell.isPolluted) {
                    nextPollutedCell.isPolluted = true
                    this.isPollutedArea.push(nextPollutedCell)
                }

                // 在水流方向有分向的元胞扩散模拟
                let position = element.position
                let results = this._judgeAdjacent(...position)
                let outMassFlowComponents = 0.0
                if (results.length != 0) {
                    results.forEach((element2) => {
                        let nextPollutedCell = this.spreadArea[element2[0]][element2[1]]
                        let distance = this._judgeDistance(...position, ...element2)
                        let outMassFlowComponent = (1 / Math.sqrt(2)) * this._waterVeloty * distance * (element.cellMass - nextPollutedCell.cellMass)
                        outMassFlowComponents += outMassFlowComponent

                        nextPollutedCell.cellMass += outMassFlowComponent

                        if (!nextPollutedCell.isPolluted) {
                            nextPollutedCell.isPolluted = true
                            this.isPollutedArea.push(nextPollutedCell)
                            this.nextPollutedArea.push(nextPollutedCell);
                            nextPollutedCell.fatherNode = element.position;
                        }
                    })
                }

                // 更新中央元胞污染物质量
                element.cellMass -= (outMassFlow + outMassFlowComponents)
            }
        })
    }

    // 分子扩散
    updateCellMassForMole(){
        let isPollutedArea = this.isPollutedArea
        let cellVolume = Cesium.Cartesian3.magnitudeSquared (this._dimensions)
        isPollutedArea.forEach((element) => { 
            if (element.boundary == 'noBoundary') {
                let position = element.position

                let number = 0
                let representDiag = [0,2,6,8] //表示当前位置在斜对角
                let outMassDiffusion = 0.0 
                let outMassDiffusionAll = 0.0
                for (let i = position[0]-1; i < position[0]+2; i++) {
                    for (let j = position[1]-1; j < position[1]+2; j++) {
                        let element2 = this.spreadArea[i][j]
                        if (number in representDiag) {
                            outMassDiffusion = (this._moleK / cellVolume ) * (element.cellMass - element2.cellMass)
                        }else{
                            outMassDiffusion = (this._moleK / (Math.sqrt(2,2) *cellVolume) ) * (element.cellMass - element2.cellMass)
                        }

                        // 污染物中间质量比相邻元胞小的话不发生分子扩散
                        if (outMassDiffusion > 0 ) {
                            element2.cellMass += outMassDiffusion
                        }

                        if (!element2.isPolluted) {
                            element2.isPolluted = true
                            this.isPollutedArea.push(element2)
                        }

                        outMassDiffusionAll += outMassDiffusion
                        number ++
                    }                    
                }

                // 更新中央元胞质量
                element.cellMass -= outMassDiffusionAll
            }
        })

    }

    // 机械弥散加分子扩散共同作用
    updateCellMassForMoleAndMech(){
        let isPollutedArea = this.isPollutedArea
        let cellVolume = Cesium.Cartesian3.magnitudeSquared (this._dimensions)
        isPollutedArea.forEach((element) => { 
            if (element.waterFlow.length != 0 || element.boundary == 'noBoundary') {
                let position = element.position

                let number = 0
                let representDiag = [0,2,6,8] //表示当前位置在斜对角
                let outMassDiffusion = 0.0 
                let outMassDiffusionAll = 0.0

                for (let i = position[0]-1; i < position[0]+2; i++) {
                    for (let j = position[1]-1; j < position[1]+2; j++) {
                        let element2 = this.spreadArea[i][j]
                        if (number in representDiag) {
                            outMassDiffusion = (this._moleK / cellVolume ) * (element.cellMass - element2.cellMass)
                        }else{
                            outMassDiffusion = (this._moleK / (Math.sqrt(2,2) *cellVolume) ) * (element.cellMass - element2.cellMass)
                        }

                        // 污染物中间质量比相邻元胞小的话不发生分子扩散
                        if (outMassDiffusion > 0 ) {
                            element2.isUpdateCellMass += outMassDiffusion //更新待更新质量，等待这个该时刻结束在添加到真正质量中
                        }                                                 //以免对该时刻的机械弥散有影响
                        

                        if (!element2.isPolluted) {
                            element2.isPolluted = true
                            this.isPollutedArea.push(element2)
                            this.nextPollutedArea.push(element2);
                            element2.fatherNode = element.position;
                        }

                        outMassDiffusionAll += outMassDiffusion
                        number ++
                    }                    
                }

                // 更新中央元胞质量
                element.isUpdateCellMass -= outMassDiffusionAll

               // 水流方向扩散
                let nextPollutedCell = this.spreadArea[element.waterFlow[0]][element.waterFlow[1]]
                let outMassFlow = this._waterVeloty * element.cellDistance * (element.cellMass - nextPollutedCell.cellMass)
                nextPollutedCell.isUpdateCellMass += outMassFlow

                // 更新元胞状态
                if (!nextPollutedCell.isPolluted) {
                    nextPollutedCell.isPolluted = true
                    this.isPollutedArea.push(nextPollutedCell)
                }

                // 在水流方向有分向的元胞扩散模拟
                //let position = element.position
                let results = this._judgeAdjacent(...position)
                let outMassFlowComponents = 0.0
                if (results.length != 0) {
                    results.forEach((element2) => {
                        let nextPollutedCell2 = this.spreadArea[element2[0]][element2[1]]
                        let distance = this._judgeDistance(...position, ...element2)
                        let outMassFlowComponent = (1 / Math.sqrt(2)) * this._waterVeloty * distance * (element.cellMass - nextPollutedCell2.cellMass)
                        outMassFlowComponents += outMassFlowComponent

                        nextPollutedCell2.isUpdateCellMass += outMassFlowComponent

                        if (!nextPollutedCell2.isPolluted) {
                            nextPollutedCell2.isPolluted = true
                            this.isPollutedArea.push(nextPollutedCell2)
                            this.nextPollutedArea.push(nextPollutedCell2);
                            nextPollutedCell2.fatherNode = element.position;
                        }
                    })
                }

                // 更新中央元胞污染物质量
                element.isUpdateCellMass -= (outMassFlow + outMassFlowComponents)
            }
        })

        this.updateIsUpdateCellMass()
    }


    // 更新一个时刻的元胞污染物质量
    updateIsUpdateCellMass(){
        let isPollutedArea = this.isPollutedArea
        isPollutedArea.forEach((element)=>{
            let position = element.position
            for (let i = position[0]-1; i < position[0]+2; i++) {
                for (let j = position[1]-1; j < position[1]+2; j++) {
                    let element2 = this.spreadArea[i][j]
                    if (element2.isUpdateCellMass != 0) { //注意中央元胞的isUpdateCellMass为负值
                        element2.cellMass += element2.isUpdateCellMass
                        element2.isUpdateCellMass = 0 //清空
                    }
                }
            }
        })
    }

}
export default InitCell