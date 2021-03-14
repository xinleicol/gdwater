class XLBoxGeometry{
    _centerPoint = null
    _dimensions = null
    _offsets = []
    _geometryInstances = []
    constructor(centerPoint,dimensions,offsets){
        this._centerPoint = centerPoint
        this._dimensions = dimensions
        this._offsets = offsets
    }

    generate(){
        if (this._offsets.length == 0) {
            throw new Error('请传入一个非空的偏移坐标...')
        }
        let geometry = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
            dimensions: this._dimensions
        });
        let i = 0
        for (const offset of this._offsets) {
            let instance = new Cesium.GeometryInstance({
                geometry: geometry,
                modelMatrix: Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
                    this._centerPoint), 
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
}

export default XLBoxGeometry