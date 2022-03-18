


class RectangleDao{
    constructor(rec, position, center){
        this._rec = rec
        this._position = position
        this._center = center
        this._type = 'RectangleDao'
        this.degrees = undefined //四个角点经纬度数组
    }

    get type(){return this._type}

    get rectangle( ){ return this._rec}

    get position(){ return this._position}

    get centerCarto(){return this._center}
}

export default RectangleDao