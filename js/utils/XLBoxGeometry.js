import XLBox from './XLBox.js'
import PolylineImageTrailMaterialProperty from '../material/property/PolylineImageTrailMaterialProperty.js'
import addPolylineImageTrailType from '../material/type/polyline.js'
import PolylineLightingTrailMaterialProperty from '../material/property/PolylineLightingTrailMaterialProperty.js'
import addPolylineLightingTrailType from '../material/type/polylineLightingTrail.js'
import XLType from './XLType.js'

class XLBoxGeometry extends XLBox {
    _centerPoint = null
    _centerOffset = null //中心点偏移量
    _dimensions = null
    _offsets = []
    _TrailPloyLineColor = undefined //箭头颜色
    trailPloys = new Cesium.EntityCollection() //存放已经生成的流动线实体
    lightingTrailPloys = [] //发光流动线
    _boxEntities = new Cesium.EntityCollection() //盒子entities
    boxEntitiesStyle = {
        material:  Cesium.Color.AZURE.withAlpha(0.1),//Cesium.Color.AQUA.withAlpha(0.5),
        fill:true,
        outline: false,
        outlineColor: Cesium.Color.AZURE,
        get showOutline(){return this.outline},
        set showOutline(flag){this.outline = flag;},
        get changeOutlineColor(){return this,this.outlineColor},
        set changeOutlineColor(color){this.outlineColor = color;} ,
        isID: true //是否给实体添加id属性，为了避免id重复，暂时这样写
    }
    constructor(centerPoint, dimensions, offsets) {
        super()
        this._centerPoint = centerPoint
        this._dimensions = dimensions
        this._offsets = offsets || new Cesium.Cartesian3();
        this._initModelMatrix(centerPoint)
        addPolylineImageTrailType() //添加流动线材质
        addPolylineLightingTrailType() //添加光线
    }
    /**
     * 初始化模型矩阵和逆矩阵
     * @param {模型坐标原点的世界坐标} centerPosition 
     */
    _initModelMatrix(centerPosition) {
        this.computerModelMatrixInverse(centerPosition)
    }


    /**
     * @param {any} d
     */
    set dimensions(d){
        this._dimensions = d;
    }


     /**
     * @param {any} o
     */
    set offset(o){
        this.offset = o;
    }

    /**
     * @param {any} s
     */
    set style(s){
        Object.assign(this.boxEntitiesStyle, s);
    }

    get boxEntities(){
        return this._boxEntities.values;
    }

    initBoxPositionUpdate(offset, xNum, yNum) {
        this._offsets = [];
        this._centerOffset = offset
        let offsetFinal = Cesium.defaultValue(offset, new Cesium.Cartesian3())
        let halfXNum = Math.floor(xNum/2);
        let halfYNum = Math.floor(yNum/2);
        let xChangeValue = 0;
        let yChangeValue = 0;
        let xTop = halfXNum + 1;
        let yTop = halfYNum + 1;
        if (xNum % 2 === 0) {
            xChangeValue = this._dimensions.x / 2 ;
            xTop = halfXNum;
        }
        if (yNum % 2 === 0) {
            yChangeValue = this._dimensions.y / 2 ;
            yTop = halfYNum;
        }
        for (let i = -halfXNum; i < xTop; i++) {
            for (let j = -halfYNum; j < yTop; j++) {
                
                let x = i * this._dimensions.x + xChangeValue + offsetFinal.x
                let y = j * this._dimensions.y + yChangeValue + offsetFinal.y
                let z = 0 + offsetFinal.z
                this._offsets.push({
                    position:[i+halfXNum, j+halfYNum], //和元胞挂钩
                    modelPosition:new Cesium.Cartesian3(x, y,z)
                })
            }
        }
        
    }
    
    initBoxPosition3DUpdate(offset, xNum, yNum, zNum) {
        this._offsets = [];
        this._centerOffset = offset
        let offsetFinal = Cesium.defaultValue(offset, new Cesium.Cartesian3())
        let halfXNum = Math.floor(xNum / 2)
        let halfYNum = Math.floor(yNum / 2)
        let halfZNum = Math.floor(zNum / 2)
        let xChangeValue = 0;
        let yChangeValue = 0;
        let zChangeValue = 0;
        let xTop = halfXNum + 1;
        let yTop = halfYNum + 1;
        let zTop = halfZNum + 1;
        if (xNum % 2 === 0) {
            xChangeValue = this._dimensions.x / 2 ;
            xTop = halfXNum;
        }
        if (yNum % 2 === 0) {
            yChangeValue = this._dimensions.y / 2 ;
            yTop = halfYNum;
        } 
        if (zNum % 2 === 0) {
            zChangeValue = this._dimensions.z / 2 ;
            zTop = halfZNum;
        }
        for (let i = -halfXNum; i < xTop; i++) {
            for (let j = -halfYNum; j < yTop; j++) {
                for (let k = -halfZNum; k < zTop; k++) {
                    let x = i * this._dimensions.x + xChangeValue+ offsetFinal.x 
                    let y = j * this._dimensions.y + yChangeValue+ offsetFinal.y
                    let z = k * this._dimensions.z + zChangeValue + offsetFinal.z
                    this._offsets.push({
                        position:[i+halfXNum, j+halfYNum, halfZNum-k-1], //和元胞挂钩，从零开始
                        modelPosition:new Cesium.Cartesian3(x, y, z)
                    })
                }
            }
        }
    }


