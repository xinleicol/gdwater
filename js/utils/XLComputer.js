/**
 * 计算类
 * 
 */
class XLComputer{
    _m = 0.084
    _d = 0.16
    _kdiffs = []
    _rows = 9
    _columns = 9
    _halfGridX = Math.floor(this._columns /2)
    _halfGridY = Math.floor(this._rows /2)
    spreadArea = undefined
    isPollutedArea = []
    constructor(heightMatrix,mass,rows,columns){
        this._heightMatrix = heightMatrix
        this._mass = mass
        this._rows = Cesium.defaultValue(this._rows, rows)
        this._columns = Cesium.defaultValue(this._columns,columns)
        this._init()
    }

    /**
     * 初始化元胞空间
     */
    _init(){
        this.spreadArea = new Array(this._rows)
        for (let i = 0; i < this._rows; i++) {
            this.spreadArea[i] = new Array(this._columns)
        }
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                this.spreadArea[i][j] = {
                    'position':[i,j],
                    'cellMass':this._mass[i][j],
                    'elevation':this._heightMatrix[i][j],
                    'boundary':'noBoundary',
                    'isPolluted':false,
                    'isMassUpdate':false,
                    'beforeCellMass':0.0,
                }               
                if (i == 0 ) {
                    this.spreadArea[i][j].boundary = 'topBoundary'
                }
                if (j == 0) {
                    this.spreadArea[i][j].boundary = 'leftBoundary'
                }
                if (i == this._rows -1) {
                    this.spreadArea[i][j].boundary = 'buttomBoundary'
                }
                if (j == this._columns -1) {
                    this.spreadArea[i][j].boundary = 'rightBoundary'
                }
                if (i == 0 & j == 0) {
                    this.spreadArea[i][j].boundary = 'leftTopBoundary'
                }
                if (i == 0 & j == this._columns -1) {
                    this.spreadArea[i][j].boundary = 'rightTopBoundary'
                }
                if (i == this._rows & j == 0 ) {
                    this.spreadArea[i][j].boundary = 'leftButtomBoundary' 
                }
                if (i == this._rows & j == this._columns) {
                    this.spreadArea[i][j].boundary = 'rightButtomBoundary'
                }
                if (i == this._halfGridX & j == this._halfGridY) {//污染源初始化时已经被污染
                    this.spreadArea[i][j].isPolluted = true
                    this.isPollutedArea.push(this.spreadArea[i][j])
                }
            }
        }
    }

    /**
     * 计算当前元胞与临近元胞的高差值和与高差比率
     * @param {元胞行号} i 
     * @param {元胞列号} j 
     * @returns 每个元胞的高程差影响因子
     */
    _computerKdiff(i,j){
        let heightMatrix = this._heightMatrix
        let center = heightMatrix[i][j]
        let hfull = 0
        let kdiffs = []
        for (let m = i-1; m < i+2; m++) {
            for (let n = j-1; n < j+2; n++) {
                const element = this._heightMatrix[m][n]
                hfull += Math.abs(element - center)
            }            
        }
        kdiffs[0] = Math.abs((heightMatrix[i-1][j-1] -center))/ hfull
        kdiffs[1] = Math.abs((heightMatrix[i-1][j]-center)   )/ hfull
        kdiffs[2] = Math.abs((heightMatrix[i-1][j]-center)   )/ hfull
        kdiffs[3] = Math.abs((heightMatrix[i][j-1] -center)  )/ hfull
        kdiffs[4] = Math.abs((heightMatrix[i][j]   -center)  )/ hfull
        kdiffs[5] = Math.abs((heightMatrix[i][j+1] -center)  )/ hfull
        kdiffs[6] = Math.abs((heightMatrix[i+1][j-1] -center))/ hfull
        kdiffs[7] = Math.abs((heightMatrix[i+1][j]   -center))/ hfull
        kdiffs[8] = Math.abs((heightMatrix[i+1][j+1] -center))/ hfull
        this._kdiffs = kdiffs
        return kdiffs
    }

    /**
     * 计算一个元胞的污染物质量
     * @param {元胞行号} i 
     * @param {元胞列号} j 
     * @returns 每个元胞新的污染物质量
     */
    _computerNewMass(i,j){
        const m = this._m
        const d = this._d
        const centerMass = this.spreadArea[i][j].cellMass
        let kdiffs = this._computerKdiff(i,j)
        let newMass = centerMass
        +m * (kdiffs[1]*(this.spreadArea[i-1][j].cellMass - centerMass)
        +kdiffs[7] *(this.spreadArea[i+1][j].cellMass -centerMass)
        +kdiffs[3]*(this.spreadArea[i][j-1].cellMass - centerMass)
        +kdiffs[5]* (this.spreadArea[i][j+1].cellMass -centerMass))
        +m* d *(kdiffs[0]*(this.spreadArea[i-1][j-1].cellMass - centerMass)
        +kdiffs[2]*(this.spreadArea[i-1][j+1].cellMass -centerMass)
        +kdiffs[6] *(this.spreadArea[i+1][j-1].cellMass -centerMass)
        +kdiffs[8] *(this.spreadArea[i+1][j+1].cellMass -centerMass))
        return newMass
    }

    /**
     * 计算元胞一次模拟后的临近3*3元胞的污染物质量
     * @param {污染源行号} i 
     * @param {污染源列号} j 
     * 
     */
    computerCellMass(i,j){
        let currentSpreadArea = this.spreadArea[i][j]
        //let updateSpreadArea = []
        if (currentSpreadArea.boundary == 'noBoundary') {  //当前元胞无边界  
            for (let m = i-1; m < i+1; m++) {
                for (let n = j-1; n < j+1; n++) {
                    let nearSpreadArea = this.spreadArea[m][n]
                    if (nearSpreadArea.boundary == 'noBoundary') { //相邻元胞无边界
                        let newMass = this._computerNewMass(m,n)        
                        if (newMass != 0) { //质量不为0则更新
                            nearSpreadArea.beforeCellMass = newMass
                            // nearSpreadArea.isPolluted = true
                            nearSpreadArea.isMassUpdate = true
                            if (! nearSpreadArea.isPolluted) { //已被污染
                                // updateSpreadArea.push(nearSpreadArea)
                                this.isPollutedArea.push(nearSpreadArea)
                                nearSpreadArea.isPolluted = true
                            }
                        }
                    }    
                }
            }
        }
        //return updateSpreadArea
    }

    /**
     * 更新一个时态后的元胞污染质量
     */
    updateCellMass(){
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                if (this.spreadArea[i][j].isMassUpdate) {
                    this.spreadArea[i][j].cellMass = this.spreadArea[i][j].beforeCellMass
                    this.spreadArea[i][j].isMassUpdate = false
                }
            }
        }
    }

    /**
     * 将数组索引转化为元胞所处的模型坐标
     * @param {网格坐标} girdPosition 
     * @param {元胞的长宽高} dimensions 
     * @returns 元胞中心在模型下的坐标 
     */
    convertToModelPosition(girdPosition,dimensions){
        let modelPosition = new Cesium.Cartesian2()
        let gridCoor = new Cesium.Cartesian2 ( girdPosition[0] , girdPosition[1] )
        let transform = new Cesium.Cartesian2(1,-1)
        Cesium.Cartesian2.multiplyComponents (gridCoor, transform, modelPosition) 
        let translation = new Cesium.Cartesian2(-this._halfGridX,this._halfGridY)
        Cesium.Cartesian2.add (modelPosition, translation, modelPosition)
        let sigleBoxLength = new Cesium.Cartesian2(dimensions.x,dimensions.y)
        Cesium.Cartesian2.multiplyComponents (modelPosition, sigleBoxLength, modelPosition)
        return modelPosition
    }

}
export default XLComputer