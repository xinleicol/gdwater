

class Graphic{
    constructor(){
        if (!viewer) {
            return
        }
        this._viewer = viewer 
        this.type = undefined
        this._delegate = undefined
        this._style = undefined
        this._position = undefined
        this._overlayLayer = new Cesium.CustomDataSource('graphic-overlay-layer')
        this._viewer.dataSources.add(this._overlayLayer)
    }

    get delegate() {
        return this._delegate
    }

        
    get overlayLayer() {
        return this._overlayLayer.entities
    }

      
  /**
   * The hook for mount layer
   * Subclasses need to be overridden
   * @private
   */
  _mountedHook() {}

  add(){
      this.delegate ? this.overlayLayer.add(this.delegate): true
  }

}
export default Graphic