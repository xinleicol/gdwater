


import XLType from "../XLType.js"
import Graphic from './Graphic.js'
import Transform from '../transform/Transform.js'

const DEF_STYLE = {
  pixelSize: 8,
  outlineColor: Cesium.Color.BLUE,
  outlineWidth: 2
}

class Point extends Graphic {
  constructor(position) {
    super()
    this._delegate = new Cesium.Entity({ point: {} })
    this._position = position
  }

  get type() {
    // return Overlay.getOverlayType('point')
  }

  set position(position) {
    this._delegate.position = Transform.transformWGS84ToCartesian(
      this._position
    )
    return this
  }

  get position() {
    return this._position
  }

  _mountedHook() {
    /**
     * set the location
     */
    this.position = this._position

    /**
     *  initialize the Overlay parameter
     */
     XLType.merge(this._delegate.point, DEF_STYLE, this._style)
  }

  /**
   * Set style
   * @param style
   * @returns {Point}
   */
  setStyle(style) {
    if (!style || Object.keys(style).length === 0) {
      return this
    }
    delete style['position']
    this._style = style
    XLType.merge(this._delegate.point, DEF_STYLE, this._style)
    return this
  }

  /**
   * Parse from entity
   * @param entity
   * @returns {any}
   */
  static fromEntity(entity) {
    let point = undefined
    let now = Cesium.JulianDate.now()
    let position = Transform.transformCartesianToWGS84(
      entity.position.getValue(now)
    )
    point = new Point(position)
    point.attr = {
      ...entity?.properties?.getValue(now)
    }
    return point
  }
}

// Overlay.registerType('point')

export default Point
