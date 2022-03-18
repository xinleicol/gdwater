import {MouseEventType} from "../base/EventType.js"

class Draw {
  constructor() {
    this._viewer = undefined
    this._delegate = undefined
    this._floatingAnchor = undefined
    this._clampToGround = true
    this._tooltip = undefined
    this._layer = undefined
    this._plotEvent = undefined
    this._options = {}
    this._xlEvent = undefined;
  }

  _mountEntity() {}

  _onClick(e) {}

  _onMouseMove(e) {}

  _onRightClick(e) {}



  bindEvent() {
    this._xlEvent.on(MouseEventType.CLICK, this._onClick, this)
    this._xlEvent.on(MouseEventType.MOUSE_MOVE, this._onMouseMove, this)
    this._xlEvent.on(MouseEventType.RIGHT_CLICK, this._onRightClick, this)
  }

  unbindEvent() {
    this._xlEvent.off(MouseEventType.CLICK, this._onClick, this)
    this._xlEvent.off(MouseEventType.MOUSE_MOVE, this._onMouseMove, this)
    this._xlEvent.off(MouseEventType.RIGHT_CLICK, this._onRightClick, this)
  }

  createAnchor(position, isCenter = false) {
    return this._layer.add({
      position: position,
      billboard: {
        image: isCenter ? '../../../image/' + this._options.icon_center : '../../../image/' + this._options.icon_anchor,
        width: this._options.icon_size[0],
        height: this._options.icon_size[1],
        eyeOffset: new Cesium.Cartesian3(0, 0, -500),
        heightReference: this._viewer.scene.mode === Cesium.SceneMode.SCENE3D &&
          this._clampToGround ?
          Cesium.HeightReference.CLAMP_TO_GROUND :
          Cesium.HeightReference.NONE
      }
    })
  }

  start(plot) {
    this._xlEvent = plot.xlEvent
    this._viewer = plot.viewer
    this._tooltip = plot.viewer.tooltip
    this._layer = plot.overlayLayer
    this._plotEvent = plot.plotEvent
    this._options = plot.options
    this._clampToGround = plot.options.clampToGround ?? true
    this._mountEntity()
    this.bindEvent()
  }
}

export default Draw