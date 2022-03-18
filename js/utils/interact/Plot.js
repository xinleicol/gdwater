import OverlayType from '../base/OverlayType.js'
import XLEvent from '../base/XLEvent.js'
import DrawPoint from './DrawPoint.js';
import DrawPolygon from './DrawPolygon.js';

const DEF_OPTS = {
    icon_center: 'circle_yellow.png', // IMG_CIRCLE_YELLOW,
    icon_anchor: 'circle_red.png', //IMG_CIRCLE_RED,
    icon_midAnchor: 'circle_blue.png', //IMG_CIRCLE_BLUE,
    icon_size: [12, 12],
    clampToGround: true
}
class Plot {
    constructor(viewer, options = {}) {
        if (!viewer) {
            throw new Error('Viewer未初始化！');
        }
        this._viewer = viewer;
        this._options = {
            ...DEF_OPTS,
            ...options
        }
        this._plotEvent = new Cesium.Event()
        this._callback = undefined
        this._drawWorker = undefined
        this._editWorker = undefined
        this._overlayLayer = new Cesium.CustomDataSource('plot-overlay-layer')
        this._viewer.dataSources.add(this._overlayLayer)
        this._anchorLayer = new Cesium.CustomDataSource('plot-overlay-layer')
        this._viewer.dataSources.add(this._anchorLayer)
        this._state = undefined
        this._xlEvent = new XLEvent(viewer)
    }

    get viewer() {
        return this._viewer
    }

    get options() {
        return this._options
    }

    get plotEvent() {
        return this._plotEvent
    }

    get xlEvent() {
        return this._xlEvent
    }

    get overlayLayer() {
        return this._overlayLayer.entities
    }

    get anchorLayer() {
        return this._anchorLayer.entities
    }

    get drawWorker() {
        return this._drawWorker
    }

    _completeCallback(overlay) {
        this._drawWorker = undefined
        this._editWorker = undefined
        this._viewer.tooltip.enable = false
        viewer.tooltip.hide()
        this._overlayLayer.entities.removeAll()
        this._anchorLayer.entities.removeAll()
        this._callback && this._callback.call(this, overlay)
    }

    _bindEvent(callback) {
        this._plotEvent.removeEventListener(this._completeCallback, this)
        this._callback = callback
        this._plotEvent.addEventListener(this._completeCallback, this)
    }

    _createDrawWorker(type, style) {
        switch (type) {
            case OverlayType.POLYGON:
                this._drawWorker = new DrawPolygon(style)
                break
            case OverlayType.POINT:
                this._drawWorker = new DrawPoint(style)
                break
            default:
                break
        }
    }

    draw(type, callback, style) {
        this._state = 'draw'
        if (this._drawWorker) {
            this._drawWorker.unbindEvent()
            this._drawWorker = undefined
        }
        this._viewer.tooltip.enable = true
        this._bindEvent(callback)
        this._createDrawWorker(type, style)
        this._drawWorker && this._drawWorker.start(this)
    }

    destroy() {
        this._plotEvent.removeEventListener(this._completeCallback, this)
        this._viewer.dataSources.remove(this._overlayLayer)
        this._viewer.dataSources.remove(this._anchorLayer)
        this._viewer = undefined
        this._plotEvent = undefined
    }

}

export default Plot