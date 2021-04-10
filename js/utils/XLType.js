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

    //判断对象
    static determineObject(obj){
        if(! obj instanceof Object){
            throw new Error('请传入一个对象..')
        }
    }

    //判断cartesian3
    static determineCartesian3(obj){
        if (! ('x'in obj & 'y' in obj & 'z' in obj)) {
            throw new Error('请传入一个cartesian3对象....')
        }
    }


    // 是否继续进行
    static xlAlert(){
        let length = arguments.length
        let flag = true
        if (length < 2) {
            throw new Error('请传入2个以上的参数...')
        }
        for (let i = 0; i < length-1; i++) {
            if (!arguments[i]) {
                alert(arguments[length-1]);
                flag = false
                break
            }
        }
        return flag      
    }

   
       
    
}    

export default XLType