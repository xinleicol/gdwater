import XLBox from './XLBox.js'

class XLBoxParticle extends XLBox{
    _centerPosition=null
    _url = 'http://127.0.0.1:5500/image/whatever.jpg'
    _particleStyle={}
    _modelMatrix = null
    _emitterInitialLocation =  new Cesium.Matrix4()
    _particalSystem = null
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

    generate(){
        if (this._centerPosition == null | this._modelMatrix == null ) {
            throw new Error('污染源、模型矩阵不能为空...')
        }
        this._particalSystem = scene.primitives.add(new Cesium.ParticleSystem({
            ...this._particleStyle,
            color: Cesium.Color.BLACK , //开始颜色
            emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(50000, 50000, 50000)),
            image: XLBoxParticle.getImage(), 
            particleLife: 20, 
            speed: 30000, 
            imageSize: new Cesium.Cartesian2(17.0, 17.0), 
            emissionRate: 5.0, 
            lifetime: 100, 
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
        scene.primitives.raiseToTop(this._particalSystem)
    }

    updateFun(fun){
        if (typeof(fun) == 'function') {
            this._particalSystem.updateCallback = fun  
        }else{
            throw new TypeError('请传入一个粒子更新函数...')
        }
    }
}

export default XLBoxParticle