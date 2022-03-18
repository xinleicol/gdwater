import RectangleDao from "../../Dao/RectangleDao.js"
import XLBox from "../XLBox.js"
import Computer from "./Computer.js"



class ComputerRectangle extends Computer{
    // extendX\extendY x方向和y方向延伸出的小矩形个数
    constructor(rectangle, cellDao, extendX = 0,extendY= 0){
        super()
        if (!rectangle) {
            return
        }
        this._rectangle = rectangle
        this._cellDao = cellDao
        this._xs = cellDao.xNumber
        this._ys = cellDao.yNumber
        this._recs = undefined
        this._xlbox = new XLBox()
        this._extendX = extendX
        this._extendY = extendY
        
        this._init()
        
        // this._computer()
    }

    get cellDao(){return this._cellDao}

    get rectangles(){
        return this._recs
    }

    _init(){
        this._cellDao._ex = this._extendX
        this._cellDao._ey = this._extendY
        this._divideBoundingRectangle(); //划分网格
    }

    //主函数
    computer(){
         // this._computer()
        this._computerWithScale();
        return this._recs
    }

    /**
     * 主函数
     * @param {下标数组} arrs 
     * @returns dao数组
     */
    computerRectangleDaos(arrs){
        return this._computerRectangleDaos(arrs);
    }

    _computer(){
        let rec = this._rectangle
        let lnt = rec.east - rec.west
        let lat = rec.north - rec.south
        let eachLnt = lnt / this._xs
        let eachLat = lat / this._ys
        this._setValueToDao(eachLnt, eachLat, '弧度')

        let recs = []
        for (let i = 0; i < this._xs; i++) {
            for (let j = 0; j < this._ys; j++) {
                let rect = new Cesium.Rectangle(
                    rec.west + eachLnt*i,
                    rec.south + eachLat*j,
                    rec.west + eachLnt * (i+1),
                    rec.south + eachLat*(j+1)
                )
                let center = Cesium.Rectangle.center(rect, new Cesium.Cartographic())
                let dao = new RectangleDao(rect, [i,j], center)
                recs.push(dao)
            } 
        }
        this._recs = recs
        return recs
    }

    //给rectangleDao赋值
    _setValueToDao(l, w, u ,ls, ws){
        l ? this._cellDao.length = l:true;
        w?this._cellDao.width = w:true;
        u?this._cellDao.unit = u:true;
        ls?this._cellDao.xNumber = ls:true;
        u?this._cellDao.yNumber = ws:true;
    }


    /**
     * 已知当个网格长度，如1*1，划分网格，
     * 创建rectangledao类，并存入recs数组中 
     * 以左下角为起点切分
     */
    _computerWithScale(){
        if (!this._radiansEachMeterLnt | !this._radiansEachMeterLat) {
            return;
        }
        let rec = this._rectangle;
        let radiansEachMeterLnt = this._radiansEachMeterLnt;
        let radiansEachMeterLat = this._radiansEachMeterLat;
        let xNumber = this._cellDao.xNumber;
        let yNumber = this._cellDao.yNumber;
        this._setValueToDao(null, null, '米',xNumber,yNumber);
        let recs = []
        for (let i = 0; i < xNumber; i++) {
            for (let j = 0; j < yNumber; j++) {
                let rect = new Cesium.Rectangle(
                    rec.west + radiansEachMeterLnt*i,
                    rec.south + radiansEachMeterLat*j,
                    rec.west + radiansEachMeterLnt * (i+1),
                    rec.south + radiansEachMeterLat*(j+1)
                )
                let center = Cesium.Rectangle.center(rect, new Cesium.Cartographic())
                let dao = new RectangleDao(rect, [i,j], center) 
                recs.push(dao)
            } 
        }
        this._recs = recs

        this._setNewBoundingRectangle(rec,xNumber,yNumber,radiansEachMeterLnt, radiansEachMeterLat)
        return recs
   }

   /**
    * 
    * @param {边界矩形} rec 
    * @param {x方向 个数} xNumber 
    * @param {y方向个数} yNumber 
    * @param {单位经度} radiansEachMeterLnt 
    * @param {单位弧度} radiansEachMeterLat 
    */
   _setNewBoundingRectangle(rec,xNumber,yNumber,radiansEachMeterLnt,radiansEachMeterLat){
    let west = rec.west
    let south = rec.south
    let east = rec.west + radiansEachMeterLnt *xNumber
    let north = rec.south + radiansEachMeterLat*yNumber
    this._rectangle = new Cesium.Rectangle(west,south,east,north)
   }

    /**
     * 
     * @param {点1 弧度表示} rad1 
     * @param {点2 弧度表示} rad2 
     * @param {两点之间的弧长} fullLength 
     * @param {单位长度 米} eachLength 
     * @returns 计算单位长度下的弧长
     */
    _computerRadiansOneMeter(rad1,rad2,fullLength,eachLength){
        let cartes1 = this._xlbox.radiansToCartesian3(rad1);
        let cartes2 = this._xlbox.radiansToCartesian3(rad2);
        let distance = this._xlbox.distanceFromCartesian3(cartes1,cartes2);
        let radiansEachMeter = fullLength/distance *eachLength ;
        return radiansEachMeter;
    }


    /**
     * 给包围盒按照划分大小进行划分网格，并将划分数量在dao中设置
     * @returns 若以划分则返回
     */
    _divideBoundingRectangle(){
        if (this._radiansEachMeterLnt & this._radiansEachMeterLat) {
            return;
        }
        let rec = this._rectangle
        let lnt = rec.east - rec.west
        let lat = rec.north - rec.south
        let southeast = Cesium.Rectangle.southeast(rec, new Cesium.Cartographic());
        let southwest = Cesium.Rectangle.southwest(rec, new Cesium.Cartographic());
        let northeast = Cesium.Rectangle.northeast(rec, new Cesium.Cartographic());
        let radiansEachMeterLnt = this._computerRadiansOneMeter(southeast,southwest,lnt,this.cellDao.length);
        let radiansEachMeterLat = this._computerRadiansOneMeter(southeast,northeast,lat,this.cellDao.width);
        let xNumber = Math.floor(lnt / radiansEachMeterLnt +1) + this._extendX;
        let yNumber = Math.floor(lat / radiansEachMeterLat +1) + this._extendY;
        this._setValueToDao(null, null, '米',xNumber,yNumber);
        this._radiansEachMeterLnt = radiansEachMeterLnt;
        this._radiansEachMeterLat = radiansEachMeterLat;
    }

    /**
     * 根绝下标计算rectangle
     * @param {数组 下标[i,j]} arrs 
     * @returns 返回rectangledao类型的数组
     */
    _computerRectangleDaos(arrs){
        if (this._radiansEachMeterLnt & this._radiansEachMeterLat) {
            return;
        }
        Array.isArray(arrs) ? true: arrs = [arrs];
        Array.isArray(arrs[0]) ? true: arrs = [arrs];
        let rec = this._rectangle;
        let radiansEachMeterLnt = this._radiansEachMeterLnt;
        let radiansEachMeterLat = this._radiansEachMeterLat;
        let results = [];
        for (let i = 0; i < arrs.length; i++) {
            const element = arrs[i];
            let rect = new Cesium.Rectangle(
                rec.west + radiansEachMeterLnt*element[0],
                rec.south + radiansEachMeterLat*element[1],
                rec.west + radiansEachMeterLnt * (element[0]+1),
                rec.south + radiansEachMeterLat*(element[1]+1)
            )
            let dao = new RectangleDao(rect, element);
            results.push(dao);
        }
        return results;
       
    }

}

export default ComputerRectangle