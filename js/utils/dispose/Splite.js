import RectangleCellDao from "../../Dao/RectangleCellDao.js";
import BoundingRectangle from "../base/BoundingRectangle.js";
import ComputerRectangle from "../computer/ComputerRectangles.js";
import GdwaterLevelMatrix from "../transform/GdwaterLevelMatrix.js";
import HeightMatrix from "../transform/HeightMatrix.js";
import XLBox from "../XLBox.js";
import Dispose from "./Dispose.js";
import RectangleClip from "./RectangleClip.js";

/**
 * 潜水面污染扩散处理类
 */
class Splite extends Dispose {
    // extendX延伸出的x方向小矩形个数 用于角点计算
    constructor(extendX = 0, extendY = 0, boundingPositions = [
        [118.7426057038760, 32.2504552130810],
        [118.7429255928240, 32.2497469657935],
        [118.7433262661830, 32.2499205123251],
        [118.7440610544440, 32.2503070328395],
        [118.7434864037540, 32.2510766586447],
        [118.7432226284700, 32.2509838788282],
    ],rectangle, rectangleCellDao, recdaos) {
        super()
        this._boundingPositions = boundingPositions
        this._rectangle = rectangle //包圍盒邊界矩形
        this._rectangleCellDao = rectangleCellDao
        this._recdaos = recdaos
        this._x = 10
        this._y = 10
        this._extendX = extendX
        this._extendY = extendY
        this._recClip = undefined;
        this._xlbox = new XLBox();
        this._boundingBox = undefined; //包围盒entities
        this._hNumber = 0; //包气带z方向的网格数量

    }

    get hNumber(){
        return this._hNumber;
    }

    get cellSize(){
        return this._x + ''+ this._y;
    }

    /**
     * 存到localstorage 
     * @param {大矩形} rectangleCellDao 
     * @returns 高程水位数组
     */
    async getMatrix(m = 'mark') {
        let rectangleCellDao = this._rectangleCellDao;
        let recdaos = this._recdaos;
        let mark = localStorage.getItem(m)
        let heightMatrix;
        let waterMatrix;
        if (mark === rectangleCellDao.toString()) {
            heightMatrix = JSON.parse(localStorage.getItem(m+'heightMatrix'))
            waterMatrix = JSON.parse(localStorage.getItem(m+'waterMatrix'))

        } else {
            ({
                heightMatrix,
                waterMatrix
            } = await this._getHeightsAndLevel(rectangleCellDao, recdaos))
            localStorage.setItem(m, rectangleCellDao.toString())
            localStorage.setItem(m+'heightMatrix', JSON.stringify(heightMatrix))
            localStorage.setItem(m+'waterMatrix', JSON.stringify(waterMatrix))
        }
        return {
            heightMatrix,
            waterMatrix
        }
    }

    /**
     * 获取高度、地下水位矩阵
     * @param {边界矩形} rectangleCellDao 
     * @param {划分的小矩形} recdaos 
     * @returns 高度、地下水位矩阵
     */
    async _getHeightsAndLevel(rectangleCellDao, recdaos) {
        let heightMatrixObj = new HeightMatrix(rectangleCellDao, recdaos)
        let heightMatrix = await heightMatrixObj.getHeightMatrix();
        let waterMatrixObj = new GdwaterLevelMatrix(rectangleCellDao, recdaos)
        let waterMatrix = await waterMatrixObj.getMatrix()
        return {
            heightMatrix,
            waterMatrix
        }
    }

    // 设置延伸出的小矩形个数
    setExtend(x, y) {
        this._extendX = x;
        this._extendY = y;
    }

    get daos() {
        return [this._rectangleCellDao, this._recdaos]
    }

    // 生成包围盒
    generateBoundingBox(maxHeight, minWater, flag) {
        const {
            southwest,
            northeast
        } = this._getPosition(this._rectangle, maxHeight, minWater)
        const {
            boxCenterWorld,
            dimensions
        } = this._buildModelCoor(southwest, northeast, maxHeight, minWater)
        this._generate(boxCenterWorld, dimensions, flag);
    }

    showBoundingBox(f) {
        if (this._boundingBox) {
            this._boundingBox.show = f;
        }
    }

    /**
     * 生成包围盒
     * @param {世界坐标} worldPosition 
     * @param {长宽高} dimensions 
     */
    _generate(worldPosition, dimensions, show) {
        let box = viewer.entities.add({
            position: worldPosition,
            name: "bounding box all area.",
            box: {
                dimensions: dimensions,
                material: Cesium.Color.ORANGE.withAlpha(0.5),
                outline: true,
                outlineColor: Cesium.Color.BLACK,
            },
            show: show,
        });
        this._boundingBox = box;
    }

