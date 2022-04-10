/**
 * 初始化元胞类
 * 
 */
class VadoseZoneCell {
    _moleK = 1.28 * Math.pow(10, -9) //丙酮溶液分子扩散系数
    _rows = 9 //行数，Y
    _columns = 9 //列数，X
    _heights = 9 //纵数
    _halfGridX = Math.floor(this._columns / 2) // 元胞区域X方向半长
    _halfGridY = Math.floor(this._rows / 2) //元胞区域Y方向半长
    spreadArea = undefined //所有元胞对象数组
    isPollutedArea = [] //所有被污染的元胞数组
    nextPollutedArea = [] //下一时刻将被污染的元胞数组
    _dimensions = null //元胞大小
    _cellX = 0.0 //元胞x方向长度
    _cellY = 0.0 // y
    _cellZ = 0.0 //Z
    _cellDiagonal = 0.0 //斜向方向
    _moistureContentS = 0.5652 //饱和土壤体积含水率
    _moistureContentR = 0.1641 //剩余土壤体积含水率
    _paramN = 1.5003 //参数n
    _paramM = 1 - 1 / this._paramN
    _paramW = 0.0506 //参数阿尔法
    _permeabilityKS = 0.05451948 //饱和土壤水渗透系数,m/h
    mechanicalDegreeLong = 0.01008 //纵向（水流方向）机械弥散度m2/h
    mechanicalDegreeTran = this.mechanicalDegreeLong / 3 //横向（垂直水流方向）机械弥散度
    mechanicalDegreeVert = this.mechanicalDegreeLong / 3 //垂向（垂直水流方向）机械弥散度
    pollutionSourceCell = undefined //污染源元胞
    verKdiff = 0.2 //污染向潜水面的扩散系数
    _m = 0.16;
    _d = 0.084;
    _molecular = 0.51e-4; //分子扩散系数 m2/h
    _massThreshold = 0;//1.4e-6 //g阈值
    _roll = 876000 //g/m3苯的密度
    _outGdwater = []; //输出道潜水面的质量和位置[2,2,1.38,0.001]0.001为质量g,2,2为坐标,1.38为距离地面的深度
    constructor(waterLevel, rows, columns, heights, dimensions, heightM) {
        this._waterLevel = waterLevel //地下水位矩阵
        // this._waterVeloty = waterVeloty
        this._dimensions = dimensions //换算成cm 
        this._cellX = dimensions.x
        this._cellY = dimensions.y
        this._cellZ = dimensions.z
        this._cellVolume = this._cellX * this._cellY * this._cellZ //元胞体积
        this._cellDiagonal = Math.sqrt(Math.pow(this._cellX, 2) + Math.pow(this._cellY, 2))
        this._cellDiagonalXYZ = Math.sqrt(Math.pow(this._cellX, 2) + Math.pow(this._cellY, 2), Math.pow(this._cellZ, 2))
        this._rows = Cesium.defaultValue(rows, this._rows)
        this._columns = Cesium.defaultValue(columns, this._columns)
        this._heights = Cesium.defaultValue(heights, this._heights)
        this._heightM = heightM //地表高度矩阵
        this._init()
    }

