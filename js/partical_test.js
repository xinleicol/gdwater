/**
 * 粒子系统
 * 模拟污染点源扩散
 */
var viewer = new Cesium.Viewer("cesiumContainer", {
    imageryProvider: hhuImg,
    shouldAnimate: true,
  });

var scene = viewer.scene;

scene.debugShowFramesPerSecond = true;

Cesium.Math.setRandomNumberSeed(315);

var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(118, 31)//(-75.59777, 40.03883)
    //boxCenter
);//笛卡尔坐标系到地面坐标系的转换矩阵

var emitterInitialLocation = new Cesium.Cartesian3(0.0, 0.0, 100.0);

var particleCanvas;

function getImage() {
    if (!Cesium.defined(particleCanvas)) {
        particleCanvas = document.createElement("canvas");
        particleCanvas.width = 20;
        particleCanvas.height = 20;
        var context2D = particleCanvas.getContext("2d");
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Cesium.Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = "rgb(255, 255, 255)";
        context2D.fill();
    }
    return particleCanvas;
}

var minimumExplosionSize = 30.0;
var maximumExplosionSize = 100.0;
var particlePixelSize = new Cesium.Cartesian2(7.0, 7.0);
var burstSize = 400.0;
var lifetime = 10.0;
var numberOfFireworks = 20.0;//？

var emitterModelMatrixScratch = new Cesium.Matrix4();

function createFirework(offset, color, bursts) {
    var position = Cesium.Cartesian3.add(//按照分量求和
        emitterInitialLocation,
        offset,
        new Cesium.Cartesian3()
    );//在粒子坐标系下，计算运动中粒子偏移
    var emitterModelMatrix = Cesium.Matrix4.fromTranslation(
        position,
        emitterModelMatrixScratch
    );//转换为四阶矩阵
    var particleToWorld = Cesium.Matrix4.multiply(
        modelMatrix,
        emitterModelMatrix,
        new Cesium.Matrix4()
    );//得到粒子系统到笛卡尔坐标系的转换矩阵
    var worldToParticle = Cesium.Matrix4.inverseTransformation(//求逆
        particleToWorld,
        particleToWorld//逆矩阵，为什么要这个参数？
    );

    var size = Cesium.Math.randomBetween(
        minimumExplosionSize,
        maximumExplosionSize
    );//爆炸范围

    var particlePositionScratch = new Cesium.Cartesian3();
    var force = function (particle) {
        var position = Cesium.Matrix4.multiplyByPoint(
            worldToParticle,//转换矩阵
            particle.position,//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
            particlePositionScratch//得到粒子坐标系下的位置cartesian3
        );
        if (Cesium.Cartesian3.magnitudeSquared(position) >= size * size) {//检测粒子是否飞出爆炸范围
            Cesium.Cartesian3.clone(
                Cesium.Cartesian3.ZERO,
                particle.velocity//粒子分速度分量
            );//让粒子回到原点
        }
    };

    var normalSize =
        (size - minimumExplosionSize) /
        (maximumExplosionSize - minimumExplosionSize);//描述当前粒子飞行的距离百分比
    var minLife = 0.3;
    var maxLife = 1.0;
    var life = normalSize * (maxLife - minLife) + minLife;//根据粒子飞行距离来调整粒子的生命长度

    scene.primitives.add(
        new Cesium.ParticleSystem({
            image: getImage(),
            startColor: color,
            endColor: color.withAlpha(0.0),
            particleLife: life,//粒子寿命
            speed: 100.0,//粒子飞行速度
            imageSize: particlePixelSize,
            emissionRate: 0,//每秒发射的粒子数量
            emitter: new Cesium.SphereEmitter(0.1),
            bursts: bursts,//粒子系统集合
            lifetime: lifetime,//粒子发射时间间隔
            updateCallback: force,//规定时长内修改粒子的属性
            modelMatrix: modelMatrix,//4阶矩阵，粒子到世界坐标系
            emitterModelMatrix: emitterModelMatrix,//4阶矩阵，描述粒子在粒子坐标系下的位置
        })
    );
}
var xMin = -100.0;
var xMax = 100.0;
var yMin = -80.0;
var yMax = 100.0;
var zMin = -50.0;
var zMax = 50.0;

var colorOptions = [
    {
        minimumRed: 0.75,
        green: 0.0,
        minimumBlue: 0.8,
        alpha: 1.0,
    },
    {
        red: 0.0,
        minimumGreen: 0.75,
        minimumBlue: 0.8,
        alpha: 1.0,
    },
    {
        red: 0.0,
        green: 0.0,
        minimumBlue: 0.8,
        alpha: 1.0,
    },
    {
        minimumRed: 0.75,
        minimumGreen: 0.75,
        blue: 0.0,
        alpha: 1.0,
    },
];

for (var i = 0; i < numberOfFireworks; ++i) {
    var x = Cesium.Math.randomBetween(xMin, xMax);
    var y = Cesium.Math.randomBetween(yMin, yMax);
    var z = Cesium.Math.randomBetween(zMin, zMax);
    var offset = new Cesium.Cartesian3(x, y, z);//粒子飞行位移
    var color = Cesium.Color.fromRandom(
        colorOptions[i % colorOptions.length]
    );

    var bursts = [];
    for (var j = 0; j < 3; ++j) {
        bursts.push(
            new Cesium.ParticleBurst({
                time: Cesium.Math.nextRandomNumber() * lifetime,//不定时产生粒子发射器
                minimum: burstSize,
                maximum: burstSize,
            })
        );
    }

    createFirework(offset, color, bursts);
}

var camera = viewer.scene.camera;
var cameraOffset = new Cesium.Cartesian3(0.0, 0.0, 300.0);
camera.lookAtTransform(modelMatrix, cameraOffset);//设置相机位置到参考坐标系中
camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

var toFireworks = Cesium.Cartesian3.subtract(//计算两个cartesian3的分量差异
    emitterInitialLocation,
    cameraOffset,
    new Cesium.Cartesian3()
);
Cesium.Cartesian3.normalize(toFireworks, toFireworks);//?什么是计算笛卡尔坐标系的标准形式
var angle =
    Cesium.Math.PI_OVER_TWO -
    Math.acos(
        Cesium.Cartesian3.dot(toFireworks, Cesium.Cartesian3.UNIT_Z)//计算点积
    );
camera.lookUp(angle);

