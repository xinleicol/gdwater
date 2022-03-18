import GdwaterLevelMatrix from "../transform/GdwaterLevelMatrix.js"
import HeightMatrix from "../transform/HeightMatrix.js"
import XLBox from "../XLBox.js"
import XLPolygon from "../XLPolygon.js"
import Computer from "./Computer.js"
import ComputerColor from "./ComputerColor.js"


class ComputerGdwater extends Computer {


    DEF_STYLE = {
        material: Cesium.Color.ORANGE.withAlpha(0.6),
        type: 'gdwater-polygon',
        show:true,
    }

    constructor(rec, cellDao, recdaos) {
        super()
        this._recdaos = recdaos //单元矩形
        this._rec = rec //边界矩形
        this._cellDao = cellDao //dao类 包括个数长度等
        this._xlbox = new XLBox()
        this._gdwaterMatrix = undefined
        this.type = 'gdwater-polygon';
        this._xlgon = new XLPolygon() //生成实体类
        this._computerColor = new ComputerColor(); //计算颜色类
        this._init()
    }

    computer() {

    }


    show(flag){
        this._xlgon.show(flag)
    }
    /**
     * 设置样式
     * @param {样式} s 
     */
    setStyle(s) {
        this.DEF_STYLE = s
        this._xlgon.style = this.DEF_STYLE
        s.type ? this.type = s.type : true
    }

    clearAll(){
        this._xlgon.clearAll();
    }
    
    /**
     * 生成多面体
     * @param {角点矩阵} matrix 
     */
    generate(matrix,ownId) {
        for (let i = 0; i < matrix.length - 1; i++) {
            for (let j = 0; j < matrix[i].length - 1; j++) {
                let arr1 = matrix[i][j];
                let arr2 = matrix[i][j + 1];
                let arr3 = matrix[i + 1][j + 1];
                let arr4 = matrix[i + 1][j];

                let result = arr1.concat(arr2, arr3, arr4)
                this._xlgon.addPolygon(result, [i, j],ownId)
            }
        }

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


    changeColor(id, color) {
        this._xlgon.changeColor(id, color)
    }

    /**
     * 类的初始化
     */
    _init() {
        // this._cellDao._xs += 1
        // this._cellDao._ys += 1
        this._gdwaterMatrix = new GdwaterLevelMatrix(this._cellDao, this._recdaos)

        this._xlgon.style = this.DEF_STYLE
    }


    /**
     * 
     * @param {矩阵} matrix 
     * @param {放大因子} radio 
     * @returns 
     */
    exaggerateWater(matrix, radio = 2) {
        if(radio === 1) return matrix;
        let r = localStorage.getItem('radio')
        let res;
        if (r === radio) {
            waterCornerMatrix = JSON.parse(localStorage.getItem('exaggerateMatrix'))
        } else {
            res = this._gdwaterMatrix.exaggerateWater(matrix, radio)
            localStorage.setItem('radio', radio)
            localStorage.setItem('exaggerateMatrix', JSON.stringify(res))
        }
        return res
    }

    /**
     * 发送请求矩形角点（左下点）经纬度高程矩阵
     * @returns 角点高程矩阵
     */
    async getlevelMatrix() {
        let corner = localStorage.getItem('corner')
        let waterCornerMatrix;
        const rectangleCellDao = this._cellDao
        if (corner === rectangleCellDao.toString() + this.type) {
            waterCornerMatrix = JSON.parse(localStorage.getItem('waterCornerMatrix'))

        } else {
            waterCornerMatrix = await this._gdwaterMatrix.getMatrixCorners()
            localStorage.setItem('corner', rectangleCellDao.toString() + this.type)
            localStorage.setItem('waterCornerMatrix', JSON.stringify(waterCornerMatrix))
        }
        return waterCornerMatrix
    }


    /**
     * 存到localstorage 
     * @param {大矩形} rectangleCellDao 
     * @returns 高程水位数组
     */
    async getWaterMatrix(rectangleCellDao, recdaos) {
        let mark = localStorage.getItem('mark')
        let waterMatrix;
        if (mark === rectangleCellDao.toString()) {
            waterMatrix = JSON.parse(localStorage.getItem('waterMatrix'))

        } else {
            ({
                waterMatrix
            } = await this.getHeightsAndLevel(rectangleCellDao, recdaos))
            localStorage.setItem('mark', rectangleCellDao.toString())
            localStorage.setItem('waterMatrix', JSON.stringify(waterMatrix))
        }
        return {
            waterMatrix
        }
    }

    /**
     * 获取高度、地下水位矩阵
     * @param {边界矩形} rectangleCellDao 
     * @param {划分的小矩形} recdaos 
     * @returns 高度、地下水位矩阵
     */
    async getHeightsAndLevel(rectangleCellDao, recdaos) {
        let waterMatrixObj = new GdwaterLevelMatrix(rectangleCellDao, recdaos)
        let waterMatrix = await waterMatrixObj.getMatrix()
        return {
            waterMatrix
        }
    }

}
export default ComputerGdwater