    /**
     * 初始化元胞空间
     */
    _init() {
        this.spreadArea = new Array(this._columns)
        for (let i = 0; i < this._columns; i++) {
            this.spreadArea[i] = new Array(this._rows)
            for (let j = 0; j < this._rows; j++) {
                this.spreadArea[i][j] = new Array(this._heights)
            }
        }
        for (let i = 0; i < this._columns; i++) {
            for (let j = 0; j < this._rows; j++) {
                for (let k = 0; k < this._heights; k++) {
                    this.spreadArea[i][j][k] = {
                        'position': [i, j, k], //注意网格坐标的i是坐标系中的y,写反了，元胞数组的的行列和盒子相反
                        'cellMass': 0.0,
                        'isUpdateCellMass': 0.0,
                        'waterFlow': undefined, //水流方向
                        'waterLevel': 0, //压力水头
                        'moistureContent': 0,
                        'permeabilityCoeff': 0.0, //非饱和土壤水渗透系数
                        'cellSlop': null, //坡降,认为是当前的水流速度
                        'lessWaterCells': [], //临近元胞中水位更小的元胞
                        'cellDistance': null, //流向方向上的元胞距离
                        'boundary': 'noBoundary', //边界条件
                        'isPolluted': false, //是否被污染 
                        'worldPosition': undefined, //元胞世界坐标
                        'modelPosition': undefined, //模型坐标
                        'mechanicalCoeffs': [], //机械弥散系数，0：纵向，1：横向，2：垂向
                        'cellOncentration': 0.0, //污染物浓度
                        'isTrailPloy': false, //流动线？
                        'fatherNode': null, //父节点,先不写子节点，貌似没什么用
                        'name': "vadoseCell", //元胞的名称
                        'particlePool': [], //粒子池
                        'averageTime': 0, //当前元胞推演一个过程花费的时间
                        'locationH': 0, //位置水头
                        'height': this._heightM[i][j],
                        'gdwaterLevel': this._waterLevel[i][j],
                        'color':'white', //元胞颜色
                        'speeds':[], //速度各分量
                        'fenliangPosition':undefined, //机械弥散分量位置
                        'timeStep':0, //时间步长
                        'h':0,//压力水头

                    }
                    if (k == 0) {
                        this.spreadArea[i][j][k].boundary = '0' //正方体最上方的那个面
                    }
                    if (i == 0) {
                        this.spreadArea[i][j][k].boundary = '1' //正方体最后方的那个面（瞬时针排序）
                    }
                    if (j == this._rows - 1) {
                        this.spreadArea[i][j][k].boundary = '2' //正方体最右方的那个面
                    }
                    if (i == this._columns - 1) {
                        this.spreadArea[i][j][k].boundary = '3' // 正方体最前方的那个面
                    }
                    if (j == 0) {
                        this.spreadArea[i][j][k].boundary = '4' //正方体最左方的那个面
                    }
                    if (k == this._heights - 1) {
                        this.spreadArea[i][j][k].boundary = '5' //正方体最底部的那个面
                    }
                    // 边界条件后面再改进

                    //压力水头
                    this._setWaterLevel(this._heightM[i][j], this._waterLevel[i][j], k, this.spreadArea[i][j][k])

                    // 土壤含水率
                    this._setMoistureContent(this.spreadArea[i][j][k])
                    
                    //土壤水渗透系数
                    this._setPermeabilityCoeff(this.spreadArea[i][j][k])
                    this._setLocationH(this.spreadArea[i][j][k], k)

                }
            }
        }
        this._updateWaterFlow() //更新水流流向和坡降

    }

    get outGdwater(){
        return this._outGdwater;
    }

    //有序插入，递减
    _orderInsert(arr, obj, key) {
        let p = arr.length - 1;
        while (obj[key] > arr[p][key]) {
            arr[p + 1] = arr[p]
            p--;
        }
        arr[p + 1] = obj;
        return arr;
    }

    //添加位置水头，判断是否在潜水面之下
    _setLocationH(cell, k) {
        cell.locationH = this._dimensions.z * (this._heights - k - 0.5)
    }


    /**
     * 给污染元胞赋于污染物质量
     * @param {行号} row 
     * @param {列号} col 
     * @param {污染物质量} value 
     */
    setPollutantMass(row, col, heigths, value) {
        this.spreadArea[row][col][heigths].cellMass += value;
        if ((!this.spreadArea[row][col][heigths].isPolluted) & (this.spreadArea[row][col][heigths].cellMass > 0)) {
            this.spreadArea[row][col][heigths].isPolluted = true
            this.isPollutedArea.push(this.spreadArea[row][col][heigths])
            this.spreadArea[row][col][heigths].fatherNode = [row, col]
            this.pollutionSourceCell = this.spreadArea[row][col][heigths] //注意，只有一个污染源，多个污染源的情况需要改代码
        }
    }

    /**
     * 
     * @param {相对高程} value 
     * @returns 元胞的压力水头
     */
    _setWaterLevel(v1, v2, k, cell) {
        const depth = (k+0.5)*this._cellZ;
        const h0 = v1-v2;
        const k1 = h0 / (Math.exp(h0) - 1);
        const h = h0 - k1*Math.exp(depth) + k1;
        cell.waterLevel = h;
        return h;
    }