    //生成实体通过viewer.entities的方式
    //type 网格id类型
    generateByEntities(type) {
        if (this._offsets.length == 0) {
            throw new Error('请传入一个非空的偏移坐标...')
        }

        for (const offset of this._offsets) {
            let worldPosition = this.computerWorldPosition(offset.modelPosition,this._modelMatrix)
           
            let box = viewer.entities.add({
                name:type, //coupling
                position: worldPosition,
                box: {
                    dimensions: this._dimensions,
                    ...this.boxEntitiesStyle
                },
                id: type?type + offset.position.toString():offset.position.toString(),
                xlCellPos: offset.position,//自定义属性
            });
            this._boxEntities.add(box)
        }
    }

    //隐藏实体
    hideAllBoxsByEntities(){
        this._boxEntities.show = false 
    }

    showOrHidden(){
        this._boxEntities.show =  !this._boxEntities.show
    }

    isShowEntity(f){
        this._boxEntities.show = f;
    }
    // 流动线生成是否
    isShowTrail(f){
        this.trailPloys.show = f;
    }

    //删除所有实体
    removeAllBoxsByEntities(){
        if (this._boxEntities.values.length > 0) {
            this._boxEntities.values.forEach(element => {
                viewer.entities.remove(element)
            })
        } 
    }

    //更改污染元胞颜色
    getAndSetBoxEntites(id,currentColor){
        Cesium.Check.typeOf.object('currentColor',currentColor)
        let boxEntity = this._boxEntities.getById (id.toString())
        if (boxEntity) {
            boxEntity.box.material = currentColor
            boxEntity.box.show = true
        }
    }


    //隐藏一部分元素
    hiddenBoxEntites(id){
        let boxEntity = this._boxEntities.getById (id.toString())
        if (boxEntity) {
            boxEntity.box.show = false;
        }
    }

    //还原污染元胞颜色
    restoreBoxEntites(id){
        XLType.determineCartesian3(id)
        let boxEntity = this._boxEntities.getById (id.toString())
        if (boxEntity) {
            boxEntity.box.material = this.boxEntitiesStyle.material
            boxEntity.box.outline = this.boxEntitiesStyle.outline
            boxEntity.box.outlineColor = this.boxEntitiesStyle.outlineColor
        }
    }

    //更改元胞边框
    changeBoxOutline(flag){
        this._boxEntities.values.forEach((element)=>{
            element.box.outline = flag
        })
    }

    //更改元胞透明度
    changeBoxAlpha(value){
        this._boxEntities.values.forEach((element)=>{
            element.box.material.color.setValue(element.box.material.color.valueOf().withAlpha(parseFloat(value)))
        })
    }

    //是否填充
    isFilled(value){
        this._boxEntities.values.forEach((element)=>{
            element.box.fill = value
        })
    }

    /**
     * 生成流动线
     * @param {起点} startPosition 
     * @param {终点} endPosition 
     */
    generateTrailPloyline(positions) {
        let color = Cesium.defaultValue(this._TrailPloyLineColor, Cesium.Color.DEEPSKYBLUE)

        let trailPloyline = viewer.entities.add({
            name: 'PolylineTrail',
            polyline: {
                positions: positions,
                width: 10,
                material: new PolylineImageTrailMaterialProperty({
                    color: color,
                    speed: 10,
                    image: '../../image/arrow.png',
                    repeat: {
                        x: 1,
                        y: 1
                    }
                }),
            }
        });
        this.trailPloys.add(trailPloyline);
        return this.trailPloyline;
    }

    /**
     * 移除所有流动线
     */
    removeAllTrailPolyline() {
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
                width: 15,
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
    removeAllLightingTrailPolyline() {
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

    lookAt(x,y,z){
        const camera = viewer.scene.camera;
        camera.lookAt(this._centerPoint, new Cesium.Cartesian3(x,y,z));
    }

    styleOne(){
        this.boxEntitiesStyle = {
            fill:false,
            outline: true,
            outlineColor: Cesium.Color.AQUA,
            isID: true 
        }
    }

    // 绘制坐标轴
    drawAxis(){
        viewer.scene.primitives.add(new Cesium.DebugModelMatrixPrimitive({
            modelMatrix: this.modelMatrix,
            length: 1000.0,
            width: 2.0
        }));
    }
       
}

export default XLBoxGeometry