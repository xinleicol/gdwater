
class GdwaterDao{
    constructor(centerPosition, centerOffset, dimensions, rows, cloumns, heights, depth, boxHeight,waterLevel, waterVelocity=0.1){
        this._center = centerPosition //弧度坐标
        this._dimensions = dimensions
        this._offset = centerOffset
        this._ys = rows
        this._xs = cloumns
        this._hs = heights
        this._depth = depth
        this._boxHs = boxHeight
        this._waterLevel = waterLevel
        this._waterVelocity = waterVelocity
        
    }
    get boxHs(){return this._boxHs}

    get depth(){return this._depth}

    get center(){return this._center}

    get dimensions(){return this._dimensions}

    get offset(){return this._offset}

    get yNumber(){return this._ys}
 
    get xNumber(){return this._xs}
 
    get hNumber(){return this._hs}

    get waterLevel(){return this._waterLevel}

    set waterLevel(w){this._waterLevel = w}

    get velocity(){return this._waterVelocity}
}

export default GdwaterDao