    /**
     * 
     * @param 
     * @returns 土壤体积含水率
     */
    _setMoistureContent(cell) { //waterLevelValue
        let h = cell.waterLevel < 0 ? 0 : cell.waterLevel;
        let fm1 = 1 + Math.pow(this._paramW * h, this._paramN)
        let fm = Math.pow(fm1, this._paramM)
        let res =  this._moistureContentR + (this._moistureContentS - this._moistureContentR) / fm
        cell.moistureContent = res;
        return res
    }

    /**
     * 给当前元胞的非饱和渗透系数赋值
     * @param {当前元胞} spreadAreaGrid 
     */
    _setPermeabilityCoeff(spreadAreaGrid) {
        let permeabilitySe = (spreadAreaGrid.moistureContent - this._moistureContentR) / (this._moistureContentS - this._moistureContentR)
        spreadAreaGrid.permeabilityCoeff = this._permeabilityKS * Math.pow(permeabilitySe, 0.5) * Math.pow(1 - Math.pow(1 - Math.pow(permeabilitySe, 1 / this._paramM), this._paramM), 2);
        
    }

    /**
     * 同一个平面上的元胞距离
     * @param {中心行号} i 
     * @param {列号} j 
     * @param {当前行} m 
     * @param {当前列} n 
     * @returns 
     */
    _judgeDistance(i, j, m, n) {
        let cellDistance = 0.0
        let direction = 0
        if ((m == i & n == j + 1) | (m == i & n == j - 1)) {
            cellDistance = this._cellX
        } else if ((m == i - 1 & n == j) | (m == i + 1 & n == j + 1)) {
            cellDistance = this._cellY
        } else if (m == i & n == j) {
            cellDistance = this._cellZ
        } else {
            cellDistance = this._cellDiagonal
            direction = 1
        }
        return {
            'distance': cellDistance,
            'direction': direction
        }
    }

    /**
     * D8算法计算水流方向
     * @param {中心元胞行号} i 
     * @param {列号} j 
     * @param {起始行号} k1 
     * @param {结束行号} k2 
     * @param {起始列号} t1 
     * @param {结束列号} t2 
     * @returns 流向和坡降
     * 
     */
    _computerWaterFlow(i, j, k, k1, k2, t1, t2, v1, v2) {
        let cellSlop = 0.0
        let kshuAll = 0
        let waterFlow = [i, j, v2] //默认垂直向下扩散，避免周水流洼地
        let timeStep = 0
        let spreadArea = this.spreadArea[i][j][k]
        const centerWaterLevel = spreadArea.waterLevel

        for (let m = k1; m < k2 + 1; m++) {
            for (let n = t1; n < t2 + 1; n++) {
                const waterLevel = this.spreadArea[m][n][k].waterLevel

                if (waterLevel < centerWaterLevel) { //当前水头压力更低
                    let distanceObj = this._judgeDistance(i, j, m, n)
                    let slop = (centerWaterLevel - waterLevel) / distanceObj.distance
                    // if (!spreadArea.lessWaterCells.includes([m, n, k])) { //注意v1，只会流向，流向元胞的底部的的元胞
                    let speed = spreadArea.permeabilityCoeff * slop / spreadArea.moistureContent
                    let time = distanceObj.distance / speed
                    let kshu = speed / distanceObj.distance
                    kshuAll += kshu

                    spreadArea.lessWaterCells.push({
                        'position': [m, n, k],
                        'distance': distanceObj.distance,
                        'slop': slop,
                        'speed': speed,
                        'time': time,
                        'kshu':kshu,
                        'direction':distanceObj.direction,
                    })
                    // 加入当前元胞的底部
                    let distance = Math.sqrt(Math.pow(distanceObj.distance, 2) + Math.pow(this._cellZ, 2))
                    slop = (centerWaterLevel - this.spreadArea[m][n][v2].waterLevel) / distance
                    speed = spreadArea.permeabilityCoeff * slop / spreadArea.moistureContent
                    time = distanceObj.distance / speed
                    kshu = speed / distance
                    kshuAll += kshu                    
                    spreadArea.lessWaterCells.push({
                        'position': [m, n, v2],
                        'distance': distance,
                        'slop': slop,
                        'speed': speed,
                        'time': time,
                        'kshu':kshu,
                        'direction':1,
                    })
                    // }

                    //计算流向
                    if (slop > cellSlop) {
                        cellSlop = slop
                        waterFlow = [m, n, v2]
                        timeStep = time
                    }
                    spreadArea.cellDistance = distance
                }
            }
        }
        //添加垂直向下的元胞
        // if (!spreadArea.lessWaterCells.includes([i, j, v2])) { 
        let speed = spreadArea.permeabilityCoeff * this._cellZ / spreadArea.moistureContent
        let kshu = speed / this._cellZ
        kshuAll += kshu
        spreadArea.lessWaterCells.push({
            'position': [i, j, v2],
            'distance': this._cellZ,
            'direction': 'z',
            'slop': this._cellZ,
            'speed': speed,
            'time': this._cellZ / speed,
            'kshu':kshu,
            'direction':0,
        })
        spreadArea.cellDistance = this._cellZ;

        // }
        return {
            'cellSlop': cellSlop,
            'waterFlow': waterFlow,
            'timeStep':timeStep,
            'kshuAll':kshuAll,
        }
    }