    /**
     * 
     * @param {包围矩形} rec 
     * @param {最大高度} maxheight 
     * @param {最小高度} minWater 
     * @returns 包围盒最大高度上的两个角点
     */
    _getPosition(rec) {
        let southwest1 = Cesium.Rectangle.southwest(rec, new Cesium.Cartographic())
        let northeast1 = Cesium.Rectangle.northeast(rec, new Cesium.Cartographic())
        let southwest = Cesium.Cartographic.toCartesian(southwest1)
        let northeast = Cesium.Cartographic.toCartesian(northeast1)
        return {
            southwest,
            northeast
        }
    }

    /**
     * 
     * @param {角点|模型坐标原点} southwest 
     * @param {角点} northeast 
     * @param {最大高度} maxheight 
     * @param {最小高度} minWater 
     * @returns box的世界坐标和长宽高
     */
    _buildModelCoor(southwest, northeast, maxheight, minWater) {
        let xlbox = this._xlbox;
        let northeastModel = xlbox.computerModelPositionFromCenter(northeast, southwest)
        let boxCenterModel = Cesium.Cartesian3.divideByScalar(northeastModel, 2, new Cesium.Cartesian3())
        boxCenterModel.z = (maxheight + minWater) / 2
        let dimensions = new Cesium.Cartesian3(northeastModel.x, northeastModel.y, (maxheight - minWater))
        let boxCenterWorld = xlbox.computerWorldPositionFromCenter(boxCenterModel, southwest)
        return {
            boxCenterWorld,
            dimensions
        }
    }

    // 改变网格长宽
    setCellSize(x, y) {
        this._x = x
        this._y = y
    }

    dispose() {
        this.getBoundingRec()
        this.clip()
        this.spliteRec()
    }

    disposeWithoutClip() {
        let boundingRec = new BoundingRectangle(this._boundingPositions, 'degree', {
            show: false
        });
        this._rectangle = boundingRec.rectangle
        this.spliteRec();
    }

    setView() {
        viewer.camera.setView({
            destination: this._rectangle
        });
    }

    getBoundingRec() {
        let boundingRec = new BoundingRectangle(this._boundingPositions, 'degree', {
            show: false
        });
        this._rectangle = boundingRec.rectangle
        viewer.camera.setView({
            destination: this._rectangle
        });
        return this._rectangle;
    }

    /**
     * 开挖
     * @param {矩形} rec 
     */
    clip() {
        this._recClip = new RectangleClip(viewer, this._rectangle)
        this._recClip.clip()
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

    /**
     * 按长度切分网格
     * @returns 返回小矩形
     */
    spliteRec() {
        let rectangleCellDao = new RectangleCellDao(null, null, this._x, this._y);
        let computerRectangle = new ComputerRectangle(this._rectangle, rectangleCellDao, this._extendX, this._extendY)
        let recdaos = computerRectangle.computer();
        this._rectangleCellDao = rectangleCellDao
        this._recdaos = recdaos
        return {
            rectangleCellDao,
            recdaos
        };
    }

    /**
     * 求二维数组的最大值最小值
     * @param 二维数组{} matrix
     * ，fun max || min 
     * @returns 最大小值
     */
    maxmin(matrix, fun = 'max') {
        let arr = matrix.map(element => {
            return Math[fun].apply(null, element)
        })
        let res = Math[fun].apply(null, arr)
        return res;
    }

     /**
     * 
     * @param {最大高度} max 
     * @param {小} min 
     * @param {一个网格高度} zlength 
     * @returns 网格数量
     */
    getHNumber(max, min, zlength) {
        const h = Math.floor((max - min) / zlength) + 1
        this._hNumber = h;
        return h;
    }


    // 水位矩阵加工预处理
    doWaterMatrix(waterMatrix,value){
        for(let i=0;i<waterMatrix.length ;i++){
            const water = waterMatrix[i];
            for(let j=0; j< water.length; j++){
                water[j] += value;
            }
        }
    }
    
    lookAt(){
        const centerCar = Cesium.Rectangle.center(this._rectangle, new Cesium.Cartographic());
        const res = Cesium.Cartographic.toCartesian(centerCar, Cesium.Ellipsoid.WGS84, new Cesium.Cartesian3())
        viewer.camera.lookAt(res, new Cesium.Cartesian3(0.0, -200, 200.0));
    }

    cancleLookAt(){
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY) ;
    }
}

export default Splite