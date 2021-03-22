import XLBox from './XLBox.js'
import PolylineImageTrailMaterialProperty from '../material/property/PolylineImageTrailMaterialProperty.js'
import addPolylineImageTrailType from '../material/type/polyline.js'

class XLBoxGeometry extends XLBox{
    _centerPoint = null
    _dimensions = null
    _offsets = []
    _geometryInstances = []
    _TrailPloyLineColor = undefined //箭头颜色
    constructor(centerPoint,dimensions,offsets){
        super()
        this._centerPoint = centerPoint
        this._dimensions = dimensions
        if (offsets) {
            this._offsets = offsets
        }
        this._initModelMatrix(centerPoint)
        addPolylineImageTrailType()//添加流动线材质
    }

    /**
     * 初始化模型矩阵和逆矩阵
     * @param {模型坐标原点的世界坐标} centerPosition 
     */
    _initModelMatrix(centerPosition){
        super.computerModelMatrixInverse(centerPosition)
    }

    initBoxPosition(offset,xNum,yNum){
        let offsetFinal = Cesium.defaultValue(offset,new Cesium.Cartesian3())
        let halfXNum = Math.floor(xNum)
        let halfYNum = Math.floor(yNum)
        for (let i = -halfXNum; i < halfXNum+1; i++) {
            for (let j = -halfYNum; j < halfYNum+1; j++) {
                let x = i * this._dimensions.x + offsetFinal.x
                let y = j * this._dimensions.y + offsetFinal.y
                let z = 0 + offsetFinal.z
                this._offsets.push(new Cesium.Cartesian3(x,y,z))
            }            
        }
    }

    /**
     * 生成盒子
     */
    generate(){
        if (this._offsets.length == 0) {
            throw new Error('请传入一个非空的偏移坐标...')
        }
        let geometry = Cesium.BoxOutlineGeometry.fromDimensions({//BoxGeometry
            //vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
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
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)//Cesium.Color.AQUA)
                },
                id: i
            });
            this._geometryInstances.push(instance)
            i ++
        }

        scene.primitives.add(new Cesium.Primitive({
            geometryInstances: this._geometryInstances,
            appearance: new Cesium.PerInstanceColorAppearance({
                 flat:true  //使用BoxOutlineGeometry时，要将光照关闭
            })
        }));
    }

    /**
     * 生成流动线
     * @param {起点} startPosition 
     * @param {终点} endPosition 
     */
    generateTrailPloyLine(startPosition,endPosition){
        let color = Cesium.defaultValue(this._TrailPloyLineColor,new Cesium.Color(0,1,1))
        viewer.entities.add({
            name: 'PolylineTrail',
            polyline: {
                positions:[startPosition,endPosition],
                width: 10,
                material: new PolylineImageTrailMaterialProperty({
                    color: color,
                    speed: 20,
                    image: '../../image/arrow.png',
                    repeat: { x: 4, y: 1 }
                }),
            }   
        });
    }
}

export default XLBoxGeometry