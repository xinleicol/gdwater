import Graphic from "./Graphic.js";
import XLBox from "../XLBox.js";
import BoxDao from "../../Dao/BoxDao.js";

const DEF_STYLE = {
    material: Cesium.Color.WHITE.withAlpha(0.6),
    fill: true
}

class BoundingBox extends Graphic{
    constructor(positions){
        super()
        this._positions = positions
        this._delegate = new Cesium.Entity({ box: {...DEF_STYLE} })
        this._xlBox = new XLBox()
        this._boundingBox = undefined
        this._boxdao = undefined
        this._mountedHook()
    }

    get positions(){
        return this._positions
    }

    get boundingBox(){
        return this._boundingBox
    }

    get boxDao(){
        return this._boxdao
    }

    _mountedHook() {
        this._computerBox2().add()
        // this._computerBox().add()
        //this.test()
    }

    setStyle(style) {
        if (!style || Object.keys(style).length === 0) {
          return this
        }
        this._style = style
        XLType.merge(this._delegate.box, this._style)
        return this
    }

    //建立本地坐标系
    _buildModelCoor(center){
        let ms = this._xlBox.computerModelPositionFromCenterArrs(this._positions, center)
        return ms
    }

    _computerBox(){
        let ms = this._buildModelCoor(this._positions[0])
        this.boundingBox = Cesium.OrientedBoundingBox.fromPoints(ms, Cesium.OrientedBoundingBox());
        //this.boundingBox = Cesium.OrientedBoundingBox.fromPoints(this._positions, Cesium.OrientedBoundingBox());
        let dimensions = Cesium.Matrix3.getScale(this.boundingBox.halfAxes , new Cesium.Cartesian3());
        Cesium.Cartesian3.multiplyByScalar(dimensions, 2 , dimensions);
        let center = this._xlBox.computerWorldPosition(this.boundingBox.center, this._xlBox._modelMatrix)
        this._delegate.position = center//this.boundingBox.center//center;
        this._delegate.box.dimensions = dimensions;
        return this
    }

    _computerBox2(){
        let ms = this._buildModelCoor(this._positions[0])
        this._boundingBox = Cesium.AxisAlignedBoundingBox.fromPoints(ms, new Cesium.AxisAlignedBoundingBox()) 
        //let boundingBox = Cesium.AxisAlignedBoundingBox.fromPoints(this._positions, new Cesium.AxisAlignedBoundingBox()) 
        let dimensions = Cesium.Cartesian3.subtract(this._boundingBox.maximum, this._boundingBox.minimum, new Cesium.Cartesian3())
        let center = this._xlBox.computerWorldPosition(this._boundingBox.center, this._xlBox._modelMatrix)
        this._delegate.position = center//boundingBox.center;
        this._delegate.box.dimensions = dimensions;
        
        this._boxdao = new BoxDao(this._boundingBox.center, this._xlBox._modelMatrix, this._xlBox._worldToModel,
            this._boundingBox.minimum, this._boundingBox.maximum)
        return this
    }

    _computerBox3(){
        let ms = this._buildModelCoor(this._positions[0])
        let m = this._xlBox._modelMatrix
        let boundingBox = Cesium.AxisAlignedBoundingBox.fromPoints(ms, new Cesium.AxisAlignedBoundingBox()) 
        let newBox = Cesium.BoxGeometry.fromAxisAlignedBoundingBox(boundingBox);
        viewer.scene.primitives.add(new Cesium.Primitive({
            geometryInstances : new Cesium.GeometryInstance({
                geometry :newBox,
                modelMatrix : m,
                attributes : {
                  color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA.withAlpha(0.5))
                },
            }),
            appearance : new Cesium.PerInstanceColorAppearance({
                flat : true,
            })
        }))
    }
}

export default BoundingBox