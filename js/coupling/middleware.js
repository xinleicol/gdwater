import RectangleCellDao from "../Dao/RectangleCellDao.js";
import BoundingRectangle from "../utils/base/BoundingRectangle.js";
import Computer from "../utils/computer/Computer.js";
import ComputerColor from "../utils/computer/ComputerColor.js";
import ComputerRectangle from "../utils/computer/ComputerRectangles.js";
import RectangleClip from "../utils/dispose/RectangleClip.js";
import AddRectangle from "../utils/entity/AddRectangle.js";
import HeightMatrix from "../utils/transform/HeightMatrix.js";

class Middleware extends Computer {
    
    constructor(viewer, boundingPositions =[
        [118.7426057038760, 32.2504552130810],
        [118.7429255928240, 32.2497469657935],
        [118.7433262661830, 32.2499205123251],
        [118.7440610544440, 32.2503070328395],
        [118.7434864037540, 32.2510766586447],
        [118.7432226284700, 32.2509838788282],
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
        this._size = [5,5]
        this._isGenerate = false; //是否生成了
        this._recdaos = null;
    }

    get recdaos(){
        return this._recdaos;
    }

    get dimensions(){
        return new Cesium.Cartesian3(this.rectangleCellDao.length, 
            this.rectangleCellDao.width,
            0)
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

    // 主程序 
    async computer() {
        this.setView();
        this.clip();
        this.splite();
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
        this._recdaos = this._computerRectangle.computer();
    }

    // 获取高度矩阵
    async getHeightMatrix() {
        this._heightMatrix = new HeightMatrix(this._rectangleCellDao)
        this._heightMatrix.rectangleDaos = this._computerRectangle.rectangles
        let matrix = await this._heightMatrix.getHeightMatrix();
        this._matrix = matrix;
        return matrix;
    }

    // 获取包围盒中点
    async getCenter() {
        const centerCar = Cesium.Rectangle.center(this.rec, new Cesium.Cartographic());
        const position = await this._heightMatrix.getHeight([centerCar]);
        const res = Cesium.Cartographic.toCartesian(position[0], Cesium.Ellipsoid.WGS84, new Cesium.Cartesian3())
        return res;
    }

    // 划分网格并显示
    division(s={}) {
        if(this._isGenerate)  return;
        let style = {
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            height: 15.3,
            material: Cesium.Color.GREEN.withAlpha(0.6),
        }
        Object.assign(s, style);
        if (this._computerRectangle) {
            this._addRectangle = new AddRectangle(this._computerRectangle.rectangles)
            this._addRectangle.changeStyle(style)
            this._addRectangle._getEntities(true);
        }
        this._isGenerate = true;
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


      /**
     * 改变开挖方向
     */
    changeClipDirection() {
        this._recClip.changeClipDirection()
    }

    enableClip(flag) {
        this._recClip.enabled(flag)
    }

}

export default Middleware;