import XLBox from "../utils/XLBox.js";
import Color100 from '../source/100.json' assert { type: 'json' };

/**
 * 自定义操作粒子的过渡类
 */
class ParticleMounted extends XLBox {
    pollitionOptions = {
        systemOptions: [{
                translation:[],
                direction:[],
            }
        ],
        massOptions: [0, 0.1, 0.3, 0.5, 0.7],
        colorOptions: [{
            red: 0.6,
            green: 0.6,
            blue: 0.6,
            alpha: 1.0,
        },
        {
            red: 0.6,
            green: 0.6,
            blue: 0.9,
            alpha: 0.9,
        },
        {
            red: 0.5,
            green: 0.8,
            blue: 0.6,
            alpha: 0.6,
        },
    ],
    };
    constructor(center, dimensions, x, y, z) {
        super();
        if (!center || !dimensions) {
            return;
        }
        this._center = center;
        this._dimensions = dimensions;
        this._particleCanvas = null;
        this.transformMatrix = {}
        this._bursts = []
        this.pollutionSystems = []
        this._x = x;
        this._y = y;
        this._z = z;
        this.initMatrix(center)

    }

    // 生成粒子系统
    /**
     * 两种模式，一种是根据质量计算当前粒子颜色，一种是直接赋予粒子颜色
     * 颜色的优先级更高
     * @param {质量} mass 
     * @param {颜色} color 
     */
    generate(mass,color) {
        this.createParticleSystems(this.pollitionOptions, this.pollutionSystems, mass, color);
    }

    get systemOptions() {
        return this.pollitionOptions.systemOptions
    }
    set systemOptions(arr) {
        this.systemOptions[0] = arr
    }

    _getImage() {

        const particleCanvas = document.createElement("canvas");
        particleCanvas.width = 20;
        particleCanvas.height = 20;
        const context2D = particleCanvas.getContext("2d");
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Cesium.Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = "rgb(255, 255, 255)";
        context2D.fill();

        return particleCanvas;
    }

    // 绘制坐标轴
    drawAxis() {
        viewer.scene.primitives.add(new Cesium.DebugModelMatrixPrimitive({
            modelMatrix: this.modelMatrix,
            length: 1000.0,
            width: 2.0
        }));
    }


    forceFunction(options) {
        const force = function (particle) {
            //const color1 = Cesium.Color.fromCssColorString(Color100[0][0]);
            // const color2 = Cesium.Color.fromCssColorString(Color100[0][4]);
           
        }
        return force;
    };

    // 计算任意两向量的旋转矩阵
    vec3TransformMatrixFunction(originVec3, directionVec3) {
        let transformMatrix = this.transformMatrix
        if (transformMatrix[directionVec3]) {
            return transformMatrix[directionVec3];
        }
        const angle = Cesium.Cartesian3.angleBetween(originVec3, directionVec3)
        // 两向量若是重合，则直接返回单位矩阵
        if (angle == 0) {
            const rotationMatrix = Cesium.Matrix3.IDENTITY;
            transformMatrix[directionVec3] = rotationMatrix;
            return rotationMatrix
        }
        // 两向量相反
        if(angle == Math.PI){
            const rotationMatrix =  Cesium.Matrix3.fromScale(new Cesium.Cartesian3(1,1,-1), new Cesium.Matrix3());
            transformMatrix[directionVec3] = rotationMatrix;
            return rotationMatrix
        }
        const axis = Cesium.Cartesian3.cross(originVec3, directionVec3, new Cesium.Cartesian3())
        const quaternion = Cesium.Quaternion.fromAxisAngle(axis, angle)
        // const headingPitchRoll = Cesium.HeadingPitchRoll.fromQuaternion(quaternion)
        const rotationMatrix = Cesium.Matrix3.fromQuaternion(quaternion)
        transformMatrix[directionVec3] = rotationMatrix;
        return rotationMatrix;
    }


    // 根据方向和偏移坐标创建初始旋转矩阵，正东方向为0，逆时针方向依次+1，一共8个方向；
    transformFunction(position, direction) {
        const rotationMatrix = this.vec3TransformMatrixFunction(new Cesium.Cartesian3(0, 0, 1), direction)
        const translation = Cesium.Cartesian3.multiplyComponents(position, this._dimensions,
            new Cesium.Cartesian3())
        const emitterModelMatrix = Cesium.Matrix4.fromRotationTranslation(rotationMatrix, translation)
        return emitterModelMatrix;
    }

