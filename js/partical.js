
var modelMatrix = new Cesium.Matrix4();
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    boxModel[0]//(118.7, 31.9)
);
/**
 * var emitterInitialLocation = new Cesium.Cartesian3(0.0, 0.0, 200.0);
 * 之前这样设置，导致变换矩阵计算错误，
 * 这里若设置了位置，相当于计算了第二个变换矩阵
 * 得到的坐标就相当于在该点为原点下的坐标
*/
var emitterInitialLocation = new Cesium.Cartesian3(0.0, 0.0, 0.0);
var particlePixelSize = new Cesium.Cartesian2(5.0, 5.0);

//粒子颜色选项
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


var particleCanvas;

function getImage() {
    if (!Cesium.defined(particleCanvas)) {
        particleCanvas = document.createElement('canvas');
        particleCanvas.width = 20;
        particleCanvas.height = 20;
        var context2D = particleCanvas.getContext('2d');
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Cesium.Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = 'rgb(255, 255, 255)';
        context2D.fill();
    }
    return particleCanvas;
}

/**
 * 计算世界坐标系cartesian3到粒子系统变化矩阵
 */

var worldToParticle;//世界坐标系转粒子坐标系的矩阵
function getTransformModelMatrix() {
    var emitterInitPoint = Cesium.Matrix4.fromTranslation(
        new Cesium.Cartesian3(0.0, 0.0, 0.0),
        new Cesium.Matrix4()
    );//转换为四阶矩阵
    var particleToWorld = Cesium.Matrix4.multiply(
        modelMatrix,
        emitterInitPoint,
        new Cesium.Matrix4()
    );//得到粒子系统到笛卡尔坐标系的转换矩阵
    worldToParticle = Cesium.Matrix4.inverseTransformation(//求逆
        particleToWorld,
        particleToWorld//逆矩阵，为什么要这个参数？
    );
}
getTransformModelMatrix();


var colorNum = 0;//颜色计数器
function createParticle() {
    var emitterModelMatrix = Cesium.Matrix4.fromTranslation(
        emitterInitialLocation,
        new Cesium.Matrix4()
    );//转换为四阶矩阵
    let color = Cesium.Color.fromRandom(
        colorOptions[colorNum % colorOptions.length]
    );
    colorNum++;
    let particleSystem = scene.primitives.add(new Cesium.ParticleSystem({
        image: getImage(),//粒子图像
        startColor: color,//开始颜色
        endColor: color.withAlpha(0.1),//结束时的颜色
        particleLife: 100,//每个粒子的生存时间，即子弹被打出来后能飞多久
        speed: 5,//粒子飞行速度
        imageSize: particlePixelSize,//粒子大小
        emissionRate: 5.0,//每秒发射粒子的个数
        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(30.0)),//粒子发射器的形式，确定了在什么样的区间里随机产生粒子
        lifetime: 100,//粒子发射器的生命周期，即发射粒子的时间
        updateCallback: force,//粒子位置更新回调函数
        modelMatrix: modelMatrix,//决定粒子在空间坐标系的位置矩阵
        emitterModelMatrix: emitterModelMatrix//决定粒子相对于模型位置的位置矩阵
    }));
    ParticalObject.particalSystems.push(particleSystem)

}

var force = function (singleParticle) {
    var velocity = singleParticle.velocity;
    if (velocity.z > 0) {
        var velocityNegate = new Cesium.Cartesian3();
        var velocityNegate = Cesium.Cartesian3.negate(velocity, velocityNegate);
        singleParticle.velocity = velocityNegate;
    }

}

