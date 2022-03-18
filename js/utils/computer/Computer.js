
/**
 * 抽象父类
 * 计算
 */
class Computer{
    constructor(){}

    /**
     * 抽象方法
     */
    _computer(){}

    computer(){
        this._computer()
    }

    /**
     * 类的初始化
     */
    _init(){}

/**
 * 生成图形
 */
    generate(){}
}
export default Computer