    /**
     * 设置影响系数K
     * @param {发生对流作用的元胞} lessWaterCells 
     * @param {速度总和} speedAll 
     */
    _setK(lessWaterCells, kshuAll) {
        for (const lessWater of lessWaterCells) {
            lessWater.k = lessWater.kshu / kshuAll
           
        }
    }

    /**
     * 更新单个元胞水流方向和坡降
     * @param {当前行号} i 
     * @param {列号} j 
     */
    _updateCellWaterFlow(i, j, k) {
        if (this.spreadArea[i][j][k].boundary == 'noBoundary') { //边界条件有点复杂，后面改进、
            let results = this._computerWaterFlow(i, j, k, i - 1, i + 1, j - 1, j + 1, k - 1, k + 1)
            const cell =  this.spreadArea[i][j][k]
            cell.cellSlop = results.cellSlop
            cell.waterFlow = results.waterFlow
            cell.timeStep = results.timeStep
            this._setK( this.spreadArea[i][j][k].lessWaterCells, results.kshuAll)
        }

    }

    /**
     * 更新水流和坡降
     */
    _updateWaterFlow() {
        for (let i = 0; i < this._columns; i++) {
            for (let j = 0; j < this._rows; j++) {
                for (let k = 0; k < this._heights; k++) {
                    this._updateCellWaterFlow(i, j, k)
                }
            }
        }
    }

    /**
     * 
     * @param {被污染元胞} currentCell 
     * @param {污染物质量} mass 
     * @param {污染扩散元胞位置} position1
     * @param {被污染元胞位置} position2
     */
    _updatePollutedState(currentCell, mass, position1, position2) {
        if (!currentCell) { //当前元胞不存在
            return
        }
        // 判断质量是否小于阈值
        if( mass < this._massThreshold){//小于阈值，不发生扩散
            return;
        }

        //判断是否为污染物输出,更新状态
        if (mass > 0 && !currentCell.isPolluted) {
            currentCell.isPolluted = true
            this.nextPollutedArea.push(currentCell)
            this.isPollutedArea.push(currentCell)
            this.spreadArea[position2[0]][position2[1]][position2[2]].fatherNode = position1
        }
        
        //限制质量为负的情况，更新质量
        if (currentCell.cellMass + mass > 0) {
            currentCell.cellMass += mass
        }
    }

    /**
     * 更新一个步长的污染物质量
     * @param {污染源网格坐标} position1 
     * @param {水流方向网格坐标} position2 
     * @param {横向扩散质量} massX 
     * @param {纵向} massY 
     * @param {垂直} massZ 
     * @param {*} massXY 
     * @param {*} massXZ 
     * @param {*} massYZ 
     * @param {*} massXYZ 
     */
    _updateCellMassOneStep(position1, position2, mass) { //massX, massY, massZ, massXY, massXZ, massYZ, massXYZ) {

        const x1 = position1[0]
        const y1 = position1[1]
        const z1 = position1[2]
        const x2 = position2[0]
        const y2 = position2[1]
        const z2 = position2[2]

        this._updatePollutedState(this.spreadArea[x2][y2][z2], mass, position1, [x2, y2, z2])
    }
    // 是否超出包气带的范围，因为元胞空间包含地表以上和地下水位以下的部分
    _isVadoseCell([i,j,k]) {
        let cell = this.spreadArea[i][j][k]
        return cell.waterLevel >= 0 ;
    }

