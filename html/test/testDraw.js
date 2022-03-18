import SurfaceCell from "../../js/cells/SurfaceCell.js";
import RectangleCellDao from "../../js/Dao/RectangleCellDao.js";
import PollutedCellDao from "../../js/Dao/PollutedCellDao.js";
import RectangleDao from "../../js/Dao/RectangleDao.js";
import BoundingRectangle from "../../js/utils/base/BoundingRectangle.js";
import ComputerColor from "../../js/utils/computer/ComputerColor.js";
import ComputerRectangle from "../../js/utils/computer/ComputerRectangles.js";
import AddRectangle from "../../js/utils/entity/AddRectangle.js";
import Plot from "../../js/utils/interact/Plot.js";
import TerrainProvider from "../../js/utils/imagery/TerrainProvider.js";
import XLBoxGeometry from "../../js/utils/XLBoxGeometry.js";
import HeightMatrix from "../../js/utils/transform/HeightMatrix.js";
import RectangleClip from "../../js/utils/dispose/RectangleClip.js";
import ComputerVadoseDao from "../../js/utils/computer/ComputerVadoseDao.js";
import VadoseDao from "../../js/Dao/VadoseDao.js";
import VadoseZoneCell from "../../js/cells/VadoseZoneCell.js";
import XLPosition from "../../js/utils/XLPosition.js";
import GdwaterDao from "../../js/Dao/GdwaterDao.js";
import ComputerGdawaterDao from "../../js/utils/computer/ComputerGdawaterDao.js";
import GdwaterLevelMatrix from "../../js/utils/transform/GdwaterLevelMatrix.js";
import GdwaterLevelCell from "../../js/cells/GdwaterLevelCell.js";
import AddPoints from "../../js/utils/entity/AddPoints.js";

let plot = undefined
let polygon = undefined
let boundingRec = undefined
let addRectangle = new AddRectangle()
let surfaceCell = undefined
let pollutedCellDao = new PollutedCellDao([44, 44], 100)
let computerColor = new ComputerColor()
let rectangleDaos = undefined //存放rectangledao的数组

var test = function () {
    console.log(111);
    plot = new Plot(viewer, {})
    plot.draw(0, (overlay) => {
        polygon = overlay
        console.log(polygon);
    }, {})

    // let box = new XLBoxGeometry(Cesium.Cartesian3.fromDegrees(117,36), new Cesium.Cartesian3(1,1,1) )
    // box.initBoxPositionUpdate(null, 10, 10, 1)

}

