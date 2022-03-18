import XLType from "../XLType.js";
import Entity from "./Entity.js";

const DEF_STYLES = {
    show: true,
    pixelSize: 5,
    color: Cesium.Color.NAVY,
    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND //相对地形的高度
}
const DEF_BILLBOARD_STYLE = {
    show:true,
    image: "../../image/point-water.png",//"../../image/circle_blue.png",
    width: 12,
    height: 12,
    heightReference: Cesium.HeightReference.NONE 
    // eyeOffset: new Cesium.Cartesian3(0, 0, -500),
}
class AddPoints extends Entity {
    constructor(positions) {
        super()
        if (!positions) {
            return
        }
        this.type = 'point-entitites-dataSource'
        this._init(this.type)
        this._positions = XLType.numberToArrs(positions)
        this._pointEntities = []
        this._billboard = []
        this._getEntities()
    }

    //添加点
    set entities(arr) {
        this._entities = arr
        this._addEntities()
    }

    //添加标签
    set billboardEntities(b){
        this._billboardEntities = b 
        this._addbillboardEntities()
    }

    _getEntities() {
        this._positions.map(position => {
            // let res = new Cesium.Entity({
            //     name: "green little point",
            //     position: position,
            //     point: new Cesium.PointGraphics(DEF_STYLES),
            //     id: this.type + position,
            // })
            //this._pointEntities.push(res)
            let billboard = new Cesium.Entity({
                position: position,
                billboard: new Cesium.BillboardGraphics(DEF_BILLBOARD_STYLE),
            })
            this._billboard.push(billboard)
        })
        //this.entities = this._pointEntities
        this.billboardEntities = this._billboard
    }
}

export default AddPoints;