    /**
     * 计算一个步长后的污染物质量
     * @param {当前污染元胞} currentCell 
     */
    _getOutMass(currentCell) {
        let lessWaterCells = currentCell.lessWaterCells;
        if (lessWaterCells.length > 0) {
            let allTime = 0
            let outMass = 0
            for (const element of lessWaterCells) {
               
                let [i,j,k] = element.position
                let spreadArea = this.spreadArea[i][j][k]
                let md = this._m
                if(element.direction === 1){
                    md = this._m * this._d
                }
                let mass = md *element.k *(currentCell.cellMass - spreadArea.cellMass);
                if(!md) debugger;
                
                // 判断质量是否小于阈值
                if(mass < this._massThreshold){//小于阈值，不发生扩散
                    continue;
                }

                outMass -= mass
                allTime += element.time

                // 判断是否到达潜水层，若到达将质量输出到潜水层
                this._updateCellMassOneStep(currentCell.position, element.position, mass)
                if (element.position[2] === this._heights-2) {
                    this._outGdwater.push([element.position[0], element.position[1], mass]);
                }
            }
            //更新质量
            currentCell.cellMass = currentCell.cellMass + outMass > 0 ? currentCell.cellMass + outMass: 0;
            //更新平均扩散时间
            currentCell.averageTime = allTime / currentCell.lessWaterCells.length 
        }
    }

    // 污染物质量更新，对流作用
    updateCellMass() {
        let isPollutedArea = Array.from(this.isPollutedArea)
        this.nextPollutedArea = [];
        this._outGdwater = [];
        for (const element of isPollutedArea) {
            this._getOutMass(element)
        }
    }

    //计算机械弥散系数
    //速度分解为三个方向，依次计算每个方向的纵向、横向、垂向弥散系数，将得到的结果返回，
    //最后将每个方向的弥散系数进行累加，得到最终三个方向的弥散系数值
    _computerChanicalCoeff(velocityX, velocityY, velocityZ, velocity) {
        let mechanicalCoeffX = Math.pow(velocityX, 2) / velocity * this.mechanicalDegreeLong + Math.pow(velocityY, 2) / velocityZ * this.mechanicalDegreeTran + Math.pow(velocityZ, 2) / velocity * this.mechanicalDegreeVert+this._molecular
        let mechanicalCoeffY = Math.pow(velocityX, 2) / velocity * this.mechanicalDegreeTran + Math.pow(velocityY, 2) / velocityZ * this.mechanicalDegreeLong + Math.pow(velocityZ, 2) / velocity * this.mechanicalDegreeVert+this._molecular
        let mechanicalCoeffZ = Math.pow(velocityX, 2) / velocity * this.mechanicalDegreeVert + Math.pow(velocityY, 2) / velocityZ * this.mechanicalDegreeTran + Math.pow(velocityZ, 2) / velocity * this.mechanicalDegreeLong+this._molecular
        let mechanicalCoeffXY = (this.mechanicalDegreeLong - this.mechanicalDegreeTran) * velocityX * velocityY / velocity
        let mechanicalCoeffXZ = (this.mechanicalDegreeLong - this.mechanicalDegreeVert) * velocityX * velocityZ / velocity
        let mechanicalCoeffYZ = (this.mechanicalDegreeLong - this.mechanicalDegreeVert) * velocityY * velocityZ / velocity
        return [mechanicalCoeffX, mechanicalCoeffY, mechanicalCoeffZ, mechanicalCoeffXY, mechanicalCoeffXZ, mechanicalCoeffYZ]
    }


    //机械弥散系数赋予元胞对象
    _setMechanicalCoeff(currentCell) {
        if(currentCell.speeds.length === 0){
            let goalCellPosition = currentCell.waterFlow
            let [x,y,z] = currentCell.position
            let [x1,y1,z1] = goalCellPosition
            let speed = (currentCell.cellSlop * currentCell.permeabilityCoeff) || currentCell.permeabilityCoeff
            let speedX = speed * this._cellX * Math.abs(x1-x) / currentCell.cellDistance
            let speedY = speed * this._cellY * Math.abs(y1-y) / currentCell.cellDistance
            let speedZ = speed * this._cellZ * Math.abs(z1-z) / currentCell.cellDistance
            currentCell.speeds.push(speed, speedX, speedY, speedZ)

            currentCell.fenliangPosition = [[x1,y,z],[x,y1,z],[x,y,z1]]
        }

        if (currentCell.mechanicalCoeffs.length === 0) {
            let  [speed,speedX, speedY, speedZ] = currentCell.speeds
            currentCell.mechanicalCoeffs = this._computerChanicalCoeff(speedX, speedY, speedZ, speed)
        }
    }

