import Graphic from "./Graphic.js"
import XLType from "../XLType.js"


class Polygon extends Graphic{
    constructor(positions){
        super()
        this._positions = positions
        this._delegate = new Cesium.Entity({ polygon: {} })
        this._mountedHook()
    }

    /**
     * @param {Array}} positions
     */
    set positions(positions) {
        this._delegate.polygon.hierarchy = this._computeHierarchy(positions)
        return this
      }

    get positions(){
      return this._positions
    }

    _mountedHook() {
        this.positions = this._positions
        
    }

    setStyle(style) {
        if (!style || Object.keys(style).length === 0) {
          return this
        }
        delete style['positions']
        this._style = style
        XLType.merge(this._delegate.polygon, this._style)
        return this
    }

    
  /**
   *
   * @private
   */
  _computeHierarchy(positions) {
    let result = new Cesium.PolygonHierarchy()
    result.positions = positions;
    return result
  }
}

export default Polygon