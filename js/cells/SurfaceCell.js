import XLType from "../utils/XLType.js"

/**
 * 计算类
 * 
 */
class SurfaceCell {
    _m = 0.084 //静态扩散系数
    _d = 0.16 //斜向扩散系数
    _kdiffs = []
    _rows = 9 //行数，Y
    _columns = 9 //列数，X
    spreadArea = undefined //所有元胞对象数组
    isPollutedArea = [] //所有被污染的元胞数组
    nextPollutedArea = [] //下一时刻将被污染的元胞数组
    nextNotPollutedCells = []; //下一步长被污染、当前步长未被污染的元胞数组
    verKdiff = 3.95e-4 //污染物向土壤中的渗透系数 m/h
    verMass = 0; //一个步长时污染向土壤中渗透量
    pollutionSourceCell = [] //污染源元胞
    _xlength = 5.0; //x方向网格长度
    _ylenght = 5.0;
    _rh = this._xlength / 2;//100/1/876000//this._xlength / 4; //水力半径
    _n = 0.035; //糙率
    _roll = 876000 //g/m3苯的密度
    _rainStrength = 35; //mm/h雨强
    _rainOut = 30 //mm/h雨水下渗率
    _rainTime = 10/60 //降雨时间h
    _rainRh = 0.01;//(this._rainStrength - this._rainOut) * this._rainTime / 1000 //m
    _fre = 0.8274 //雷诺数转化系数
    isRain = false; //是否降雨
    _massThreshold = 0;//1.4e-3 //g
    constructor(heightMatrix, rows, columns,xlength,ylength) {
        if (!heightMatrix & !rows & !columns) {
            return
        }
        this._heightMatrix = heightMatrix
        this._rows = Cesium.defaultValue(rows, this._rows) //x
        this._columns = Cesium.defaultValue(columns, this._columns) //y
        // this._halfGridX = Math.floor(this._columns /2) // 元胞区域X方向半长
        // this._halfGridY = Math.floor(this._rows /2) //元胞区域Y方向半长
        this._xlength = Cesium.defaultValue(xlength, this._xlength);
        this._ylenght = Cesium.defaultValue(ylength, this._ylength);
        this._init()
    }

    // 获取t时刻的降雨强度t<60
    getRainWithTime(t, maxr=60, maxt=30){
        return t*(maxr-t)<0 ? 0 : t*(maxt-t);
    }

    /**
     * 
     * @param {初始渗透量} f0 
     * @param {饱和渗透量} fc 
     * @param {时间} t 
     */
    getOutWithTime(f0,  fc=90 ,t){
        return 30 + (fc-  f0)* Math.exp(-t);
    }
    /**
     * @param {number} val
     */
    set n(val){
        this._n = val;
    }
    /**
     * @param {number} f
     */
    set fre(f){this._fre = f}

    getRain(){
        return [this._rainStrength, this._rainTime, this._rainOut];
    }

    setRain(rain,raintime,rainOut){
        this._rainStrength = rain || 30.05;
        this._rainTime = raintime || 0.2; //化成小时
        this._rainOut = rainOut || 30;
    }
    /**
     * 初始化元胞空间
     */
    _init() {
        this.spreadArea = new Array(this._rows)
        for (let i = 0; i < this._rows; i++) {
            this.spreadArea[i] = new Array(this._columns)
        }
        for (let i = 0; i < this._rows; i++) {
            for (let j = 0; j < this._columns; j++) {
                this.spreadArea[i][j] = {
                    'position': [i, j],
                    'cellMass': 0,
                    'elevation': this._heightMatrix[i][j],
                    'kdiffs': [],
                    'boundary': 'noBoundary', //边界条件
                    'isPolluted': false, //是否被污染
                    'fatherNode': null, //父节点
                    'childNode': [], //子节点
                    'particlePool': [], //粒子池
                    'isTrailPloy': false, //当前元胞是否已经有流动线
                    'worldPosition': undefined, //元胞世界坐标
                    'modelPosition': undefined, //模型坐标
                    'name': "surfaceCell", //表示元胞代表的地质结构
                    "time": 0, //多久才会扩散到该元胞
                    'oneTime':0,//一次推演花的时间
                    "color":'green',//默认颜色值
                    "waiting":false, //是否在等待被污染
                    'isParticle':false, //是否生成过粒子系统
                    'speed':0, //当前网格的扩散速度,
                    'concen':0,//浓度

                }
                if (i == 0) {
                    this.spreadArea[i][j].boundary = 'topBoundary'
                }
                if (j == 0) {
                    this.spreadArea[i][j].boundary = 'leftBoundary'
                }
                if (i == this._rows - 1) {
                    this.spreadArea[i][j].boundary = 'buttomBoundary'
                }
                if (j == this._columns - 1) {
                    this.spreadArea[i][j].boundary = 'rightBoundary'
                }
                if (i == 0 & j == 0) {
                    this.spreadArea[i][j].boundary = 'leftTopBoundary'
                }
                if (i == 0 & j == this._columns - 1) {
                    this.spreadArea[i][j].boundary = 'rightTopBoundary'
                }
                if (i == this._rows & j == 0) {
                    this.spreadArea[i][j].boundary = 'leftButtomBoundary'
                }
                if (i == this._rows & j == this._columns) {
                    this.spreadArea[i][j].boundary = 'rightButtomBoundary'
                }
            }
        }
    }