/** 存放关于粒子的对象*/
var ParticalObject = {
    points: [],//存放污染点源位置Cartesian3
    particalSystems: [], /**粒子数组particalSystem */
    adjacentGridCoors: [],//污染源相邻网格坐标 不会有多个坐标
    pollutionGridCoors:[],//被污染的污染源所在网格坐标
    nextLayerPollutionSource:[],//存放下一层污染源坐标
    nextLayerGridCoors:[],//下一层相邻网格坐标
    //添加一个选点事件
    selectPollutionPoint: function (handlerName) {
        //清空点源位置
        this.points = [];
        handlerName.setInputAction((event) => {
            const point = MeasureObject.getPointCartesian3(event);
            MeasureObject.addPoint(point);
            ParticalObject.points.push(point);//添加进粒子数组

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    },
    /**添加立方体 */
    addBoxEntities: function (position, lengthX, lengthY, lengthZ) {
        //添加正方体盒子
        viewer.entities.add({
            position: position,
            box: {
                dimensions: new Cesium.Cartesian3(lengthX, lengthY, lengthZ),
                fill: false,
                outline: true,
                outlineColor: Cesium.Color.BLUE,
            },
        });
    },
    /**计算变换矩阵 */
    computerModelMatrix: function (modelMatrix) {
        let initPosition = Cesium.Matrix4.fromTranslation(
            new Cesium.Cartesian3(0.0, 0.0, 0.0),
            new Cesium.Matrix4()
        );//转换为四阶矩阵
        let modelToWorld = Cesium.Matrix4.multiply(
            modelMatrix,
            initPosition,
            new Cesium.Matrix4()
        );//得到粒子系统到笛卡尔坐标系的转换矩阵
        let worldToModel = Cesium.Matrix4.inverseTransformation(//求逆
            modelToWorld,
            new Cesium.Matrix4()
        );
        return { modelToWorld: modelToWorld, worldToModel: worldToModel };
    },
    /**根据左边三点计算元胞中心点坐标 */
    computerCenterPosition: function (x, y, z, intervalX, intervalY, intervalZ) {
        let numberX = Math.floor(x / intervalX -1);
        let numberY = Math.floor(y / intervalY -1);
        let numberZ = Math.floor(Math.abs(z) / intervalZ -1);
        let centerX = (numberX + 0.5) * intervalX;
        let centerY = (numberY + 0.5) * intervalY;
        let centerZ = -(numberZ + 0.5) * intervalZ;
        return { centerX: centerX, centerY: centerY, centerZ: centerZ };
    },
    /**根据模型坐标计算世界坐标 */
    computerWorldPosition: function (modelToWorld, position) {
        let result = new Cesium.Cartesian3();
        Cesium.Matrix4.multiplyByPoint(
            modelToWorld,//转换矩阵
            position,//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
            result//得到粒子坐标系下的位置cartesian3
        );
        return result;
    },
    /**根据模型坐标计算世界坐标 */
    computerModelPosition: function (worldToModel, position) {
        let result = new Cesium.Cartesian3();
        Cesium.Matrix4.multiplyByPoint(
            worldToModel,//转换矩阵
            position,//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
            result//得到粒子坐标系下的位置cartesian3
        );
        return result;
    },
    /**添加粒子系统 */
    addParticleSystem: function (modelMatrix,emitterModelMatrix,update) {
        let particalSystem = scene.primitives.add(new Cesium.ParticleSystem({
            image: getImage(),//粒子图像
            startColor: Cesium.Color.CYAN,//开始颜色
            endColor: Cesium.Color.CYAN.withAlpha(0.0),
            particleLife: 100,//每个粒子的生存时间，即子弹被打出来后能飞多久
            speed: 10,//粒子飞行速度
            imageSize: particlePixelSize,//粒子大小
            emissionRate: 5.0,//每秒发射粒子的个数
            emitter: new Cesium.BoxEmitter(),//粒子发射器的形式，确定了在什么样的区间里随机产生粒子
            lifetime: 100,//粒子发射器的生命周期，即发射粒子的时间
            updateCallback: update,//粒子位置更新回调函数
            modelMatrix: modelMatrix,//决定粒子在空间坐标系的位置矩阵
            emitterModelMatrix: emitterModelMatrix//决定粒子相对于模型位置的位置矩阵
        }));
        this.particalSystems.push(particalSystem)
    },
    /**计算左上角角点坐标 */
    computerLeftButtom: function (rightButtom,xLength,yLength,zLength) {
        let x = rightButtom.x - xLength
        let y = rightButtom.y - yLength
        let z = rightButtom.z + zLength
        return {'x':x,'y':y,'z':z}
    },
    /**获得粒子更新函数*/
    updateFunctionMapping: function(leftTop,rightButtom,worldToModel) {
        let that = this
        let update = function (partical) {
            const x1 = leftTop.x
            const y1 = leftTop.y
            const z1 = leftTop.z
            const x2 = rightButtom.x
            const y2 = rightButtom.y
            const z2 = rightButtom.z
            const position = partical.position
            let modelPosition = that.computerModelPosition(worldToModel,position)
            const x = modelPosition.x
            const y = modelPosition.y
            const z = modelPosition.z
            if (x<x1 | x>x2 | y<y1 | y>y2 | z>z1 | z<z2) {
                Cesium.Cartesian3.clone(
                    Cesium.Cartesian3.ZERO,
                    partical.velocity
                );//让粒子回到原点
            }
        }
        return update
    },
    /**判段污染源处于哪个网格内 */
    judgePollutionPoint: function(points,mat,boxLength,boxWidth,boxHeight) {
    if (points.length == 0) {console.log("请输入污染源...");return}
    let xyzs = [] 
    points.forEach(element => {
        let modelPosition = ParticalObject.computerModelPosition(mat,element)
        const x = modelPosition.x
        const y = modelPosition.y
        const z = modelPosition.z
        xCor = Math.floor(x/boxLength) //三维数组坐标
        yCor = Math.floor(y/boxWidth)
        zCor = Math.floor(z/boxHeight)
        xyzs.push([xCor,yCor,zCor])
    })
    return xyzs
    }, 
    /**根据三维数组坐标添加粒子系统 返回中心点的世界坐标*/
    simulateParticleEvent: function (pointCoor,centerPointsXYZ,rightButtom3,worldToModel,modelToWorld,intervalX,intervalY,intervalZ) {
        xCoor = pointCoor[0]
        yCoor = pointCoor[1]
        const centerPoint = centerPointsXYZ[xCoor][yCoor][0]
        const rightButtom = rightButtom3[xCoor][yCoor][0]
        let leftTop = this.computerLeftButtom(rightButtom,intervalX,intervalY,intervalZ)
        let emitterInitialLocation = new Cesium.Cartesian3(centerPoint.centerX, centerPoint.centerY, centerPoint.centerZ)
        let emitterModelMatrix = Cesium.Matrix4.fromTranslation(
            emitterInitialLocation,
            new Cesium.Matrix4()
        );
        //获取粒子更新函数
        let update = this.updateFunctionMapping(leftTop,rightButtom,worldToModel)
        //添加粒子系统
        this.addParticleSystem(modelToWorld,emitterModelMatrix,update)
        let emitterInitialLocationWorld = this.computerWorldPosition(modelToWorld,emitterInitialLocation)
        this.addBoxEntities(emitterInitialLocationWorld, intervalX, intervalY, intervalZ);
        return emitterInitialLocationWorld
    },
    /**根据世界笛卡尔坐标计算地形高度 */ 
    computerTerrainHeight: function (centerPointWorldCoor) {
        let pointCarto = globe.ellipsoid.cartesianToCartographic(centerPointWorldCoor)
        //let updatedPosition = await Cesium.sampleTerrainMostDetailed(hhuDem, pointCarto);
        return pointCarto.height
    },
    /**根据网格点坐标计算世界笛卡尔坐标 */
    gridToWorldCoor: function (xGrid,yGrid,zGrid, centerPointsXYZ,modelToWorld) {
        let pointModel = centerPointsXYZ[xGrid][yGrid][zGrid]
        let pointModel1 = new Cesium.Cartesian3(pointModel.centerX, pointModel.centerY, pointModel.centerZ) //转换为cartesian3
        let pointWorld = this.computerWorldPosition(modelToWorld,pointModel1)
        return pointWorld
    },
    /**计算污染源的相邻网格坐标 */ 
    nextGridThisLevelID: function (lastGridThisLevelID,xNum,yNum,maxCoor,computerNum) { //xNum yNum 存放周围的网格个数(奇数)，3*3代表以目标点为中心的9个网格 computerNum为1时则是首次计算
        const x = lastGridThisLevelID[0]
        const y = lastGridThisLevelID[1]
        const z = lastGridThisLevelID[2]
        if (xNum/2 ==0 | yNum/2 ==0) {throw new Error("请传入奇数长度的网格数量...")}
        let xyzs = []//相邻网格坐标数组
        for (let i = 0; i < xNum; i++) {
            for (let j = 0; j < yNum; j++) {
                let xScrach = x - Math.floor(xNum /2) +i
                let yScrach = y - Math.floor(yNum /2) +j
                if (xScrach == x & yScrach == y) {//除去自己
                    continue
                }
                if (xScrach < 0 | yScrach<0 | xScrach>maxCoor | yScrach>maxCoor) {//除去超限的
                    continue
                }
                if (computerNum == 1) {//首次
                    this.adjacentGridCoors.push([xScrach,yScrach,0])
                    xyzs.push([xScrach,yScrach,0]) 
                }else{//去重
                    let comoputeredFlag1 = this.whetherComputered([xScrach,yScrach,0],this.adjacentGridCoors)//与上一层网格是否重复
                    let comoputeredFlag2 = this.whetherComputered([xScrach,yScrach,0],this.nextLayerGridCoors)//与下一层网格是否重复
                    if (!comoputeredFlag1 ) {//无重复，添加坐标
                        xyzs.push([xScrach,yScrach,0])
                        if (!comoputeredFlag2) {     
                            this.nextLayerGridCoors.push([xScrach,yScrach,0])
                        }
                    }                   
                }
            }            
        }
        return xyzs
    },  
    /**第2+n次模拟函数 判断周围网格与中心网格高程情况 对低高度的网格添加粒子系统*/
    adjacentGridSimulate:  function (centerPoint,num,centerPointsXYZ,rightButtom3,modelToWorld,worldToModel,intervalX,intervalY,intervalZ) {
        //let pollutionGridCoors = this.pollutionGridCoors
        let centerPointWorldCoor = this.gridToWorldCoor(centerPoint[0],centerPoint[1],centerPoint[2],centerPointsXYZ,modelToWorld)
        let centerHeight =  this.computerTerrainHeight(centerPointWorldCoor)//计算网格中心点高程
        let xyzs =  this.nextGridThisLevelID(centerPoint,3,3,num-1)//计算相邻点网格坐标
        if (xyzs.length == 0) {//没有相邻点，计算结束
            return true
        }
        for (let i = 0; i < xyzs.length; i++) {
            const eachPointGrid = xyzs[i];
            //判断是否被污染
            let pollutionFlag = this.whetherPolluted(eachPointGrid)
            if (pollutionFlag) {//被污染则跳过该点
                continue
            }
            let pointWorld = this.gridToWorldCoor(eachPointGrid[0],eachPointGrid[1],eachPointGrid[2],centerPointsXYZ,modelToWorld)
            let nextGridPointHeight =  this.computerTerrainHeight(pointWorld)
            if (nextGridPointHeight < centerHeight) {
                this.simulateParticleEvent(eachPointGrid,centerPointsXYZ,rightButtom3,worldToModel,modelToWorld,intervalX,intervalY,intervalZ)//添加污染源
                this.nextLayerPollutionSource.push(eachPointGrid)
            }
        }
        return false
    },
    //相邻坐标不能包含有污染源的网格,判断函数
    whetherPolluted: function (point) {
        const nextLayerPollutionSource = this.nextLayerPollutionSource
        const x = point[0]
        const y = point[1]
        const z = point[2]
        let pollutionFlag = false
        for (const pollutionGridCoor of nextLayerPollutionSource) {
            const xGoal = pollutionGridCoor[0]
            const yGoal = pollutionGridCoor[1]
            const zGoal = pollutionGridCoor[2]
            if (x == xGoal & y == yGoal & zGoal == z) {
                pollutionFlag = true//含有污染源
                break
            }
        }
        return pollutionFlag
    },
    /**相邻网格不能包含上一级网格  相邻网格不能在下一层网格之中不能重复*/
    whetherComputered: function (point,gridCoors) {
        let comoputeredFlag = false
        for (let k = 0; k < gridCoors.length; k++) {
            const element = gridCoors[k]
            const xExisted = element[0] 
            const yExisted = element[1] 
            const zExisted = element[2] 
            if ((xExisted == point[0] & yExisted == point[1] & zExisted == point[2])) {
                comoputeredFlag = true
                break
            }      
        }
        return comoputeredFlag   
    },
    /**上一层与下一层合并 */
    combineTwoLayer:function () {
        let adjacentGridCoors = this.adjacentGridCoors
        let nextLayerGridCoors = this.nextLayerGridCoors
        for (const gridCoors of nextLayerGridCoors) {
            adjacentGridCoors.push(gridCoors)
        }
        nextLayerGridCoors = []//清空
    }

}

/**划分网格 */
async function meshing() {
   // if (num == undefined) {throw new Error('请传入一个非空的网格数量！')}

    ParticalObject.pollutionGridCoors = [] //初始化
    let lon1 = ModelObject.lon1;//左边界经度
    let lon2 = ModelObject.lon2;//右边界经度
    let lat1 = ModelObject.lat1;//左边界纬度
    let lat2 = ModelObject.lat2;//右边界纬度

    let num = viewModel.gridNum;//划分网格份数

    let updatedPositions = await ModelObject.getTerrainCartesian3([[lon1, lat1]], hhuDem);//获取地形promise对象 
    let pointHeight = updatedPositions[0].height;
    //建立以左上角点位原点的笛卡尔坐标系
    let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromDegrees(lon1, lat1, pointHeight)
    );

    let transformsMatrix = ParticalObject.computerModelMatrix(modelMatrix);//计算变化矩阵
    const worldToModel = transformsMatrix.worldToModel
    const modelToWorld = transformsMatrix.modelToWorld

    //计算右下角点的模型坐标
    let rightButtom = Cesium.Matrix4.multiplyByPoint(
        transformsMatrix.worldToModel,//转换矩阵
        Cesium.Cartesian3.fromDegrees(lon2, lat1),//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
        new Cesium.Cartesian3()//得到粒子坐标系下的位置cartesian3
    );
    //计算左上角点的模型坐标
    let leftTop = Cesium.Matrix4.multiplyByPoint(
        transformsMatrix.worldToModel,//转换矩阵
        Cesium.Cartesian3.fromDegrees(lon1, lat2),//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
        new Cesium.Cartesian3()//得到粒子坐标系下的位置cartesian3
    );

    let length = rightButtom.x;//模型总长度
    let width = leftTop.y;//模型总宽度
    let deepth = 500.0;//模型总高度
    //定义节点
    let nodeX = [];//存放x坐标的节点
    let nodeY = [];
    let nodeZ = [];
    let intervalX = length / num;//网格的x长度
    let intervalY = width / num;
    let intervalZ = deepth / num;

    //切分x
    for (let i = 0; i < num; i++) {
        nodeX.push(intervalX * (i + 1));
    }
    //切分y
    for (let j = 0; j < num; j++) {
        nodeY.push(intervalY * (j + 1));
    }
    //切分z
    for (let k = 0; k < num; k++) {
        nodeZ.push(intervalZ * (k + 1));
    }

    //计算网格中心点坐标
    let centerPointsZ = []//存放中心点坐标
    let centerPointsYZ = []//存放中心点坐标
    let centerPointsXYZ = []//存放中心点坐标
    let rightButtom1 = [] 
    let rightButtom2 = []
    let rightButtom3 = [] //存放盒子右上角点坐标
   // let centerPointsTransfrom = [];//元胞中心的世界笛卡尔坐标
    for (let k = 0; k < num; k++) {
        centerPointsYZ = []
        rightButtom2 = [] 
        for (let j = 0; j < num; j++) {
            centerPointsZ = []
            rightButtom1 = []
            for (let i = 0; i < num; i++) {
                const xCorner = nodeX[k]
                const yCorner = nodeY[j]
                const zCorner = -nodeZ[i]
                let point = ParticalObject.computerCenterPosition(xCorner, yCorner, zCorner, intervalX, intervalY, intervalZ);
                let positionCartesian3 = new Cesium.Cartesian3(point.centerX, point.centerY, point.centerZ);
                // let position = ParticalObject.computerWorldPosition(modelToWorld, positionCartesian3);
                // centerPointsTransfrom.push(position);
                centerPointsZ[i] = point 
                rightButtom1[i] = {'x':xCorner,'y':yCorner,'z':zCorner}
            }
            centerPointsYZ[j] = centerPointsZ
            rightButtom2[j] = rightButtom1
        }
        centerPointsXYZ[k] = centerPointsYZ  
        rightButtom3[k] = rightButtom2
    }

    const points =  ParticalObject.points
    let results = ParticalObject.judgePollutionPoint(points,worldToModel,intervalX,intervalY,intervalZ)//判断污染源的网格坐标
    for (const pointCoor of results) {
        let centerPointWorldCoor = ParticalObject.simulateParticleEvent(pointCoor,centerPointsXYZ,rightButtom3,worldToModel,modelToWorld,intervalX,intervalY,intervalZ)//添加污染源
        let centerHeight =  ParticalObject.computerTerrainHeight(centerPointWorldCoor)//计算网格中心点高程
        let xyzs =  ParticalObject.nextGridThisLevelID(pointCoor,3,3,num-1,1)//计算相邻点网格坐标
        for (const eachPointGrid of xyzs) {
            let pointWorld = ParticalObject.gridToWorldCoor(eachPointGrid[0],eachPointGrid[1],eachPointGrid[2],centerPointsXYZ,modelToWorld)
            let nextGridPointHeight =  ParticalObject.computerTerrainHeight(pointWorld)
            if (nextGridPointHeight < centerHeight) {
                ParticalObject.simulateParticleEvent(eachPointGrid,centerPointsXYZ,rightButtom3,worldToModel,modelToWorld,intervalX,intervalY,intervalZ)//添加污染源
                ParticalObject.nextLayerPollutionSource.push(eachPointGrid)
            }
        }
    }
    
    //遍历污染源
    let pollutionGridCoors = ParticalObject.pollutionGridCoors
    let nextLayerPollutionSource = ParticalObject.nextLayerPollutionSource
    pollutionGridCoors.push(nextLayerPollutionSource)//首次添加
    // for (let i = 0; i < 2; i++) {
    //     const centerPoint = centerPoints[i]
    //     await ParticalObject.adjacentGridSimulate(centerPoint,num,centerPointsXYZ,rightButtom3,modelToWorld,worldToModel,intervalX,intervalY,intervalZ)
    // }
    for (let i = 0; i < ParticalObject.pollutionGridCoors.length; i++) {// ParticalObject.pollutionGridCoors.length
        ParticalObject.nextLayerPollutionSource = [] //清空下层污染源
        let currentLayerPollutionSources = pollutionGridCoors[i]//当前层污染源
        for (let j = 0; j < currentLayerPollutionSources.length; j++) {
             const pollutionPoint = currentLayerPollutionSources[j] 
                ParticalObject.adjacentGridSimulate(pollutionPoint,num,centerPointsXYZ,rightButtom3,modelToWorld,worldToModel,intervalX,intervalY,intervalZ)          
        }
        if (ParticalObject.nextLayerPollutionSource.length != 0) {        
            pollutionGridCoors.push(ParticalObject.nextLayerPollutionSource)     //添加下层污染源  
            ParticalObject.combineTwoLayer()//添加下层相邻网格  
        }
    }

    scene.primitives.add(
        new Cesium.DebugModelMatrixPrimitive({
            modelMatrix: modelMatrix,
            length: 1000.0,
        })
    );
}



/**模拟地表污染扩散 */
function surfaceDiffusion() {
    let points = ParticalObject.points
    let heigthBefore = points[0]
     
    let modelMatrixCom = ParticalObject.computerModelMatrix(modelMatrix);
    if ( ParticalObject.points.length == 0) {
        console.log("请选择污染源！");
        return;
        
    }
     //粒子更新函数
    async function update(particle, dt) {
        let offsetValue = 5;
        let offsetX = Cesium.Math.randomBetween(-offsetValue,offsetValue);
        let offsetY = Cesium.Math.randomBetween(-offsetValue,offsetValue);
        let offsetCartesian = new Cesium.Cartesian3(offsetX, offsetY, 0) 
        // let offsetX = new Cesium.Cartesian3(5, 0, 0) //相邻点偏移量
        // let offsetY = new Cesium.Cartesian3(0,5,0)
        let position = particle.position
        
        //particle.velocity = Cesium.Cartesian3.UNIT_X;//会报错，不能直接赋值
        // Cesium.Cartesian3.clone(
        //     new  Cesium.Cartesian3(0, 0, -1),
        //         particle.velocity
        // );
       
        //转换为模型坐标
        let positionScratch = Cesium.Matrix4.multiplyByPoint(
            modelMatrixCom.worldToModel,
            position,
            new Cesium.Cartesian3()
        );

        //偏移
        let positionOffset = Cesium.Cartesian3.add(positionScratch, offsetCartesian, new Cesium.Cartesian3())
        // console.log(positionScratch+":"+positionOffset);

        //转换为世界坐标
        let positionOffsetScratch = Cesium.Matrix4.multiplyByPoint(
            modelMatrixCom.modelToWorld,
            positionOffset,
            new Cesium.Cartesian3()
        );

        //根据x,y计算地形高度
        let beforePositionCarto = Cesium.Cartographic.fromCartesian(position, Cesium.Ellipsoid.WGS84, new Cesium.Cartographic())
        let newPositionCarto=  Cesium.Cartographic.fromCartesian(positionOffsetScratch, Cesium.Ellipsoid.WGS84, new Cesium.Cartographic())
        
        let beforePosition =  await Cesium.sampleTerrainMostDetailed(hhuDem, beforePositionCarto)
        let newPosition = await Cesium.sampleTerrainMostDetailed(hhuDem, newPositionCarto)
        let differenceHeight = newPosition.height - beforePosition.height
        //改天继续-20210203
        if (differenceHeight <0) {
            // let velocity = Cesium.Cartesian3.add(offsetCartesian, new Cesium.Cartesian3(0,0,differenceHeight), new Cesium.Cartesian3())
            particle.position =  positionOffsetScratch
          
        }else{
           
            // Cesium.Cartesian3.clone(
            //     Cesium.Cartesian3.ZERO,
            //     particle.velocity
            // );
        }

        //失败了，换种思路？20200203

    }

    ParticalObject.points.forEach(element => {
       
        let emitterInitialLocation = Cesium.Matrix4.multiplyByPoint(
            modelMatrixCom.worldToModel,//转换矩阵
            element,//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
            new Cesium.Cartesian3()//得到粒子坐标系下的位置cartesian3
        );

        let emitterModelMatrix = Cesium.Matrix4.fromTranslation(
            emitterInitialLocation,
            new Cesium.Matrix4()
        );//转换为四阶矩阵

        //添加粒子系统
        let particalSystem = scene.primitives.add(new Cesium.ParticleSystem({
            image: getImage(),//粒子图像
            color: Cesium.Color.CYAN,//开始颜色
            particleLife: 100,//每个粒子的生存时间，即子弹被打出来后能飞多久
            speed: 0.1,//粒子飞行速度
            imageSize: particlePixelSize,//粒子大小
            emissionRate: 5.0,//每秒发射粒子的个数
            emitter: new Cesium.BoxEmitter(),//粒子发射器的形式，确定了在什么样的区间里随机产生粒子
            lifetime: 100,//粒子发射器的生命周期，即发射粒子的时间
            updateCallback: update,//粒子位置更新回调函数
            modelMatrix: modelMatrix,//决定粒子在空间坐标系的位置矩阵
            emitterModelMatrix: emitterModelMatrix//决定粒子相对于模型位置的位置矩阵
        }));
        ParticalObject.particalSystems.push(particalSystem)
    
    });
    ParticalObject.points.length = 0;//清空污染点  

}

/**清除所有粒子系统 */
function stopSurfaceDiffusion() {
    ParticalObject.points = []
    ParticalObject.particalSystems.forEach((element)=>{
        element.destroy();
    })
    MeasureObject.removePoint();
}
/**模拟扩散 添加粒子系统*/
function simulate() {
    let points = ParticalObject.points;
    //判断是否为空
    if (points.length == 0) {
        console.log("请传入一个非空的粒子坐标数组！");
        return;
    }
    //从粒子坐标数组取出粒子，添加粒子系统
    points.forEach(element => {
        let pollutionSourceLocation = element;

        Cesium.Matrix4.multiplyByPoint(
            worldToParticle,//转换矩阵
            pollutionSourceLocation,//笛卡尔坐标系下点的坐标cartesian3，世界坐标系里
            emitterInitialLocation//得到粒子坐标系下的位置cartesian3
        );
        //添加粒子系统
        createParticle();
    });

}

// View in east-north-up frame
// var camera = viewer.camera;
// camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
// camera.lookAtTransform(
//     modelMatrix,
//     new Cesium.Cartesian3(-500.0, -500.0, 500.0)
// );

// // Show reference frame.  Not required.
// referenceFramePrimitive = scene.primitives.add(
//     new Cesium.DebugModelMatrixPrimitive({
//         modelMatrix: modelMatrix,
//         length: 1000.0,
//     })
// );

