import XLBox from './XLBox.js'
import XLParticleSystem from './XLParticleSystem.js'

class XLBoxParticle extends XLBox{
    _centerPosition=null
    _url = 'http://127.0.0.1:5500/image/whatever.jpg'
    _particleStyle={} //粒子样式
    _modelMatrix = null //模型到世界的旋转矩阵
    _emitterInitialLocation =  new Cesium.Matrix4() //粒子发射的模型坐标
    _particleSystem = null //粒子系统
    _speed = 6000 //粒子速度
    _update = function (particle,dt) {
        if (particle.endPosition) { //有终点就会开始运动
            Cesium.Cartesian3.subtract (particle.endPosition, particle.position, particle.velocity)
            Cesium.Cartesian3.normalize(particle.velocity,particle.velocity)
            Cesium.Cartesian3.multiplyByScalar(particle.velocity,6000,particle.velocity) //(优化)
        }
    }

    /**
     * 
     * @param {模型中心世界坐标} centerPosition 
     * @param {粒子发射模型偏移坐标} emitterInitialLocation 
     */
    constructor(centerPosition,emitterInitialLocation){
        super()
        if (emitterInitialLocation) {
            this._emitterInitialLocation = emitterInitialLocation
            this._emitterInitialLocation = XLBoxParticle.computerEmitterModelMatrix(emitterInitialLocation)
        }
        this._centerPosition = centerPosition
        this._modelMatrix = this.computerModelMatrix(centerPosition)
    }

    get particleSystem(){
        return this._particleSystem
    }

    get particles(){
        if (this.particleSystem) {
            return this.particleSystem._Particles
        }
    }

    /**
     * 
     * @returns 生成粒子系统，并返回指定数量存活的粒子数组
     */
    generate(){
        if (this._centerPosition == null | this._modelMatrix == null ) {
            throw new Error('污染源、模型矩阵不能为空...')
        }
        let newParticleSystem = new XLParticleSystem({
            ...this._particleStyle,
            color: Cesium.Color.RED , //开始颜色
            emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(50000, 50000, 25000)),
            image: XLBoxParticle.getImage(), 
            // particleLife:20, //粒子生存时间
            speed: 0, 
            imageSize: new Cesium.Cartesian2(17.0, 17.0), 
            emissionRate: 20.0, 
            loop:false,
            lifetime: 5, 
            particleNumber:100,
            //mass:10.0,
            updateCallback: this._update, 
            modelMatrix: this._modelMatrix,
            emitterModelMatrix: this._emitterInitialLocation 
        });
        this._particleSystem = scene.primitives.add(newParticleSystem)   
    }

    /**
     * 
     * @param{粒子发射初始模型位置} emitterInitialLocation
     * @returns 返回模型矩阵
     */
    static computerEmitterModelMatrix(emitterInitialLocation){
       return Cesium.Matrix4.fromTranslation(
            emitterInitialLocation,
            new Cesium.Matrix4()
        )
    }
    
    /**
     * 粒子图像的绘制
     * @returns 粒子图像
     */
    static getImage () {
        let particleCanvas = document.createElement('canvas');
        particleCanvas.width = 20;
        particleCanvas.height = 20;
        var context2D = particleCanvas.getContext('2d');
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Cesium.Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = 'rgb(255, 255, 255)';
        context2D.fill();
        return particleCanvas;
    }

    /**
     * 更新粒子函数
     * @param {粒子更新函数} fun 
     */
    updateFun(fun){
        if (typeof(fun) == 'function') {
            this._particleSystem.updateCallback = fun  
        }else{
            throw new TypeError('请传入一个粒子更新函数...')
        }
    }

    /**
     * 
     * @param {粒子系统} particleSystem 
     * @returns 指定时间后返回粒子数组，在原生粒子系统中有效（）
     */
    hasCompleted(particleSystem){
        let massage = new Cesium.Check.typeOf.object('object',particleSystem)
        return new Promise((resolve,rejecet)=>{
            if (massage) {
                setTimeout(()=>{
                    resolve(particleSystem._Particles)
                },(particleSystem.lifetime)*1000)
            }else{
                rejecet('获取粒子数组失败...')
            }
        } )
    }

}

export default XLBoxParticle