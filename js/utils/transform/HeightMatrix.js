//获取所有元胞中点的高度，组成矩阵

import XLType from "../XLType.js"

class HeightMatrix {
    constructor(cellDao, recdaos) {
        if (!viewer) {
            return
        }
        this._viewer = viewer
        this._recDaos = recdaos
        this._cellDao = cellDao
        this._m = undefined
        this._isRelative = false //t==vadose
    }

    get relative(){return this._isRelative}

    set relative(t){
        this._isRelative = t 
    }

    get matrix() {
        return this._m
    }

    get rectangleDaos() {
        return this._recDaos
    }

    set rectangleDaos(rds) {
        let rdss = XLType.numberToArrs(rds)
        if (!XLType.isRectangleDao(rdss[0])) {
            return
        }
        this._recDaos = rdss
        // this._getHeightMatrix()
    }

    getHeightMatrix(){
        return new Promise(resolve => {
            this._getHeightMatrix(resolve)
        })
    }

    _getHeightMatrix(resolve) {
        let positions = XLType.extractArrs(this._recDaos, 'centerCarto')
        let promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions)
        
        promise.then(updatedPositions => {
            this._productMatrix(updatedPositions)
            resolve(this._m)
        })
       

    }

    _productMatrix(positions) {
        let m = new Array(this._cellDao.xNumber)
        let k = 0
        let baseHeight = positions[0] //以西南方角点为高程基准点，计算水头压力
        for (let i = 0; i < m.length; i++) {
            m[i] = new Array(this._cellDao.yNumber)
            for (let j = 0; j < this._cellDao.yNumber; j++) {
                if (this._isRelative) {
                    m[i][j] = positions[k].height - baseHeight.height                    
                }else{
                    m[i][j] = positions[k].height
                }
                k++
            }
        }
        this._m = m
        return m
    }

    /**
     * 根据坐标获取高度
     * @param {世界坐标} positions 
     * @returns 
     */
    getHeight(positions){
        return new Promise(resolve => {    
            let promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions)
            promise.then((updatedPositions) => {
                resolve(updatedPositions);
            })
        })
        
    }
}

export default HeightMatrix