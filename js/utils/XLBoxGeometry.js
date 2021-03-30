import XLBox from './XLBox.js'
import PolylineImageTrailMaterialProperty from '../material/property/PolylineImageTrailMaterialProperty.js'
import addPolylineImageTrailType from '../material/type/polyline.js'
import PolylineLightingTrailMaterialProperty from '../material/property/PolylineLightingTrailMaterialProperty.js'
import addPolylineLightingTrailType from '../material/type/polylineLightingTrail.js'

class XLBoxGeometry extends XLBox {
    _centerPoint = null
    _centerOffset = null //中心点偏移量
    _dimensions = null
    _offsets = []
    _geometryInstances = []
    _TrailPloyLineColor = undefined //箭头颜色
    trailPloys = [] //存放已经生成的流动线实体
    lightingTrailPloys = [] //发光流动线
    constructor(centerPoint, dimensions, offsets) {
        super()
        this._centerPoint = centerPoint
        this._dimensions = dimensions
        if (offsets) {
            this._offsets = offsets
        }
        this._initModelMatrix(centerPoint)
        addPolylineImageTrailType() //添加流动线材质
        addPolylineLightingTrailType() //添加光线
    }

    /**
     * 初始化模型矩阵和逆矩阵
     * @param {模型坐标原点的世界坐标} centerPosition 
     */
    _initModelMatrix(centerPosition) {
        super.computerModelMatrixInverse(centerPosition)
    }

    /**
     * 初始化网格模型位置
     * @param {模型原点偏移位置} offset 
     * @param {x方向网格个数} xNum 
     * @param {y方向网格个数} yNum 
     */
    initBoxPosition(offset, xNum, yNum) {
        this._centerOffset = offset
        let offsetFinal = Cesium.defaultValue(offset, new Cesium.Cartesian3())
        let halfXNum = Math.floor(xNum)
        let halfYNum = Math.floor(yNum)
        for (let i = -halfXNum; i < halfXNum + 1; i++) {
            for (let j = -halfYNum; j < halfYNum + 1; j++) {
                let x = i * this._dimensions.x + offsetFinal.x
                let y = j * this._dimensions.y + offsetFinal.y
                let z = 0 + offsetFinal.z
                this._offsets.push(new Cesium.Cartesian3(x, y, z))
            }
        }
        return this._offsets
    }

    /**
     * 生成盒子
     */
    generate() {
        if (this._offsets.length == 0) {
            throw new Error('请传入一个非空的偏移坐标...')
        }
        let geometry = Cesium.BoxOutlineGeometry.fromDimensions({ //BoxGeometry
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
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA) //Cesium.Color.AQUA)
                },
                id: i
            });
            this._geometryInstances.push(instance)
            i++
        }

        scene.primitives.add(new Cesium.Primitive({
            geometryInstances: this._geometryInstances,
            appearance: new Cesium.PerInstanceColorAppearance({
                flat: true //使用BoxOutlineGeometry时，要将光照关闭
            })
        }));
    }

    /**
     * 生成流动线
     * @param {起点} startPosition 
     * @param {终点} endPosition 
     */
    generateTrailPloyline(startPosition, endPosition) {
        let color = Cesium.defaultValue(this._TrailPloyLineColor, Cesium.Color.DEEPSKYBLUE)
        let trailPloyline = viewer.entities.add({
            name: 'PolylineTrail',
            polyline: {
                positions: [startPosition, endPosition],
                width: 10,
                material: new PolylineImageTrailMaterialProperty({
                    color: color,
                    speed: 20,
                    image: '../../image/arrow.png',
                    repeat: {
                        x: 4,
                        y: 1
                    }
                }),
            }
        });
        this.trailPloys.push(trailPloyline)

    }

    /**
     * 移除所有流动线
     */
    removeAllLightingTrailPolyline() {
        this.trailPloys.forEach((element) => {
            viewer.entities.remove(element)
        })
    }

    /**
     * 生成发光流动线
     * @param {起点} startPosition 
     * @param {终点} endPosition 
     */
    generateLightingTrailPloyline(startPosition, endPosition) {
        let color = Cesium.defaultValue(this._TrailPloyLineColor, new Cesium.Color(0, 1, 1))
        let trainPloyline = viewer.entities.add({
            name: 'PolylineTrail',
            polyline: {
                positions: [startPosition, endPosition],
                width: 10,
                material: new PolylineLightingTrailMaterialProperty({
                    color: color,
                    speed: 5.0,
                    image: '../../image/lighting.png',
                }),
            }
        });
        this.lightingTrailPloys.push(trainPloyline)

    }

    /**
     * 移除所有发光流动线
     */
    removeAllTrailPolyline() {
        this.lightingTrailPloys.forEach((element) => {
            viewer.entities.remove(element)
        })
    }

    fly(position) {
        let destination = Cesium.Cartesian3.fromDegrees(...position, 100)
        viewer.camera.flyTo({
            destination: destination
        });
    }

    setView(position) {
        let destination = Cesium.Cartesian3.fromDegrees(...position, 100)
        viewer.camera.setView({
            destination: destination
        });
    }

}

export default XLBoxGeometry