/**
 * 判断类型并报错
 */

class XLType{
    constructor(){

    }

    // 判断数组
    static determineArray(arr){
        if (!Array.isArray(arr)) {
            throw new TypeError('请传入一个数组对象...')
        }
    }

    // 判断二维数组
    static determineDoubleArray(arrs){
        this.determineArray(arrs)
        this.determineArray(arrs[0])
    }
}    

export default XLType