    /**
     * 设置污染源、质量
     * @param {行} row 
     * @param {列} col 
     * @param {质量} mass 
     */
    setPollutedSourceCell(row, col, mass) {
        if (!this.spreadArea[row][col].isPolluted) {
            this.spreadArea[row][col].cellMass = mass;
            this.spreadArea[row][col].isPolluted = true;
            this.isPollutedArea.push(this.spreadArea[row][col]);
            this.pollutionSourceCell.push(this.spreadArea[row][col]);
        }
    }

    /**
     * 计算当前元胞与临近元胞的高差值和与高差比率
     * @param {元胞行号} i 
     * @param {元胞列号} j 
     * @returns 每个元胞的高程差影响因子
     */
    _computerKdiff(i, j) {
        if (this.spreadArea[i][j].kdiffs.length != 0) { //计算过的话直接返回
            return this.spreadArea[i][j].kdiffs
        }
        let heightMatrix = this._heightMatrix
        let center = heightMatrix[i][j]
        let hfull = 0
        let kdiffs = []

        for (let m = i - 1; m < i + 2; m++) {
            for (let n = j - 1; n < j + 2; n++) {
                const element = heightMatrix[m][n]
                let heightDiff = center - element
                if (heightDiff > 0) {
                    hfull += heightDiff
                }
            }
        }
        if (hfull == 0) { //临近元胞高程都大于中心，谷点
            return 0
        }
        let k = 0
        for (let m = i - 1; m < i + 2; m++) {
            for (let n = j - 1; n < j + 2; n++) {
                const element = heightMatrix[m][n]
                let heightDiff = center - element;
                if (heightDiff > 0) {
                    kdiffs[k] = {
                        "diff": heightDiff / hfull,
                        "slop": heightDiff / this._xlength,
                    };
                } else {
                    kdiffs[k] = {
                        "diff": 0,
                        "slop": 0,
                    };
                }
                k++
            }
        }
        this.spreadArea[i][j].kdiffs = kdiffs
        this._kdiffs = kdiffs
        return kdiffs
    }

    
    /**
     * 计算中央元胞的污染物质量，并更新周围元胞的污染物质量，为了配合优先时间扩散，即simulateWithTime
     * @param {元胞行号} i 
     * @param {元胞列号} j 
     * @returns 每个元胞新的污染物质量
     */
     _computerNewMass(i, j) {
        const mxshu = this._m
        const dxshu = this._d
        const centerMass = this.spreadArea[i][j].cellMass
        this.nextPollutedArea = [] //清空下个时刻被污染的元胞数组
        let kdiffs = this._computerKdiff(i, j)
        if (typeof kdiffs == "number" & kdiffs == 0) { //遇到谷点，返回原来的值
            return this.nextPollutedArea
        }
        
        let k = 0
        let crossMass = 0.0
        let inclineMass = 0.0
        const threshold = this._massThreshold;
        for (let m = i - 1; m < i + 2; m++) {
            for (let n = j - 1; n < j + 2; n++) {
                let currentMass = this.spreadArea[m][n].cellMass
                if (currentMass - centerMass > 0) { //如果该相邻元胞大于中央元胞则跳过这次计算
                    continue
                }
                const diff = kdiffs[k].diff;
                const slop = kdiffs[k].slop;
                if (diff > 0) {
                    // 常量
                    
                    //计算质量 
                    if (k % 2 == 1) {
                        let updateCellMass = mxshu * (diff+1) * (currentMass - centerMass)//<0
                        const mass = this.spreadArea[m][n].cellMass;
                        
                        // 大于阈值不发生扩散
                        if(-updateCellMass <  threshold){
                            continue;
                        }
                        this.spreadArea[m][n].cellMass = mass -updateCellMass; //更新下个污染元胞的质量
                        crossMass += updateCellMass // 当前元胞的静态扩散量

                    } else {
                        let updateCellMass = mxshu * dxshu * (diff+1) * (currentMass - centerMass) //<0
                        const mass = this.spreadArea[m][n].cellMass;
                        if(-updateCellMass <  threshold){
                            continue;
                        }
                        this.spreadArea[m][n].cellMass =  mass -updateCellMass;
                        inclineMass += updateCellMass
                    }

                    
                    // 改变状态
                    if (!this.spreadArea[m][n].isPolluted) { //当前元胞还未被污染，这是新的污染元胞
                        this.spreadArea[m][n].isPolluted = true //表示当前元胞已被污染
                        
                        this.isPollutedArea.push(this.spreadArea[m][n]);
                        // this._orderInsert(this.isPollutedArea, this.spreadArea[m][n], 'cellMass'); //有序插入
                        
                        //计算速度和时间
                        let currentMass = this.spreadArea[i][j].cellMass;

                        let rh = currentMass / this._roll / (this._xlength*this._ylenght); //水力半径的计算
                        let v = 1 / this._n * Math.pow(rh, 2 / 3) * Math.pow(slop, 1 / 2) * this._fre;
                        
                        if(this.isRain){//考虑降雨
                            rh += (this._rainStrength - this._rainOut) * this._rainTime / 1000; //加上降雨的水力半径
                            v = this._fre * Math.pow(this._rainStrength, 1-this._n)*Math.pow(rh, 2 / 3) * Math.pow(slop, 1 / 2)
                        }

                        // 换算成m/h
                        v = v * 3600;
                        
                        // 赋值
                        this.spreadArea[m][n].speed = v;
                        let t = this._xlength / v; 
                        this.spreadArea[m][n].oneTime = t;
                        this.spreadArea[m][n].time = this.spreadArea[i][j].time + t;
                        // console.log(this.spreadArea[m][n].time);
                        this.spreadArea[m][n].fatherNode = this.spreadArea[i][j].position //为该节点添加父节点
                        this.spreadArea[i][j].childNode.push(this.spreadArea[m][n].position) //为该节点添加子节点 9.12改动
                        //若已污染则不修改下一个
                        this.nextNotPollutedCells.push(this.spreadArea[m][n]);
                    }

                   
                }

                k++
            }
        }

         // 向下渗入土壤
        let cellMass = this.spreadArea[i][j].cellMass;
        let massD = this.spreadArea[i][j].oneTime* this.verKdiff * cellMass;
        massD = massD > cellMass ? cellMass : massD;
        this.verMass = massD;

        let newMass = (centerMass + crossMass + inclineMass - massD);
        this.spreadArea[i][j].cellMass  = newMass > 0 ? newMass :  0;
        // return this.nextPollutedArea;
        return this.nextNotPollutedCells;
    }