function test2() {
    console.log(222);
    if (polygon.positions) {
        boundingRec = new BoundingRectangle(polygon.positions)
        let results = boundingRec._cartesian3ToDegree(polygon.positions)
        results.forEach(element => {
            console.log(element);
        });
    }
    

    // viewer.terrainProvider = Cesium.createWorldTerrain()
    // viewer.scene.globe.terrainExaggeration = 2

    // var rec = Cesium.Rectangle.fromDegrees(
    //     117.2,
    //     36.0,
    //     117.5,
    //     36.2
    // );

    // let recClip = new RectangleClip(viewer, boundingRec)
    // recClip.clip()
    // var redRectangle = viewer.entities.add({
    //     name: "Red translucent rectangle",
    //     rectangle: {
    //         coordinates: rec,
    //         material: Cesium.Color.RED.withAlpha(0.5),
    //         //heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    //         height: 5000,
    //         extrudedHeight: 8000,
    //         show: false
    //     },
    // });
    // let lnt = rec.east - rec.west
    // let eachLnt = lnt / 10
    // let recs = []
    // for (let i = 0; i < 10; i++) {
    //     let rect = new Cesium.Rectangle(
    //         rec.west + eachLnt*i,
    //         rec.south,
    //         rec.west + eachLnt * (i+1),
    //         rec.north
    //     )
    //     recs.push(rect)
    // }
    // let rectangleCellDao = new RectangleCellDao(90, 90)

    // let computerRectangle = new ComputerRectangle(rec, rectangleCellDao)
    // rectangleDaos = computerRectangle.recs


    // addRectangle = new AddRectangle(rectangleDaos)


    // recs.map(item => {101.40976767748109 101.40976767748109
    //     viewer.entities.add({
    //         name: "green little translucent rectangle",
    //         rectangle: {
    //             coordinates: item,
    //             material: Cesium.Color.GREEN.withAlpha(0.5),
    //             //heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    //             height: 5000,
    //             extrudedHeight: 8000,
    //         },
    //     });
    // })

    // let heightMatrix1 = new HeightMatrix(rectangleCellDao)
    // heightMatrix1.rectangleDaos = computerRectangle.recs
    // heightMatrix1.getHeightMatrix().then(matrix => {

    //     surfaceCell = new SurfaceCell(matrix, rectangleCellDao.xNumber, rectangleCellDao.yNumber)
    //     surfaceCell.setPollutedSourceCell(
    //         pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    //     )
    // })
    // console.log(heightMatrix1.matrix);

    // let heightMatrix = [
    //     [82, 82, 82, 82, 82, 81, 80, 78, 76],
    //     [82, 83, 84, 84, 84, 83, 81, 80, 77],
    //     [82, 84, 85, 85, 85, 85, 83, 82, 79],
    //     [82, 85, 86, 86, 86, 86, 85, 83, 81],
    //     [82, 85, 86, 87, 87, 87, 85, 84, 82],
    //     [82, 85, 86, 87, 88, 87, 86, 85, 84],
    //     [81, 84, 85, 86, 87, 87, 87, 86, 85],
    //     [81, 84, 85, 86, 87, 87, 87, 86, 85],
    //     [79, 83, 84, 85, 86, 86, 86, 86, 86]
    // ]

    // surfaceCell = new SurfaceCell(heightMatrix, 9, 9)
    // surfaceCell.setPollutedSourceCell(
    //     pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.originMass
    // )

    viewer.camera.setView({
        destination: boundingRec.rectangle
    });
}


function test3() {

    if (!surfaceCell) {
        return
    }
    let idStr = addRectangle.type + pollutedCellDao.position
    addRectangle.changeColor(idStr, "red")
    let pollutedArea = Array.from(surfaceCell.isPollutedArea)
    for (const item of pollutedArea) {
        surfaceCell.computerCellMass(item)
    }

    let position = pollutedCellDao.position
    let pollutedSource = surfaceCell.spreadArea[position[0]][position[1]]
    pollutedCellDao.outMass = pollutedCellDao.originMass - pollutedSource.cellMass
    console.log(pollutedCellDao.outMass);


    surfaceCell.isPollutedArea.map(item => {
        idStr = addRectangle.type + item.position

        // let color = computerColor.setAndGetColor(item.cellMass, pollutedCellDao.outMass)
        let color = computerColor.setAndGetColor(item.position, pollutedCellDao.position)
        addRectangle.changeColor(idStr, color)

    })
}

let vadoseZoneCell = undefined
let xlGeo = undefined
let vadoseInit = false

