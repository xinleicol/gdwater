import XLBoxGeometry from './utils/XLBoxGeometry.js'
import XLBoxParticle from './utils/XLBoxParticle.js'

let dimensions = new Cesium.Cartesian3(1000000.0, 1000000.0, 500000.0)
let centerPoint = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
let offsets = [new Cesium.Cartesian3(0.0, 0.0, 1000000.0),new Cesium.Cartesian3(0.0, 1000000.0, 1000000.0)]

let XlBox = new XLBoxGeometry(centerPoint,dimensions,offsets)
XlBox.generate()


let XLPar = new XLBoxParticle(centerPoint,offsets[0])

XLPar.generate()