     /**
     * 降雨量会随时间改变
     * @param {元胞行号} i 
     * @param {元胞列号} j 
     * @returns 
     */
      _computerNewMassWithRainTime(i, j) {
        const mxshu = this._m
        const dxshu = this._d
        const centerMass = this.spreadArea[i][j].cellMass
        this.nextPollutedArea = [] //清空下个时刻被污染的元胞数组
        let kdiffs = this._computerKdiff(i, j)
        if (typeof kdiffs == "number" & kdiffs == 0) { //遇到谷点，返回原来的值
            return this.nextPollutedArea
        }

        let k = 0
        let crossMass = 0.0
        let inclineMass = 0.0
        const threshold = this._massThreshold;
        for (let m = i - 1; m < i + 2; m++) {
            for (let n = j - 1; n < j + 2; n++) {
                let currentMass = this.spreadArea[m][n].cellMass
                if (currentMass - centerMass > 0) { //如果该相邻元胞大于中央元胞则跳过这次计算
                    continue
                }
                const diff = kdiffs[k].diff;
                const slop = kdiffs[k].slop;
                if (diff > 0) {

                    // 计算质量
                    if (k % 2 == 1) {
                        let updateCellMass = mxshu * diff * (currentMass - centerMass) //<0
                        updateCellMass = updateCellMass < 0 ? updateCellMass : 0 ;//质量变大不发生流动
                        // 大于阈值不发生扩散
                        if(-updateCellMass <  threshold){
                            continue;
                        }
                        this.spreadArea[m][n].cellMass += -updateCellMass //更新下个污染元胞的质量
                        crossMass += updateCellMass // 当前元胞的静态扩散量

                    } else {
                        let updateCellMass = mxshu * dxshu * diff * (currentMass - centerMass) //<0
                        updateCellMass = updateCellMass < 0 ? updateCellMass : 0 ;//质量变大不发生流动
                        // 大于阈值不发生扩散
                        if(-updateCellMass <  threshold){
                            continue;
                        }
                        this.spreadArea[m][n].cellMass += -updateCellMass
                        inclineMass += updateCellMass
                    }

                    // 状态更新
                    if (!this.spreadArea[m][n].isPolluted) { //当前元胞还未被污染，这是新的污染元胞
                        this.spreadArea[m][n].isPolluted = true //表示当前元胞已被污染
                        // this._orderInsert(this.isPollutedArea, this.spreadArea[m][n], 'cellMass'); //有序插入
                        this.isPollutedArea.push(this.spreadArea[m][n]);

                        //计算速度和时间
                        let currentMass = this.spreadArea[i][j].cellMass;
                       
                        let rh = currentMass / this._roll / (this._xlength*this._ylenght); //水力半径的计算
                        const time = this.spreadArea[i][j].time / 60;//分钟
                        const oneTime = this.spreadArea[i][j].oneTime / 60 / 60;//小时
                        const rainStrength = this.getRainWithTime(time);
                        const rainOut = this.getOutWithTime(90,30,time);
                        rh += (rainStrength - rainOut) * oneTime / 1000; //加上降雨的水力半径
                        let v = this._fre * Math.pow(this._rainStrength, 1-this._n)*Math.pow(rh, 2 / 3) * Math.pow(slop, 1 / 2);
                        
                        // 换算成h
                        v = v *3600;

                        // 赋值
                        let t = this._xlength / v; //s
                        this.spreadArea[m][n].oneTime = t; 
                        this.spreadArea[m][n].time = this.spreadArea[i][j].time + t;
                        this.nextNotPollutedCells.push(this.spreadArea[m][n]);
                    }
                }
                k++
            }
        }

        let newMass = (centerMass + crossMass + inclineMass) > 0 ? (centerMass + crossMass + inclineMass):0;
        this.spreadArea[i][j].cellMass = newMass
        return this.nextNotPollutedCells;
    }



