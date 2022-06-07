import RectangleCellDao from "../Dao/RectangleCellDao.js";
import BoundingRectangle from "../utils/base/BoundingRectangle.js";
import Computer from "../utils/computer/Computer.js";
import ComputerColor from "../utils/computer/ComputerColor.js";
import ComputerRectangle from "../utils/computer/ComputerRectangles.js";
import RectangleClip from "../utils/dispose/RectangleClip.js";
import AddRectangle from "../utils/entity/AddRectangle.js";
import HeightMatrix from "../utils/transform/HeightMatrix.js";

class Middleware extends Computer {

    stripeMaterial = new Cesium.StripeMaterialProperty({
        evenColor: Cesium.Color.WHITE.withAlpha(0.5),
        oddColor: Cesium.Color.BLUE.withAlpha(0.5),
        repeat: 5.0,
    });
    constructor(viewer, boundingPositions =[
        [118.7436, 32.24981],
        [118.74304, 32.25009],
        [118.74267, 32.25026],
        [118.74299, 32.25061],
        [118.74351, 32.25100],
        [118.74418, 32.25034],
        [118.74348, 32.24999]
    ]) {
        super();
        this._viewer = viewer;
        this._boundingPoints = boundingPositions;
        this._boundingRec = new BoundingRectangle(boundingPositions, 'degree', {
            show: false
        });
        this._rec = this._boundingRec.rectangle
        this._recClip = undefined;
        this._rectangleCellDao = undefined;
        this._computerRectangle = undefined;
        this._heightMatrix = undefined;
        this._matrix = undefined;
        this._computerColor = new ComputerColor()
        this._addRectangle = undefined;
        this._size = [5,5]
    }

    /**
     * @param {number[]} s
     */
    set size(s){
        this._size = s;
    }

    get rec() {
        return this._rec
    }
    get matrix() {
        return this._matrix
    }
    get rectangleCellDao() {
        return this._rectangleCellDao
    }
    get computerRectangle() {
        return this._computerRectangle
    }
    get boundingPositions(){
        return this._boundingPoints
    }
    /**
     * @param {number[][]} b
     */
    set boundingPositions(b){
        this._boundingPoints = b
    }

    // 主程序 {是否生成划分网格} flag 
    async computer(flag) {
        this.setView();
        this.clip();
        this.splite();
        if(flag){
            this.division();
            this.showDivision(false);
        }
        return await this.getHeightMatrix();

    }

    setView() {
        this._viewer.camera.setView({
            destination: this._rec
        });
    }

    clip() {
        this._recClip = new RectangleClip(viewer, this._rec)
        this._recClip.clip()
    }

    // 矩形划分
    splite() {
        this._rectangleCellDao = new RectangleCellDao(null, null, ...this._size);
        this._computerRectangle = new ComputerRectangle(this._rec, this._rectangleCellDao)
        this._computerRectangle.computer();
    }

    // 获取高度矩阵
    async getHeightMatrix() {
        this._heightMatrix = new HeightMatrix(this._rectangleCellDao)
        this._heightMatrix.rectangleDaos = this._computerRectangle.rectangles
        let matrix = await this._heightMatrix.getHeightMatrix();
        this._matrix = matrix;
        return matrix;
    }


    // 划分网格并显示
    division(s={}) {
        let style = {
            outline: true,
            fill: false,
            outlineColor: Cesium.Color.WHITE,
        }
        Object.assign(s, style);
        if (this._computerRectangle) {
            this._addRectangle = new AddRectangle(this._computerRectangle.rectangles)
            this._addRectangle.changeStyle(style)
            this._addRectangle._getEntities(true);
        }
    }

    // 显示
    showDivision(f){
        this._addRectangle.isShow(f)
    }

    /**
     * 删除所有实体
     */
    clearAll(){
        this._addRectangle.clearAll();
    }


    enableClip(flag) {
        if(this._recClip){
            this._recClip.enabled(flag)
        }
    }


    // 绘制采样点
    drawPoints(show){
        if(this._boundingPolygon){
            this._boundingPolygon.show = show;
            return;
        }
        let arr = this.boundingPositions.flat();
        this._boundingPolygon = viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArray(arr)
              ),
              outline: true,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 10,
              material: Cesium.Color.DEEPSKYBLUE,
              height:0,
            },
          });
    }

    // 改变所有网格颜色
    changeDivisionColor(color){
        this._addRectangle.changeColorAll(color);
    }


}

export default Middleware;