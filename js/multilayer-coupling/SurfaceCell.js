import XLType from "../utils/XLType.js"

/**
 * 计算类
 * 
 */
class SurfaceCell{
    _m = 0.084 //静态扩散系数
    _d = 0.16 //斜向扩散系数
    _kdiffs = [] 
    _rows = 9 //行数，Y
    _columns = 9 //列数，X
    _halfGridX = Math.floor(this._columns /2) // 元胞区域X方向半长
    _halfGridY = Math.floor(this._rows /2) //元胞区域Y方向半长
    spreadArea = undefined //所有元胞对象数组
    isPollutedArea = [] //所有被污染的元胞数组
    nextPollutedArea = [] //下一时刻将被污染的元胞数组
    verKdiff = 0.2 //污染物向土壤中的渗透系数 m/h
    intervalTime = 5 //假定1m元胞的扩散时间步长为5小时 1/0.2
    verMass = this.verKdiff * this.intervalTime //一个步长时污染向土壤中渗透量
    pollutionSourceCell = undefined //污染源元胞
    constructor(heightMatrix,rows,columns){
        this._heightMatrix = heightMatrix
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
                    'cellMass': 0,
                    'elevation':this._heightMatrix[i][j],
                    'kdiffs':[], 
                    'boundary':'noBoundary', //边界条件
                    'isPolluted':false, //是否被污染
                    'fatherNode':null, //父节点
                    'childNode':[], //子节点
                    'particlePool':[], //粒子池
                    'isTrailPloy':false, //当前元胞是否已经有流动线
                    'worldPosition':undefined, //元胞世界坐标
                    'modelPosition':undefined, //模型坐标
                    'name':"surfaceCell", //表示元胞代表的地质结构
                    
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
            }
        }
    }

    /**
     * 设置污染源、质量
     * @param {行} row 
     * @param {列} col 
     * @param {质量} mass 
     */
    setPollutedSourceCell(row,col,mass){
        this.spreadArea[row][col].cellMass = mass;
        if (!this.spreadArea[row][col].isPolluted) {
            this.spreadArea[row][col].isPolluted = true;
            this.isPollutedArea.push(this.spreadArea[row][col]);
            this.pollutionSourceCell = this.spreadArea[row][col];
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
        if (this.spreadArea[i][j].kdiffs.length != 0) { //计算过的话直接返回
            return this.spreadArea[i][j].kdiffs
        }

        for (let m = i-1; m < i+2; m++) {
            for (let n = j-1; n < j+2; n++) {
                const element = heightMatrix[m][n]
                let heightDiff = center-element
                if (heightDiff>0) {
                    hfull += heightDiff
                }
            }            
        }
        if (hfull == 0) {//临近元胞高程都大于中心，谷点
            return 0
        }
        let k = 0
        for (let m = i-1; m < i+2; m++) {
            for (let n = j-1; n < j+2; n++) {
                const element = heightMatrix[m][n]
                let heightDiff = center-element
                if (heightDiff >0) {
                    kdiffs[k] = heightDiff / hfull
                }else{
                    kdiffs[k] = 0
                }
                k ++
            }            
        }
        this.spreadArea[i][j].kdiffs = kdiffs
        this._kdiffs = kdiffs
        return kdiffs
    }

    /**
     * 计算中央元胞的污染物质量，并更新周围元胞的污染物质量
     * @param {元胞行号} i 
     * @param {元胞列号} j 
     * @returns 每个元胞新的污染物质量
     */
    _computerNewMass(i,j){
        const mxshu = this._m
        const dxshu = this._d
        const centerMass = this.spreadArea[i][j].cellMass
        this.nextPollutedArea = [] //清空下个时刻被污染的元胞数组
        let kdiffs = this._computerKdiff(i,j)
        if (typeof kdiffs == "number" & kdiffs == 0) {//遇到谷点，返回原来的值
            return centerMass
        }
        
        let k = 0
        let crossMass = 0.0
        let inclineMass = 0.0
        for (let m = i-1; m < i+2; m++) {
            for (let n = j-1; n < j+2; n++) {
                let currentMass = this.spreadArea[m][n].cellMass
                if (currentMass -centerMass > 0) { //如果该相邻元胞大于中央元胞则跳过这次计算
                    continue
                }
                if (kdiffs[k] > 0 ) {
                    if (k %2 == 1) {
                        let updateCellMass = mxshu* (kdiffs[k])*(currentMass -centerMass) //<0
                        this.spreadArea[m][n].cellMass += -updateCellMass //更新下个污染元胞的质量
                        crossMass += updateCellMass // 当前元胞的静态扩散量
                        
                    }else{
                        let updateCellMass = mxshu* dxshu * (kdiffs[k])*(currentMass - centerMass)  //<0
                        this.spreadArea[m][n].cellMass += -updateCellMass
                        inclineMass += updateCellMass
                    }
                    if (! this.spreadArea[m][n].isPolluted) { //当前元胞还未被污染，这是新的污染元胞
                        this.spreadArea[m][n].isPolluted = true //表示当前元胞已被污染
                        this.isPollutedArea.push(this.spreadArea[m][n]) //表示所有污染元胞的集合
                        this.spreadArea[m][n].fatherNode = this.spreadArea[i][j].position //为该节点添加父节点
                        this.spreadArea[i][j].childNode.push(this.spreadArea[i][j].position) //为该节点添加子节点
                    }
                    this.nextPollutedArea.push(this.spreadArea[m][n])
                }
                k ++
            }
        }
        
        let newMass = centerMass + crossMass + inclineMass
        this.spreadArea[i][j].cellMass = newMass
        return newMass
    }


    /**
     * 污染物质量计算、更新的入口函数
     * @param {被污染的元胞对象} currentSpreadArea 
     */
    computerCellMass(currentSpreadArea){
        if (currentSpreadArea.boundary == 'noBoundary') {  //当前元胞无边界  
            
            if (!XLType.xlAlert(!this.isEnding(),"迭代已终止！")) return //终止迭代
            
            let position = currentSpreadArea.position
            this._computerNewMass(position[0],position[1])
        }
        return this.nextPollutedArea
    }


    /**
     * 判断是否达到迭代终止条件
     * @returns 真假
     */
    isEnding(){
        let pollutionSourceCell = this.pollutionSourceCell;
        if (pollutionSourceCell.childNode.length != 0) {
            pollutionSourceCell.childNode.forEach(element => {
                if (element.cellMass > pollutionSourceCell.cellMass) {
                    return true;
                }else{
                    return false;
                }
            });     
        }else{
            return false;
        }
        
    }

}
export default SurfaceCell