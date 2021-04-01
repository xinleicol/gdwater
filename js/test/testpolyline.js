import XLBoxGeometry from '../utils/XLBoxGeometry.js'
import XLBoxParticle from '../utils/XLBoxParticle.js'
import XLBoxPosition from '../utils/XLBoxPosition.js'
import XLBoxFun from '../utils/XLBoxFun.js'
import XLComputer from '../utils/XLComputer.js'

let dimensions = new Cesium.Cartesian3(100000.0, 100000.0, 50000.0)
let centerPoint = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)
let offsets = [
    new Cesium.Cartesian3(0.0, 0.0, 50000.0),
    new Cesium.Cartesian3(100000.0, 0.0, 50000.0),
    new Cesium.Cartesian3(100000.0, 100000.0, 50000.0),
    new Cesium.Cartesian3(-100000.0, 100000.0, 50000.0),
    new Cesium.Cartesian3(0.0, 100000.0, 50000.0),
    new Cesium.Cartesian3(-100000.0, 0.0, 50000.0),
    new Cesium.Cartesian3(-100000.0, -100000.0, 50000.0),
    new Cesium.Cartesian3(0.0, -100000.0, 50000.0),
    new Cesium.Cartesian3(100000.0, -100000.0, 50000.0)]

let XLGeo = new XLBoxGeometry(centerPoint,dimensions,offsets)
let startPosition = XLGeo.computerWorldPositionFromCenter(offsets[0],centerPoint)
let endPosition = XLGeo.computerWorldPositionFromCenter(offsets[1],centerPoint)
XLGeo.generate()
XLGeo.generateTrailPloyLine(startPosition,endPosition)
