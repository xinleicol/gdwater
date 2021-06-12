//所有网格对象的父类
//暂时弃用

import XLType from "../XLType.js";

export default class XLCommonBox{
    constructor(){}

    //删除,通过instance添加的实体
    remove(){
        if (XLType.isDefined(this.xlGeo)) {
            this.xlGeo.removeAllBoxs();
        }
    }

    //删除通过entity添加的实体
    removeByEntity(){
        if (XLType.isDefined(this.xlGeo)) {
            this.xlGeo.removeAllBoxsByEntities();
        }
    }

}