    // 算法改进的更改状态
    updateState(cell){
        if(cell.isPolluted)return;
        cell.isPolluted = true //表示当前元胞已被污染
        cell.waiting = false; //结束等待状态
        this._orderInsert(this.isPollutedArea, cell, 'cellMass'); //有序插入
    }

    // 更改状态 表示等待被污染
    waiting(cells){
        Array.isArray(cells)?true:cells=[cells];
        if (cells.length == 0) {
            return;
        }
        for (let i = 0; i < cells.length; i++) {
            cells[i].waiting = true;
        }
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

    /**
     * 污染物质量计算、更新的入口函数
     * @param {被污染的元胞对象} currentSpreadArea 
     */
    computerCellMass(currentSpreadArea){
        if (currentSpreadArea.boundary == 'noBoundary') {  //当前元胞无边界  
            
            if (!XLType.xlAlert(!this.isEnding(),"迭代已终止！")) return //终止迭代
            
            let position = currentSpreadArea.position
            this._computerNewMass(position[0],position[1])
        }
        return this.nextPollutedArea
    }


    /**
     * 判断是否达到迭代终止条件
     * @returns 真假
     */
    isEnding(){
        let pollutionSourceCell = this.pollutionSourceCell[0];
        if (pollutionSourceCell.childNode.length != 0) {
            pollutionSourceCell.childNode.forEach(element => {
                if (element.cellMass > pollutionSourceCell.cellMass) {
                    return true;
                }else{
                    return false;
                }
            });     
        }else{
            return false;
        }
        
    }


    /**
     * 对当前时刻污染元胞进行一次推演
     * @param {当前污染区域} currentSpreadArea 
     * @returns 下个步长的污染元胞数组
     */
    simulateOneStep(currentSpreadArea) {
        this.nextNotPollutedCells = [];
        if (!currentSpreadArea) {
            let isPollutedArea = Array.from(this.isPollutedArea);
            for (const element of isPollutedArea) {
                if (element.boundary == 'noBoundary') { //当前元胞无边界  
                    let position = element.position
                    this._computerNewMass(position[0], position[1])
                }
            }
        } else {
            if (currentSpreadArea.boundary == 'noBoundary') { //当前元胞无边界  
                let position = currentSpreadArea.position
                this._computerNewMass(position[0], position[1])
            }
        }

        // 排序
        this.isPollutedArea.sort((a,b)=>b.cellMass-a.cellMass);

        // console.log('最大质量为:' + this.isPollutedArea[0].cellMass)

        return this.nextNotPollutedCells;
    }

     /**
     * 对当前时刻污染元胞进行一次推演
     * @param {当前污染区域} currentSpreadArea 
     * @returns 下个步长的污染元胞数组
     */
      simulateOneStepWithRainTime() {
        this.nextNotPollutedCells = [];
   
        let isPollutedArea = Array.from(this.isPollutedArea);
        for (const element of isPollutedArea) {
            if (element.boundary == 'noBoundary') { //当前元胞无边界  
                let position = element.position
                this._computerNewMassWithRainTime(position[0], position[1])
            }
        }

        // 排序
        this.isPollutedArea.sort((a,b)=>b.cellMass-a.cellMass);

        return this.nextNotPollutedCells;
    }

}
export default SurfaceCell