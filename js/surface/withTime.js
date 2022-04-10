/**
 * 随时间扩散的类
 * 主要实现功能
 * 1.污染物流动的时间和现实时间一一对应，按时间更新位置
 * 2.每个时刻随元胞浓度渐变的颜色插值效果
 */
class WithTime {
    /**
     * 
     * @param {划分矩形和计算矩形位置的对象} computerRectangle 
     * @param {添加矩形和更改矩形外观的对象} addRectangle 
     * @param {根据浓度颜色插值的对象} computerColor 
     * @param {当前污染元胞对象} cellObj 
     * @param {污染更新一个时刻的函数名称} funName 
     */
    constructor(computerRectangle, addRectangle, computerColor, cellObj, funName) {
        this._cellObj = cellObj;
        this._funName = funName;
        this._isPollutedArea = cellObj.isPollutedArea;
        this._pollutionSourceCell = cellObj.pollutionSourceCell;
        this._computerRectangle = computerRectangle;
        this._addRectangle = addRectangle;
        this._computerColor = computerColor;
        this._index = 0;
        this._nextPollutedArea = cellObj.pollutionSourceCell;
    }

    /**
     * @param {any} a
     */
    set addRectangle(a) {
        this._addRectangle = a;
    }

    /**
     * 推演多少多少次
     * @param {次数} step 
     */
    simulateByStep(step = 10) {
        for (let i = 0; i < step; i++) {
            const nextPollutedArea = this._cellObj[this._funName]();
            for (const element of nextPollutedArea) {
                this._generateRectangle(element);
            }
            this._updateColor(this._isPollutedArea);
            console.log(this._isPollutedArea[0].cellMass, this._isPollutedArea[this._isPollutedArea.length-1].cellMass)
        }

    }


    //随时间动态仿真 1算法
    async simulateWithTime(isSleep = true, number, time) { //5分钟
        let start = Date.now();
        let stack = [this._pollutionSourceCell];
        let arrs;
        let realTime = 0; //真实时间
        while (arrs = stack.shift()) {

            if (arrs.length == 0) {
                continue;
            }
            let t = 0;
            // arrs = this._quickSort(arrs, "time");
            this._sort(arrs, "time");

            realTime = arrs[arrs.length - 1].time * 60;  //分钟
            if (isSleep) { //按照真实时间等待
                for (const element of arrs) {
                    t = Date.now() - start;
                    if (t >= element.time * 3600 * 1000) {
                        this._generateRectangle(element);
                    } else {
                        let interval = element.time * 3600 * 1000 - t;
                        await this._sleep(element, interval);
                    }
                }
            } else { //不需要实时等待
                if (number) {
                    for (const element of arrs) {
                        this._generateRectangle(element);
                    }
                    realTime = arrs[0].time * 60;
                } else if (time) {
                    for (const element of arrs) {
                        if (time >= element.time*60) {
                            this._generateRectangle(element);
                        } else {
                            realTime = element.time * 60
                            console.log("扩散时间：" + element.time * 60 + "分钟；推演：" + this._index + "次！");
                            break;
                        }
                    }
                }
            }

            // 更新颜色
            this._updateColor(this._isPollutedArea);
            console.log("扩散时间：" + realTime + "分钟；推演：" + this._index + "次！");

            if (number) {
                if (this._index >= number) {
                    break;
                }
            } else if (time) {
                if (realTime >= time) {
                    break;
                }
            }


            const nextPollutedArea = this._cellObj[this._funName]();
            stack.push(nextPollutedArea);
            this._index++; 


        }
    }


    /**
     * 降雨条件下，指定扩散时间
     * @param time 分钟
     */
    simulateWithRainTime(time) {
        let stack = [this._pollutionSourceCell],
            realTime = 0,
            arrs;
        while (arrs = stack.shift()) {
            if (arrs.length == 0) {
                continue;
            }
            arrs = this._sort(arrs, "time");
            realTime = arrs[arrs.length - 1].time / 60;
            for (const element of arrs) {
                if (time * 60 >= element.time) {
                    this._generateRectangle(element);
                } else {
                    realTime = element.time / 60
                    console.log("扩散时间：" + element.time / 60 + "分钟；推演：" + this._index + "次！");
                    break;
                }
            }
            if (realTime >= time) {
                break;
            }

            this._updateColor(this._isPollutedArea);
            console.log("扩散时间：" + realTime + "分钟；推演：" + this._index + "次！");
            const nextPollutedArea = this._cellObj[this._funName]();
            stack.push(nextPollutedArea);
            this._index++;
        }
    }

    //更新所有污染元胞的颜色
    _updateColor(spreadCells) {
        // this._computerColor.startColor = Cesium.Color.fromCssColorString("#0b486b", new Cesium.Color());
        // this._computerColor.endColor = Cesium.Color.fromCssColorString("#f56217", new Cesium.Color());
        this._computerColor.startColor = Cesium.Color.ROYALBLUE
        this._computerColor.endColor = Cesium.Color.DARKORANGE
        this._computerColor.setColorToCell(spreadCells);
        // this._computerColor.setColorToCellWhatever(spreadCells);
        for (let i = 0; i < spreadCells.length; i++) {
            const element = spreadCells[i];
            let idStr = this._addRectangle.type + element.position;
            this._addRectangle.changeColor(idStr, element.color);
        }
    }

    //更改颜色
    _generateRectangle(item, color) {
        let rectangleDaos = this._computerRectangle.computerRectangleDaos(item.position);
        this._addRectangle.add(rectangleDaos);
    }

    //睡眠等待
    _sleep(element, ms) {
        return new Promise(resolve => setTimeout(() => {
            this._generateRectangle(element);
            resolve();
        }, ms));
    }

    // 睡眠
    _sleepTime(ms) {
        return new Promise(resolve => setTimeout(() => {
            resolve();
        }, ms));
    }


    _sort(arr, attr){
        arr.sort((a,b) => a[attr] - b[attr]);
    }

    // 快排
    _quickSort(arr, attr) {
        if (arr.length <= 1) {
            return arr;
        }
        var pivotIndex = Math.floor(arr.length / 2);
        var pivot = arr.splice(pivotIndex, 1)[0];
        var left = [];
        var right = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][attr] < pivot[attr]) {
                left.push(arr[i]);
            } else {
                right.push(arr[i]);
            }
        }
        return this._quickSort(left, attr).concat([pivot], this._quickSort(right));
    };


    clearAll() {
        this._addRectangle.clearAll();
    }


    // 随机颜色
    randomColor() {
        this._computerColor.randomColor2();
        this._updateColor(this._isPollutedArea);
    }


    isShow(f){
        this._addRectangle.isShow(f);
    }
}

export default WithTime;