import XLBox from './XLBox.js'

class XLBoxGeometry extends XLBox{
    _centerPoint = null
    _dimensions = null
    _offsets = []
    _geometryInstances = []
    constructor(centerPoint,dimensions,offsets){
        super()
        this._centerPoint = centerPoint
        this._dimensions = dimensions
        this._offsets = offsets
    }

    generate(){
        if (this._offsets.length == 0) {
            throw new Error('请传入一个非空的偏移坐标...')
        }
        let geometry = Cesium.BoxGeometry.fromDimensions({//BoxOutlineGeometry
            vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
            dimensions: this._dimensions
        });
        let i = 0
        let modelMatrix = this.computerModelMatrix(this._centerPoint)
        for (const offset of this._offsets) {
            let instance = new Cesium.GeometryInstance({
                geometry: geometry,
                modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                    modelMatrix, 
                    offset,
                    new Cesium.Matrix4()),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
                },
                id: i
            });
            this._geometryInstances.push(instance)
            i ++
        }

        scene.primitives.add(new Cesium.Primitive({
            geometryInstances: this._geometryInstances,
            appearance: new Cesium.PerInstanceColorAppearance()
        }));
    }

    generatePloyLine(startPosition,endPosition){
        let polyLinePrimitive = new Cesium.Primitive({
            geometryInstances : new Cesium.GeometryInstance({
              geometry : new Cesium.PolylineGeometry({
                positions : [startPosition,endPosition],
                width : 10.0,
                vertexFormat : Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
              })
            }),
            appearance : new Cesium.PolylineMaterialAppearance({
                translucent:false,
                material :  Cesium.Material.fromType('Color')
            })
        });
        scene.primitives.add(polyLinePrimitive)
    }
}

export default XLBoxGeometry