function test4() {
    viewer.terrainProvider = Cesium.createWorldTerrain()
    viewer.scene.globe.terrainExaggeration = 2
    var rec = Cesium.Rectangle.fromDegrees(
        117.20,
        36.05,
        117.25,
        36.10
    );

    // var position = Cesium.Cartographic.toCartesian(
    //     new Cesium.Cartographic.fromDegrees(-113.2665534, 36.0939345, 100)
    //   );


    let recClip = new RectangleClip(viewer, rec)
    recClip.clipDirection = 'inside'
    recClip.clip()

    let computerVD = new ComputerVadoseDao(rec, 120, 120, 3)
    let vadoseDao = new VadoseDao()
    vadoseDao = computerVD.computer()

    xlGeo = new XLBoxGeometry(vadoseDao.center, vadoseDao.dimensions)
    xlGeo.initBoxPosition3DUpdate(vadoseDao.offset, vadoseDao.yNumber,
        vadoseDao.xNumber, vadoseDao.hNumber)
    xlGeo.boxEntitiesStyle.material = Cesium.Color.AZURE.withAlpha(0.1),

        xlGeo.generateByEntities()

    let rectangleCellDao = new RectangleCellDao(120, 120)
    let computerRectangle = new ComputerRectangle(rec, rectangleCellDao)

    let heightMatrix1 = new HeightMatrix(rectangleCellDao)
    heightMatrix1.relative = true //计算相对高度
    heightMatrix1.rectangleDaos = computerRectangle.recs
    heightMatrix1.getHeightMatrix().then(matrix => {

        // console.log(matrix);
        let dimensions = new Cesium.Cartesian3(1, 1, 1)
        vadoseZoneCell = new VadoseZoneCell(matrix, 0,
            vadoseDao.yNumber, vadoseDao.xNumber, vadoseDao.hNumber, dimensions
        )
        // let xlPos = new XLPosition(vadoseDao.center, vadoseDao.dimensions, 
        //     vadoseDao.offset, vadoseDao.yNumber, vadoseDao.xNumber, vadoseDao.hNumber)
        // xlPos.giveGridWorldAndModelPosition3D(vadoseZoneCell.spreadArea)
        vadoseInit = true
    })
}

let time = 0
pollutedCellDao = new PollutedCellDao([59, 59, 1], 100)

function test5() {
    if (!vadoseInit) {
        return
    }
    if (time == 0) {
        vadoseZoneCell.setPollutantMass(
            pollutedCellDao.position[0], pollutedCellDao.position[1], pollutedCellDao.position[2], pollutedCellDao.originMass
        )
        time++
    } else {
        vadoseZoneCell.simulate()
        vadoseZoneCell.isPollutedArea.map(item => {
            let id = item.position
            let color = computerColor.setAndGetColor(item.position, pollutedCellDao.position)
            xlGeo.getAndSetBoxEntites(id, color)
        })
    }
    let mass = vadoseZoneCell.spreadArea[pollutedCellDao.position[0]][pollutedCellDao.position[1]][pollutedCellDao.position[2]].cellMass
    console.log(mass);

}

function test6() {
    console.log("test6");
    for (let i = 0; i < 60; i++) {
        test5()
    }
}

let gdwaterProvider = undefined

function test7() {
    let rec = Cesium.Rectangle.fromDegrees(
        117.20,
        36.05,
        117.25,
        36.10
    )
    let featureInfoFormat = new Cesium.GetFeatureInfoFormat('json', 'application/json', function (value) {
        console.log(value);
    })
    gdwaterProvider = new Cesium.WebMapServiceImageryProvider({
        url: 'http://localhost:8089/geoserver/water/wms',
        layers: 'water:gdwater',
        // getFeatureInfoFormats:featureInfoFormat
    })
    let imageryLayer = new Cesium.ImageryLayer(gdwaterProvider, {
        alpha: 0.5
    })

    viewer.imageryLayers.add(imageryLayer);


    let bounds = [118.624326, 31.850880000000004, 119.06480119199999, 32.180577]
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(118.7, 32.1, 5000)
    })

}

