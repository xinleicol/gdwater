
//每个元胞网格的属性

class RectangleCellDao{
    constructor(xs, ys, length, width, ex=0, ey=0){

        this._xs = xs
        this._ys = ys
        this._length = length
        this._width = width
        this._unit = '弧度'
        this._ex = ex //向外延伸个数x
        this._ey = ey//向外延伸个数y
    }

    get ex(){return this._ex}
    get ey(){return this._ey}

    get unit(){return this._unit}

    set unit(u){ this._unit = u}

    get xNumber(){return this._xs}
    set xNumber(x){this._xs = x}

    get yNumber(){return this._ys}
    set yNumber(y){this._ys = y}

    get length(){return this._length}

    set length(l){
        this._length = l
    }

    get width(){
        return this._width
    }

    set width(w){
        this._width = w
    }

    toString(){
        return this._unit+this._xs+this._ys
    }
}

export default RectangleCellDao