    createBursts() {
        const bursts = [];
        for (let j = 0; j < 3; ++j) {
            bursts.push(
                new Cesium.ParticleBurst({
                    time: Cesium.Math.nextRandomNumber() * 2.0,
                    minimum: 5,
                    maximum: 5,
                })
            );
        }
        return bursts;
    }


    createParticleSystems(options, systemsArray, mass, color1) {
        const systemOptions = options.systemOptions;
        const length = systemOptions.length;
        const particleCanvas = this._getImage();
        let color = color1;
        // const bursts = this.createBursts();
        for (let i = 0; i < length; ++i) {
            const {
                translation,
                direction
            } = systemOptions[i]
            
            if(!color){
                color = this._getColor(mass);
            }
            // const n1 = Math.floor(Math.random()*5);
            for (let j = 0; j < direction.length; ++j) {
                const emitterModelMatrix = this.transformFunction(translation, direction[j])
                
                // const color = Cesium.Color.fromCssColorString(Color100[0][n1])
                // const color = Cesium.Color.fromRandom(
                //     options.colorOptions[j % options.colorOptions.length]
                // );
                const force = this.forceFunction(options);

                const item = viewer.scene.primitives.add(
                    new Cesium.ParticleSystem({
                        image: particleCanvas,
                        startColor: color,
                        endColor: color.withAlpha(0.0),
                        particleLife: 2.5,
                        speed: 2.0,
                        imageSize: new Cesium.Cartesian2(7.0, 7.0),
                        emissionRate: 2,
                        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(30.0)),
                        lifetime: 2.0,
                        updateCallback: force,
                        modelMatrix: this.modelMatrix,
                        emitterModelMatrix: emitterModelMatrix,
                        startScale:1,
                        endScale:0.5,
                        // bursts: bursts,
                        // loop: false,
                    })
                );
                systemsArray.push(item);
            }
        }
    }

    lookAt() {
        const camera = viewer.scene.camera;
        camera.lookAt(worldPosition, new Cesium.Cartesian3(0.0, -800.0, 800.0));
    }

    /**
     * 计算该位置的网格坐标，即偏移量
     * @param {数组下标} position 
     * @returns 
     */
    getOffset(position, offset) {
        const p1 = new Cesium.Cartesian3(...position);
        const p2 = new Cesium.Cartesian3(
            Math.floor(this._x / 2),
            Math.floor(this._y / 2),
            Math.floor(this._z / 2)
        );
        const res = Cesium.Cartesian3.subtract(p1, p2, new Cesium.Cartesian3());
        const ress = Cesium.Cartesian3.add(res, offset, new Cesium.Cartesian3())
        return ress;
    }

    /**
     * 计算方向向量
     * @param {父节点数组下标} p1 
     * @param {子节点数组下标} p2 
     * @returns 
     */
    getDirections(p1, p2) {
        const pos1 = new Cesium.Cartesian3(...p1);
        const pos2 = new Cesium.Cartesian3(...p2);
        const res = Cesium.Cartesian3.subtract(pos2, pos1, new Cesium.Cartesian3());
        return res;
    }


    //移除所有粒子
    removeAll(){
        this.pollutionSystems.forEach(element => {
            viewer.scene.primitives.remove(element);
        })
        this.pollutionSystems = [];
    }


    /**
     * @param {Number} n
     */
    set particelNumbers(n){
        this.pollutionSystems.forEach(element => {
            element.emissionRate = n;
        })
    }

    /**
     * @param {Number} s
     */
    set particleSize(s){
        this.pollutionSystems.forEach(element => {
            element.startScale = s;
            element.endScale = s*0.5;
        })
    }

    /**
     * @param {Boolean} flag
     */
    set bursts(flag){
        let bursts = null;
        if(Boolean(flag)){
            bursts = this.createBursts();
        }
        this.pollutionSystems.forEach(element => {
            element.bursts = bursts;
        })
    }


    // 根据质量获取对应的颜色
    _getColor(mass){
        const massOptions = this.pollitionOptions.massOptions;
        let index = 0;
        for(let i=massOptions.length-1; i>=0; i--){
            if(mass >= massOptions[i]){
                index = i;
                break;
            }
        }
        const color = Cesium.Color.fromCssColorString(Color100[0][index])
        return color;
    }


}

export default ParticleMounted;