function test8(longitude, latitude) {
    // if (gdwaterProvider) {


    // let longitude = 118.7
    // let latitude = 32.1
    let minDivide = 0.0002709031105
    let bbox = [longitude - minDivide, latitude - minDivide, longitude + minDivide, latitude + minDivide]
    let url = 'http://localhost:8089/geoserver/water/wms?'+
        'request=GetFeatureInfo'+
        '&service=WMS'+
        '&version=1.1.1'+
        '&layers=water%3Agdwater'+
        '&styles='+
        '&format=image%2Fjpeg'+
        '&query_layers=water%3Agdwater'+
        '&info_format=application%2Fjson'+
        '&exceptions=application%2Fvnd.ogc.se_xml'+
        'FEATURE_COUNT=50'+
        '&X=50'+
        '&Y=50'+
        '&SRS=EPSG%3A404000'+
        '&WIDTH=101'+
        '&HEIGHT=101'+
        '&bbox='+bbox[0]+','+bbox[1]+','+bbox[2]+','+bbox[3]
    return new Promise(resolve =>{
        $.ajax({
            url: url,
            contentType: 'text/json',
            success: function (data) {
                resolve(data)
            },
    
        });
    })
   

    // http://localhost:8089/geoserver/water/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&FORMAT=image%2Fjpeg&TRANSPARENT=true&QUERY_LAYERS=water%3Agdwater&STYLES&LAYERS=water%3Agdwater&exceptions=application%2Fvnd.ogc.se_inimage&INFO_FORMAT=text%2Fhtml&FEATURE_COUNT=50&X=50&Y=50&SRS=EPSG%3A404000&WIDTH=101&HEIGHT=101&BBOX=118.77107282947347%2C32.03288135970413%2C118.84042402576253%2C32.10223255599319

    // gdwaterProvider.pickFeatures(256, 256, 0, 118.5, 32.1).then(value => {
    //     console.log(value);
    // })
    // let longitude = 118.7
    // let latitude = 32.1
    // let zoom = 0
    // let column = Math.floor((longitude + 180.0) / 180.0 * Math.pow(2, zoom));
    // let row = Math.floor((-latitude + 90) / 180.0 * Math.pow(2, zoom));
    // let leftPointLon = (column * 180.0) / Math.pow(2.0, zoom) - 180.0;
    // let leftPointLat = -((row * 180.0) / Math.pow(2.0, zoom) - 90.0);
    // let px1 = Math.round((longitude + 180) / 360 * Math.pow(2, zoom) * 256 % 256);
    // let py1 = Math.round((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / (2 * Math.PI)) * Math.pow(2, zoom) * 256 % 256);
    // let px2 = Math.round((leftPointLon + 180) / 360 * Math.pow(2, zoom) * 256 % 256);
    // let py2 = Math.round((1 - Math.log(Math.tan(leftPointLat * Math.PI / 180) + 1 / Math.cos(leftPointLat * Math.PI / 180)) / (2 * Math.PI)) * Math.pow(2, zoom) * 256 % 256);
    // let px = px1 - px2
    // let py = py1 -py2
    // console.log(px, py);
    // gdwaterProvider.pickFeatures(px, py, zoom, longitude, latitude).then(
    //     (value, reject) => {
    //     console.log(value);
    //     console.log(reject);
    // })
    // }
}

let gdwaterLevelCell = undefined
function test9(){
    viewer.terrainProvider = Cesium.createWorldTerrain()
    viewer.scene.globe.terrainExaggeration = 2
    let bounds = [118.624326, 31.850880000000004, 119.06480119199999, 32.180577]
    var rec = Cesium.Rectangle.fromDegrees(
        bounds[0],
        bounds[1],
        bounds[2],
        bounds[3]
    );
    let recClip = new RectangleClip(viewer, rec)
    recClip.clipDirection = 'inside'
    recClip.clip()

    let computerGD = new ComputerGdawaterDao(rec, 30, 30, 1)
    let gdwaterDao = new GdwaterDao()
    gdwaterDao = computerGD.computer()

    xlGeo = new XLBoxGeometry(gdwaterDao.center, gdwaterDao.dimensions)
    xlGeo.initBoxPositionUpdate(gdwaterDao.offset, gdwaterDao.xNumber,
        gdwaterDao.yNumber)
    xlGeo.boxEntitiesStyle.material = Cesium.Color.BLUE.withAlpha(0.3),
    xlGeo.generateByEntities('gdwater')

    let rectangleCellDao = new RectangleCellDao(30, 30)
    let computerRectangle = new ComputerRectangle(rec, rectangleCellDao)

    let gdwaterLevelMatrix = new GdwaterLevelMatrix(rectangleCellDao,computerRectangle.recs)
    gdwaterLevelMatrix.getMatrix()
    .then(matrix =>{
        gdwaterDao.waterLevel = matrix
        gdwaterLevelCell = new GdwaterLevelCell(
            matrix, gdwaterDao.velocity, gdwaterDao.yNumber, gdwaterDao.xNumber, gdwaterDao.dimensions
        )
    })
    // heightMatrix1.getHeightMatrix().then(matrix => {

    //     // console.log(matrix);
    //     let dimensions = new Cesium.Cartesian3(1, 1, 1)
    //     vadoseZoneCell = new VadoseZoneCell(matrix, 0,
    //         vadoseDao.yNumber, vadoseDao.xNumber, vadoseDao.hNumber, dimensions
    //     )
    //     // let xlPos = new XLPosition(vadoseDao.center, vadoseDao.dimensions, 
    //     //     vadoseDao.offset, vadoseDao.yNumber, vadoseDao.xNumber, vadoseDao.hNumber)
    //     // xlPos.giveGridWorldAndModelPosition3D(vadoseZoneCell.spreadArea)
    //     vadoseInit = true
    // })
    // let longitude = 118.7
    // let latitude = 32.1
    // test8(longitude, latitude).then(value =>{
    //     console.log(value);
    // });
}


