import XLType from "../XLType.js";
import Entity from "./Entity.js";


let DEF_STYLES = {
    material: Cesium.Color.GREEN.withAlpha(0.6),
    // outline:true,
    // fill:false,
    // outlineColor: Cesium.Color.WHITE,
}

class AddRectangle extends Entity {
    constructor(recs, type) {
        super()
        this.type = type || 'rectangle'
        this._recs = XLType.numberToArrs(recs)
        this._recEntities = []
        this._notid = true;
        DEF_STYLES = {
            material: Cesium.Color.GREEN.withAlpha(0.6),
        }
        // if(recs) this._getEntities(this._notid)
    }

    changeStyle(s){
        Object.assign(DEF_STYLES,s)
    }

    get entities(){
        return this._entities
    }

    set entities(arr) {
        this._entities = arr
        this._addEntities()
    }

    get rectangles(){
        return this._recs
    }

    _getEntities(notid) {
        this._recEntities = [];
        this._recs.map(item => {
            let res = new Cesium.Entity({
                name: "little translucent rectangle",
                rectangle: {
                    coordinates: item.rectangle,
                    ...DEF_STYLES
                },
                id:notid ? undefined : this.type+item.position ,
            })
            this._recEntities.push(res)
        })
        this.entities = this._recEntities
    }

    /**
     * 根据rectangle和颜色添加entities
     * @param {rectangledao} rectangleDaos 
     * @param {颜色} color 
     */
    add(rectangleDaos, color){
        if(color) DEF_STYLES.material = color;
        this._recs = rectangleDaos;
        this._getEntities();
    }

}

export default AddRectangle