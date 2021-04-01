/**
 * 各种坐标转化的类
 */

import XLBox from "./XLBox.js";

class XLPosition extends XLBox{
    worldToModel = null
    modelMatrix = null
    _dimensions = null
    _offset = null
    _rows = 9 //行数，Y
    _columns = 9 //列数，X
    _halfGridX = Math.floor(this._columns /2) // 元胞区域X方向半长
    _halfGridY = Math.floor(this._rows /2) //元胞区域Y方向半长
    constructor(centerPosition,dimensions,offset,rows,columns){
        super()
        this._dimensions = dimensions
        this._offset = offset
        this._rows = Cesium.defaultValue(this._rows, rows)
        this._columns = Cesium.defaultValue(this._columns,columns)
        this._init(centerPosition)        
    }

    //初始化模型矩阵
    _init(centerPosition){
        this.computerModelMatrixInverse(centerPosition)
        this.worldToModel = this._worldToModel
        this.modelMatrix = this._modelMatrix
    }

    /**
     * 将数组索引转化为元胞所处的模型坐标
     * @param {网格坐标} girdPosition 
     * @param {元胞的长宽高} dimensions 
     * @param {元胞中点相对模型的偏移量（元胞中心的模型坐标）} offset 
     * @returns 元胞中心在模型下的坐标 
     */
    convertToModelPosition(girdPosition){
        if (!this._dimensions | !this._offset) {
            throw new Error('dimensions & offset不能为空...')
        }
        Cesium.defaultValue(this._offset,new Cesium.Cartesian3())
        let modelPosition = new Cesium.Cartesian3()
        let gridCoor = new Cesium.Cartesian3 ( girdPosition[1] , girdPosition[0],0 ) //y x坐标不要搞混
        let transform = new Cesium.Cartesian3(1,-1,1)
        Cesium.Cartesian3.multiplyComponents (gridCoor, transform, modelPosition) 
        let translation = new Cesium.Cartesian3(-this._halfGridX,this._halfGridY,0)
        Cesium.Cartesian3.add (modelPosition, translation, modelPosition)
        Cesium.Cartesian3.multiplyComponents (modelPosition, this._dimensions, modelPosition)
        Cesium.Cartesian3.add(modelPosition,this._offset,modelPosition)
        return modelPosition
    }

    /**
     * 将网格坐标转换为世界坐标并返回
     * @param {网格坐标} girdPosition 
     * @returns 
     */
    convertToWorldPositon(girdPosition){
        if (!this.modelMatrix) {
            throw new Error('模型矩阵不能为空...')
        }
        let modelPosition = this.convertToModelPosition(girdPosition)
        let worldPositon = this.computerWorldPosition(modelPosition,this.modelMatrix)
        return worldPositon
    }

    convertToWorldPositonFromModel(modelPosition){
        if (!this.modelMatrix) {
            throw new Error('模型矩阵不能为空...')
        }
        return this.computerWorldPosition(modelPosition,this.modelMatrix)
    }

    /**
     * 赋予所有元胞中点模型和世界坐标
     * @param {元胞区域} spreadArea 
     */
    giveGridWorldAndModelPosition(spreadArea){
        for (let i = 0; i < spreadArea.length; i++) {
            let element1 = spreadArea[i];
            for (let j = 0; j < element1.length; j++) {
                let element2 = element1[j];
                element2.modelPosition = this.convertToModelPosition(element2.position)
                element2.worldPosition = this.computerWorldPosition(element2.modelPosition,this.modelMatrix)
            }
        }
    }

}

export default XLPosition