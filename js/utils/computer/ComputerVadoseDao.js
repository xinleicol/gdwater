//根据rectangle计算vadoseDao各个参数

import VadoseDao from "../../Dao/VadoseDao.js";
import XLBox from "../XLBox.js";
import XLBoxGeometry from "../XLBoxGeometry.js";
import XLPosition from "../XLPosition.js";
import Computer from "./Computer.js";
import ComputerColor from "./ComputerColor.js";

class ComputerVadoseDao extends Computer {

    DEF_STYLE = {
        show: false,
    }
    constructor(rectangle, xs, ys, zs, depth) {
        super()
        this._rec = rectangle
        this._vd = new VadoseDao(
            undefined, undefined, undefined, ys, xs, zs, depth 
        )
        this._modelMatrix = undefined
        this._dimensions = undefined
        this._xlGeo = undefined
        this._center = undefined //模型中点
        this._offset = undefined
        this._type = 'vadose-box'
        this._isWorldPosition = false //是否生成过流动线
        this._computerColor = new ComputerColor(); //计算颜色类
        this._xlGeoOther = undefined //第二个类
        

    }

    set type(t){
        this._type = t;
    }

    get type() {
        return this._type
    }

    get dimensions() {
        return this._dimensions
    }

    set dimensions(d){
        this._dimensions = d;
    }

    get offset() {
        return this._offset
    }

    set offset(o){
        this._offset = o;
    }
    
    get vadoseDao() {
        return this._vd
    }

    /**
     * @param {any} x
     */
    set xlGeo(x){
        this._xlGeo = x;
    }
    

    /**随机改变调色板
     * 
     * @param {} cells 
     */
    randomColor(cells) {
        this._computerColor.randomColor()
        this.updateColor(cells)
    }

    //更新所有污染元胞的颜色
    updateColor(cells) {
        this._computerColor.setColorToCell(cells);
        for (let i = 0; i < cells.length; i++) {
            const element = cells[i];
            let idStr = this.type + element.position;
            this.changeColor(idStr, element.color);
        }
    }

    //更新所有污染元胞的颜色
    updateColorCoupling(surfaceCells=[], vadoseCells=[], gdwaterCells=[]) {
        const cells = this._computerColor.setColorToCellCoupling(surfaceCells, vadoseCells, gdwaterCells);
        for (let i = 0; i < cells.length; i++) {
            const element = cells[i];
            let idStr = element.name + element.position;
            this.changeColor(idStr, element.color);
        }
    }


    /**
     * 生成流动线
     * @param {世界坐标} positions 
     */
    generatePloyline(positions) {
        this._xlGeo.generateTrailPloyline(positions)
    }

    /**
     * 给每个元胞数组世界坐标
     * @param {所有元胞数组} cells 
     */
    giveCellWorldPosition(cells) {
        if (this._isWorldPosition) return
        const vd = this._vd
        const xlPos = new XLPosition(this._center, this._dimensions, this._offset,
            vd._ys, vd._xs, vd._hs)
        xlPos.giveGridWorldAndModelPosition3D(cells)
        this._isWorldPosition = true
    }

    generate(ownStyle) {
        this._xlGeo ? true : this._xlGeo = new XLBoxGeometry(this._center, this._dimensions);
        ownStyle ? Object.assign(this._xlGeo.boxEntitiesStyle, this.DEF_STYLE) : true
        this._xlGeo.initBoxPosition3DUpdate(this._offset, this._vd.xNumber,
            this._vd.yNumber, this._vd.hNumber)
        this._xlGeo.generateByEntities(this._type)
    }

    // 生成xlgeo 生成其他box 避免共用污染
    generateOther(style){
        let xlGeo = new XLBoxGeometry(this._center, this._dimensions);
        Object.assign(xlGeo.boxEntitiesStyle, style)
        xlGeo.initBoxPosition3DUpdate(this._offset, this._vd.xNumber,
            this._vd.yNumber, this._vd.hNumber)
        xlGeo.generateByEntities('other');
        this._xlGeoOther = xlGeo;
    }

    isShowOther(f){
        this._xlGeoOther.isShowEntity(f);
    }

    showOrHidden() {
        this._xlGeo.showOrHidden()
    }

    isShowEnitty(f){
        this._xlGeo.isShowEntity(f);
    }


    isShowTrail(f) {
        this._xlGeo.isShowTrail(f);
    }

    // 是否生成流动线
    isGenerate() {
        if (this._xlGeo.trailPloys.values.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    changeColor(id, color = Cesium.Color.ORANGE.withAlpha(0.5)) {
        this._xlGeo.getAndSetBoxEntites(id, color)
    }

    computer() {
        this._getPoints()._setValue()
        return this._vd
    }



    _getPoints() {
        this._center = Cesium.Rectangle.center(this._rec, new Cesium.Cartographic())
        this._center = Cesium.Cartographic.toCartesian(this._center, Cesium.Ellipsoid.WGS84, new Cesium.Cartesian3())
        this._northeast = Cesium.Rectangle.northeast(this._rec, new Cesium.Cartographic())
        this._northeast = Cesium.Cartographic.toCartesian(this._northeast, Cesium.Ellipsoid.WGS84, new Cesium.Cartesian3())
        this._computer()
        return this
    }

    /**
     * 建立坐标系
     * @returns 当前对象
     */
    _computer() {
        let xlBox = new XLBox()
        this._modelMatrix = xlBox.computerModelMatrix(this._center)
        let neModel = xlBox.computerModelPositionFromCenter(this._northeast, this._center)
        let vd = this._vd
        let left = new Cesium.Cartesian3(neModel.x * 2, neModel.y * 2, vd._depth)
        let right = new Cesium.Cartesian3(vd._xs, vd._ys, vd._hs)
        this._dimensions = Cesium.Cartesian3.divideComponents(left, right, new Cesium.Cartesian3())
        return this
    }


    _setValue() {
        this._vd._center = this._center
        this._vd._dimensions = this._dimensions
        this._offset = new Cesium.Cartesian3(0, 0, this._vd._depth / 2)
        this._vd._offset = this._offset
        return this
    }


}

export default ComputerVadoseDao