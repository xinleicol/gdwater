/**顶层父类 */
class XLBox{
    constructor(){
        this._modelMatrix = undefined
        this._worldToModel = undefined
    }

    computerModelMatrix(centerPosition){
        this.determineType(centerPosition)
        this._modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerPosition)
        return this._modelMatrix
    }

    computerModelMatrixInverse(centerPosition){
        this._modelMatrix = this.computerModelMatrix(centerPosition)
        this._worldToModel = this.inverseModelMatrix()
        return this._worldToModel
    }

    inverseModelMatrix(modelMatrix){
        if (modelMatrix) {
            this._modelMatrix = modelMatrix
        }
        this._worldToModel = Cesium.Matrix4.inverseTransformation( 
            this._modelMatrix,
            new Cesium.Matrix4()
        );
        return this._worldToModel
    }

    computerWorldPosition(modelPosition,modelMatrix){
        this.determineType(modelPosition)
        return Cesium.Matrix4.multiplyByPoint(
            modelMatrix, 
            modelPosition, 
            new Cesium.Cartesian3() 
        )
    }

    computerModelPosition(worldPosition,worldToModel){
        this.determineType(worldPosition)
        return Cesium.Matrix4.multiplyByPoint(
            worldToModel, 
            worldPosition, 
            new Cesium.Cartesian3() 
        )
    }

    /**
     * 计算点的模型坐标
     * @param {目标点世界坐标} worldPosition 
     * @param {模型原点坐标} centerPosition 
     */
    computerModelPositionFromCenter(worldPosition,centerPosition){
        let worldToModel = this.computerModelMatrixInverse(centerPosition)
        return this.computerModelPosition(worldPosition,worldToModel)
    }

    /**
     * 计算点的世界坐标
     * @param {目标点模型坐标} modelPosition 
     * @param {模型原点坐标} centerPosition 
     */
    computerWorldPositionFromCenter(modelPosition,centerPosition){
        let modelMatrix = this.computerModelMatrix(centerPosition)
        return this.computerWorldPosition(modelPosition,modelMatrix)
    }

    /**判定传进来的变量是cartesian3 */
    determineType(centerPosition){
        if ((!'x' in centerPosition) | (!'y' in centerPosition) | (!'z' in centerPosition)) {
            throw new Error('请传入一个cartesian类型的位置坐标...')
        }
    }
}

export default XLBox