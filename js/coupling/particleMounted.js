import XLBox from "../utils/XLBox.js";

/**
 * 自定义操作粒子的过渡类
 */
class ParticleMounted extends XLBox {
    pollitionOptions = {
        systemOptions: [],
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
                green: 0.5,
                blue: 0.7,
                alpha: 0.5,
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
        this.bursts = []
        this.pollutionSystems = []
        this._x = x;
        this._y = y;
        this._z = z;
        this.initMatrix(center)

    }

    generate() {
        this.createParticleSystems(this.pollitionOptions, this.pollutionSystems);
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
            // const position = Cesium.Matrix4.multiplyByPoint(
            //     worldToParticle,
            //     particle.position,
            //     new Cesium.Cartesian3()
            // );
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
        const axis = Cesium.Cartesian3.cross(originVec3, directionVec3, new Cesium.Cartesian3())
        const quaternion = Cesium.Quaternion.fromAxisAngle(axis, angle)
        const headingPitchRoll = Cesium.HeadingPitchRoll.fromQuaternion(quaternion)
        const rotationMatrix = Cesium.Matrix3.fromHeadingPitchRoll(headingPitchRoll)
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
        const bursts = this.bursts;
        for (let j = 0; j < 3; ++j) {
            bursts.push(
                new Cesium.ParticleBurst({
                    time: Cesium.Math.nextRandomNumber() * 2.0,
                    minimum: 5,
                    maximum: 20,
                })
            );
        }
        return bursts;
    }


    createParticleSystems(options, systemsArray) {
        const systemOptions = options.systemOptions;
        const length = systemOptions.length;
        const particleCanvas = this._getImage();
        const bursts = this.createBursts();
        for (let i = 0; i < length; ++i) {
            const {
                translation,
                direction
            } = systemOptions[i]

            for (let j = 0; j < direction.length; ++j) {
                const emitterModelMatrix = this.transformFunction(translation, direction[j])
                const color = Cesium.Color.fromRandom(
                    options.colorOptions[i % options.colorOptions.length]
                );
                const force = this.forceFunction(options);

                const item = viewer.scene.primitives.add(
                    new Cesium.ParticleSystem({
                        image: particleCanvas,
                        startColor: color,
                        endColor: color.withAlpha(0.0),
                        particleLife: 1.6,
                        speed: 1.0,
                        imageSize: new Cesium.Cartesian2(7.0, 7.0),
                        emissionRate: 3,
                        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(30.0)),
                        lifetime: 2.0,
                        updateCallback: force,
                        modelMatrix: this.modelMatrix,
                        emitterModelMatrix: emitterModelMatrix,
                        bursts: bursts,
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
     * 计算该位置的模型坐标，即偏移量
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

}

export default ParticleMounted;