

import { PlotEventType } from './EventType.js'
import  Transform  from '../transform/Transform.js'
import  Point  from '../base/Point.js'
import Draw from './Draw.js'

const DEF_STYLE = {
  pixelSize: 10,
  outlineColor: Cesium.Color.BLUE,
  outlineWidth: 5
}

class DrawPoint extends Draw {
  constructor(style) {
    super()
    this._position = Cesium.Cartesian3.ZERO
    this._style = {
      ...DEF_STYLE,
      ...style
    }
  }

  /**
   *
   * @private
   */
  _mountedHook() {
    this.drawTool.tooltipMess = '单击选择点位'
    this._delegate = new Cesium.Entity({
      position: new Cesium.CallbackProperty(() => {
        return this._position
      }, false),
      point: {
        ...this._style
      }
    })
    this._layer.entities.add(this._delegate)
  }

  /**
   *
   * @private
   */
  _stopdHook() {
    let point = new Point(
      Transform.transformCartesianToWGS84(this._position)
    ).setStyle(this._style)
    this._options.onDrawStop && this._options.onDrawStop(point)
  }

  /**
   *
   * @param position
   * @private
   */
  _onDrawAnchor(position) {
    this._position = position
    this.drawTool.fire(PlotEventType.DRAW_STOP, position)
  }

  /**
   *
   * @param position
   * @private
   */
  _onAnchorMoving(position) {
    this._position = position
  }
}

export default DrawPoint
