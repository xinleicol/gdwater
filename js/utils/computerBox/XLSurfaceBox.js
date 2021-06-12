import XLBoxGeometry from "../XLBoxGeometry.js";
import XLType from "../XLType.js";
import XLCommonBox from "./XLCommonBox.js";

//划分网格并显示
export default class XLSurfaceBox extends XLCommonBox{
    constructor(center, dimensions, lengthNum, widthNum){
        super();
        XLType.determineCartesian3s(center ,dimensions);
        XLType.notBeNull(lengthNum, widthNum);
        this._center = center;
        this._dimensions = dimensions;
        this._lengthNum = lengthNum;
        this._widthNum = widthNum;
    }

    //生成网格
    generate(offset){
        XLType.determineCartesian3(offset);
        this.offset = offset;

        this.boxLength = this._dimensions.x / this._lengthNum;
        this.boxWidth = this._dimensions.y / this._widthNum;
        this.boxHeight = this._dimensions.z;
        let smallBoxDimensions = new Cesium.Cartesian3(this.boxLength, this.boxWidth, this._dimensions.z);
        let xlGeo = new XLBoxGeometry(this._center, smallBoxDimensions);
        xlGeo.initBoxPositionUpdate(offset, this._lengthNum, this._widthNum);
        xlGeo.generate();
        this.xlGeo = xlGeo;
    }

    

    //参数改变则更新网格
    update(isChanged){
        if (isChanged & XLType.isDefined(this.xlGeo)) {
            this.xlGeo.removeAllBoxs();
            this.generate(this.offset);
        } 
    }

    //当偏移量改变时
    updateWhenOffset(offset){
        XLType.determineCartesian3(offset);
        this.offset = offset;
        if (!XLType.isDefined(this.xlGeo)) {
            this.xlGeo.removeAllBoxs();
            xlGeo.initBoxPositionUpdate(offset, this._lengthNum, this._widthNum);
            xlGeo.generate();
        }
    }
    
}