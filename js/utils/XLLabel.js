import XLType from './XLType.js'

class XLLabel {
    styles={
        font:'sans-serif 10px',
        pixelOffset: new Cesium.Cartesian2(5, 5),
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e6, 0.1),
    }
    labelCollection = undefined

    constructor() { 
        this.labelCollection = scene.primitives.add(new Cesium.LabelCollection())
    }
    
    gennerate(position,text){
        this.labelCollection.add({
            ...this.styles,
            position : position,
            text     : text.toString(),
            
        })
    }

    removeAll(){
        this.labelCollection.removeAll ()
    }

    addlabel(spreadArea,style) {
        XLType.determineDoubleArray(spreadArea)
        if (this.labelCollection) {
            this.removeAll()
        }
        if (style) {
            this.styles = style
        }
        spreadArea.forEach(element1 => {
            element1.forEach(element2 => {
                this.gennerate(element2.worldPosition,element2.cellMass)
            });
        });
    }
}

export default XLLabel