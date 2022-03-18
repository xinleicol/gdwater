import XLBox from "../XLBox.js";
import XLType from "../XLType.js";
import Graphic from "./Graphic.js";

const DEF_STYLE = {
    material: Cesium.Color.WHITE.withAlpha(0.6),
}

class BoundingRectangle extends Graphic{
    constructor(positions,type='cartesian3',styles = DEF_STYLE){ //styles样式
        super()
        this._positions = positions//this._convert3To2(positions)
        this._delegate = new Cesium.Entity({ rectangle: {...styles} })
        this._boundingRectangle = undefined
        this._xlbox = new XLBox();
        if(type == 'degree'){
           this._degreeToCartesian3Arrs(positions);
        }
        this._mountedHook()
    }

    get rectangle(){
        return this._boundingRectangle
    }

    _mountedHook(){
        if (this._positions.length == 0) {
            return
        }
        // this._boundingRectangle = Cesium.BoundingRectangle.fromPoints(this._positions, new Cesium.BoundingRectangle())
        this._boundingRectangle = Cesium.Rectangle.fromCartesianArray(this._positions, Cesium.Ellipsoid.WGS84, new Cesium.Rectangle()) 
        this._delegate.rectangle.coordinates = this._boundingRectangle
        this.add()
    }


    _convert3To2(ps){
        let flag = Array.isArray(ps)? XLType.isCartesian3(ps[0]): XLType.isCartesian3(ps)
        let pss = []
        if (flag) {
            ps.map(item => {
                let p = Cesium.Cartesian2.fromCartesian3(item, new Cesium.Cartesian2())  
                pss.push(p)
            })
        }
        return pss
    }

    _degreeToCartesian3Arrs(arrs){
        this._positions = this._xlbox.degreeToCartesian3Arrs(arrs)
    }

    _cartesian3ToDegree(arrs){
        return this._xlbox.cartesian3ToDegreesArr(arrs)
    }
}

export default BoundingRectangle