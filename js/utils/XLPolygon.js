

class XLPolygon{
    constructor(){
        if (!viewer) {
            throw new Error('viewer should not be null or undefined !')
        }
        this._viewer = viewer 
        this._overlayLayer = new Cesium.CustomDataSource('polygon-entities')
        this._viewer.dataSources.add(this._overlayLayer)
        this.type = 'gdwater-polygon'
        this._style = undefined
    }

    get style(){return this._style}
    set style(s){
        this._style = s
    }

    show(flag){
        this._overlayLayer.show = flag
    }

    changeColor(id,color){
        const entity =  this.getByid(id);
        entity.polygon.material = color;
        entity.polygon.show = true;
    }

    getByid(id){
        return this._overlayLayer.entities.getById(id)
    }


    addPolygon(positions,[i,j],ownId=true){
        let orangePolygon = this._overlayLayer.entities.add({
            name: "gdwater Orange polygon with per-position heights and outline",
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
                perPositionHeight: true,
                ...this._style
            },
            id:ownId ? this._style.type+[i,j] : undefined,
        });
        return orangePolygon; 
    }

    clearAll(){
        this._overlayLayer.entities.removeAll();
    }

}

export default XLPolygon