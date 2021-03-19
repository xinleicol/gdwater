import XLBox from './XLBox.js'

class XLBoxParticle extends XLBox{
    _centerPosition=null
    _url = 'http://127.0.0.1:5500/image/whatever.jpg'
    _particleStyle={}
    _modelMatrix = null
    _emitterInitialLocation =  new Cesium.Matrix4()
    _particleSystem = null
    _update = function () {}

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

    /**
     * 生成粒子对象
     */
    generate(){
        if (this._centerPosition == null | this._modelMatrix == null ) {
            throw new Error('污染源、模型矩阵不能为空...')
        }
        this._particleSystem = scene.primitives.add(new Cesium.ParticleSystem({
            ...this._particleStyle,
            color: Cesium.Color.BLACK , //开始颜色
            emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(50000, 50000, 25000)),
            image: XLBoxParticle.getImage(), 
            particleLife: 10, //粒子生存时间
            speed: 0, 
            imageSize: new Cesium.Cartesian2(17.0, 17.0), 
            emissionRate: 2.0, 
            loop:false,
            lifetime: 5, 
            //mass:10.0,
            updateCallback: this._update, 
            modelMatrix: this._modelMatrix,
            emitterModelMatrix: this._emitterInitialLocation 
        }));
        
    }

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

    raiseToTop(){
        scene.primitives.raiseToTop(this._particleSystem)
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

    hasCompleted(particleSystem){
        let massage = new Cesium.Check.typeOf.object('object',particleSystem)
        return new Promise((resolve,rejecet)=>{
            if (massage) {
                setTimeout(()=>{
                    console.log('里面...');
                    resolve(particleSystem._particles)
                },particleSystem.lifetime*1000)
            }else{
                rejecet('获取粒子数组失败...')
            }
        } )
        if (massage) { 
            
            setTimeout(()=>{
                console.log('settimeout running..');
                //console.log(particleSystem._particles);
                //console.log(particleSystem._particles[1]);
                 //let particle = particleSystem._particles[1]
                // console.log(particle);
                // console.log(particle.life);
                //particle.life = Number.MAX_VALUE
                
                //particle.update(1,function(){console.log(11);})
                // console.log(particle);
                // let newVelocity = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_Z,6000, new Cesium.Cartesian3());
                // console.log(newVelocity);
                // particle.velocity = Cesium.Cartesian3.clone(newVelocity)
                // console.log(particle);
            },particleSystem.lifetime*1000)             
        }
    }

}

export default XLBoxParticle