

//盒子封装类，特定坐标系下
class BoxDao{
    constructor(originWorld, modelMatrix, modelMatrixInverse, mininumModel, maxinumModel){
        this._originWorld = originWorld
        this._modelMatrix = modelMatrix
        this._modelMatrixInverse = modelMatrixInverse
        this._mininumModel = mininumModel
        this._maxinumModel = maxinumModel
        this._originModel = new Cesium.Cartesian3()
    }

    get originModel(){return this._originModel}

    get originWorld(){return this._originWorld}

    get modelMatrix(){return this._modelMatrix}

    get modelMatrixInverse(){return this._modelMatrixInverse}

    get mininumModel(){return this._mininumModel}

    get maxinumModel(){return this._maxinumModel}
}

export default BoxDao