    //计算更新周围元胞质量
    _updateMechanicalCell(currentCell) {
       
        const position = currentCell.position
        const fenliangPosition = currentCell.fenliangPosition
        const [mechanicalCoeffX, mechanicalCoeffY, mechanicalCoeffZ, mechanicalCoeffXY, mechanicalCoeffXZ, mechanicalCoeffYZ] = currentCell.mechanicalCoeffs
        //分量元胞  
        const [p1,p2,p3] = fenliangPosition
        const cellX = this.spreadArea[p1[0]][p1[1]][p1[2]]
        const cellY = this.spreadArea[p2[0]][p2[1]][p2[2]]
        const cellZ = this.spreadArea[p3[0]][p3[1]][p3[2]]
        // 浓度梯度
        let densityX = (-cellX.cellMass + currentCell.cellMass) / this._cellX / this._cellVolume
        let densityY = (-cellY.cellMass + currentCell.cellMass) / this._cellY / this._cellVolume
        let densityZ = (-cellZ.cellMass + currentCell.cellMass) / this._cellZ / this._cellVolume
        // 弥散通量
        let wx = mechanicalCoeffX * densityX + mechanicalCoeffXY * densityY + mechanicalCoeffXZ * densityZ
        let wy = mechanicalCoeffXY * densityX + mechanicalCoeffY * densityY + mechanicalCoeffYZ * densityZ
        let wz = mechanicalCoeffXZ * densityX + mechanicalCoeffYZ * densityY + mechanicalCoeffZ * densityZ
        // 弥散质量分量
        let cellMassX = wx * this._cellY* this._cellZ * currentCell.timeStep
        let cellMassY = wy * this._cellX* this._cellZ * currentCell.timeStep
        let cellMassZ = wz * this._cellY* this._cellX * currentCell.timeStep
        // 更新质量
        this._updatePollutedState(cellX, cellMassX, p1 , position)
        this._updatePollutedState(cellY, cellMassY, p2 , position)
        this._updatePollutedState(cellZ, cellMassZ, p3 , position)

        currentCell.cellMass -= (cellMassX  + cellMassY + cellMassZ);
     
    }

    // 污染物质量更新，机械弥散
    //该弥散的邻域是三维空间中上下、左右、前后的6个元胞对象，不包括斜向，斜向太复杂
    mechanicalDispersion() {
        const isPollutedArea = Array.from(this.isPollutedArea)
        this.nextPollutedArea = []
        isPollutedArea.forEach((element) => {
            if (element.boundary == 'noBoundary') {

                //计算机械弥散系数  
                this._setMechanicalCoeff(element)

                //更新质量
                this._updateMechanicalCell(element)
            }
        })
    }


    //对流弥散作用 先对流后弥散
    simulate() {
        const isPollutedArea = Array.from(this.isPollutedArea)
        this.nextPollutedArea = [];
        this._outGdwater = [];
        for(let i=0, len = isPollutedArea.length; i<len; i++){
            const element = isPollutedArea[i];
            if (element.boundary == 'noBoundary') {

                this._getOutMass(element)

                //计算机械弥散系数  
                this._setMechanicalCoeff(element)

                //更新质量
                this._updateMechanicalCell(element)
            }
        }
    }


    // 一步扩散
    simulateByStep(currentPollutedCell){
        this.nextPollutedArea = [];
        this._outGdwater = [];
        if (currentPollutedCell.boundary === 'noBoundary') {

            this._getOutMass(currentPollutedCell)

            //计算机械弥散系数  
            this._setMechanicalCoeff(currentPollutedCell)

            //更新质量
            this._updateMechanicalCell(currentPollutedCell)
        }
       
        return this.nextPollutedArea;
    }




}
export default VadoseZoneCell