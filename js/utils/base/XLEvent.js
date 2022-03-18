import { MouseEventType } from "./EventType.js"


export default class XLEvent {
  constructor(viewer) {
    this._viewer = viewer
      this._cache = {}
       this._registerEvent();
    }

    _on(type, callback, context) {
        let event = this.getEvent(type)
        let removeCallback = undefined
        if (event && callback) {
            removeCallback = event.addEventListener(callback, context || this)
        }
        return removeCallback
    }

    _off(type, callback, context) {
        let event = this.getEvent(type)
        let removed = false
        if (event && callback) {
            removed = event.removeEventListener(callback, context || this)
        }
        return removed
    }

    _getMouseInfo(position) {
      let scene = this._viewer.scene
      let target = scene.pick(position)
      let cartesian = undefined
      let surfaceCartesian = undefined
      let wgs84Position = undefined
      let wgs84SurfacePosition = undefined
      if (scene.pickPositionSupported) {
        cartesian = scene.pickPosition(position)
      }
      if (cartesian) {
        let c = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian)
        if (c) {
          wgs84Position = {
            lng: Cesium.Math.toDegrees(c.longitude),
            lat: Cesium.Math.toDegrees(c.latitude),
            alt: c.height
          }
        }
      }
      if (
        scene.mode === Cesium.SceneMode.SCENE3D &&
        !(this._viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider)
      ) {
        let ray = scene.camera.getPickRay(position)
        surfaceCartesian = scene.globe.pick(ray, scene)
      } else {
        surfaceCartesian = scene.camera.pickEllipsoid(
          position,
          Cesium.Ellipsoid.WGS84
        )
      }
      if (surfaceCartesian) {
        let c = Cesium.Ellipsoid.WGS84.cartesianToCartographic(surfaceCartesian)
        if (c) {
          wgs84SurfacePosition = {
            lng: Cesium.Math.toDegrees(c.longitude),
            lat: Cesium.Math.toDegrees(c.latitude),
            alt: c.height
          }
        }
      }
  
      return {
        target: target,
        windowPosition: position,
        position: cartesian,
        wgs84Position: wgs84Position,
        surfacePosition: surfaceCartesian,
        wgs84SurfacePosition: wgs84SurfacePosition
      }
    }
    

    _registerEvent() {
      let handler = new Cesium.ScreenSpaceEventHandler(this._viewer.canvas)
        Object.keys(MouseEventType).forEach(key => {
            let type = MouseEventType[key]
            this._cache[type] = new Cesium.Event()
            handler.setInputAction(movement => {
              let mouseInfo = this._getMouseInfo(movement.position || movement.endPosition)
              this._cache[type].raiseEvent(mouseInfo)
            }, type)
        })
    }

    //绑定事件
    on(type, callback, context) {
        return this._on(type, callback, context)
    }

    //解绑事件
    off(type, callback, context) {
        return this._off(type, callback, context)
    }



    getEvent(type) {
        return this._cache[type] || undefined
    }

}