pollutedCellDao = new PollutedCellDao([14,14],100)
function test10(){
    if (!gdwaterLevelCell) {
        return
    }
    if (gdwaterLevelCell.isPollutedArea.length == 0){
        gdwaterLevelCell.setPollutantMass(pollutedCellDao.position[1],pollutedCellDao.position[0],pollutedCellDao.originMass )
    }else{
        gdwaterLevelCell.updateCellMass()
    }
    gdwaterLevelCell.isPollutedArea.map(item => {
        let id = 'gdwater'+item.position
        let color = computerColor.setAndGetColor(item.position, pollutedCellDao.position)
        xlGeo.getAndSetBoxEntites(id, color)
    })
    let mass = gdwaterLevelCell.spreadArea[pollutedCellDao.position[0]][pollutedCellDao.position[1]].cellMass
    console.log(mass);

}

function test11(){
    for (let i = 0; i < 5; i++) {
        test10()        
    }
}

function test12(){
    viewer.terrainProvider = Cesium.createWorldTerrain()
    viewer.scene.globe.terrainExaggeration = 2
    let lon1 = 118.35
    let lat = 32
    let positions = []
    for (let i = 0; i < 10; i++) {
        positions.push(Cesium.Cartesian3.fromDegrees(lon1+0.003*i, lat))
    }
    let addPoints = new AddPoints(positions)
    viewer.camera.flyTo({
        destination:Cesium.Cartesian3.fromDegrees(lon1, lat, 500)
    });
}

//初始化飞行
function fly() {
    let boundingPositions = [
        [118.7436, 32.24981],
        [118.74304, 32.25009],
        [118.74267, 32.25026],
        [118.74299, 32.25061],
        [118.74351, 32.25100],
        [118.74418, 32.25034],
        [118.74348, 32.24999]
    ];
    let boundingRec = new BoundingRectangle(boundingPositions, 'degree', {
        show: false
    });
    let rec = boundingRec.rectangle
    viewer.terrainProvider = Cesium.createWorldTerrain()
    viewer.camera.setView({
        destination: rec
    });
}




document.getElementById('test').addEventListener('click', test);
document.getElementById('test2').addEventListener('click', test2);
document.getElementById('test3').addEventListener('click', test3);
document.getElementById('test4').addEventListener('click', test4);
document.getElementById('test5').addEventListener('click', test5);
document.getElementById('test6').addEventListener('click', test6);
document.getElementById('test7').addEventListener('click', test7);
document.getElementById('test8').addEventListener('click', test8);
document.getElementById('test9').addEventListener('click', test9);
document.getElementById('test10').addEventListener('click', test10);
document.getElementById('test11').addEventListener('click', test11);
document.getElementById('test12').addEventListener('click', test12);
document.getElementById('test13').addEventListener('click', fly);
