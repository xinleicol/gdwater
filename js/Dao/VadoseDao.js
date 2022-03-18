

//包气带网格属性

class VadoseDao{
    constructor(centerPosition, dimensions, centerOffset, rows, cloumns, heights, depth=100){
        this._center = centerPosition //弧度坐标
        this._dimensions = dimensions
        this._offset = centerOffset
        this._ys = rows
        this._xs = cloumns
        this._hs = heights
        this._depth = depth
        
    }

    get depth(){return this._depth}


    get center(){return this._center}

    get dimensions(){return this._dimensions}

    get offset(){return this._offset}

    get yNumber(){return this._ys}
 
    get xNumber(){return this._xs}
 
    get hNumber(){return this._hs}
}

export default VadoseDao