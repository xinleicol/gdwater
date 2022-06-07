//根据质量插值计算颜色
//线性内插或外推

import Computer from "./Computer.js"
import color100 from '../../source/100.json' assert { type: 'json' };


class ComputerColor extends Computer{

    constructor(currentVal, totalVal){
        super()
        this._startCor = Cesium.Color.fromCssColorString(color100[0][0])//.withAlpha(0.6)
        this._endCor = Cesium.Color.fromCssColorString(color100[0][4])//.withAlpha(0.6)
        this._currentVal = currentVal
        this._totalVal = totalVal;
        this.allMass = 30; //污染物质量总数
        this.massBounding = null;
        this._colors = null; //渐变色条
        this._r = 0; //随机索引
    }

    get colors(){
        return this._colors;
    }

    get currentVal(){return this._currentVal}

    set currentVal(cv){
        this._currentVal = cv
    }

    get totalVal(){
        return this._totalVal
    }

    set totalVal(tv){
         this._totalVal = tv
    }

    get startColor(){
        return this._startCor
    }

    set startColor(c){
        this._startCor = c
    }

    get endColor(){
        return this._endCor
    }

    set endColor(c){
        this._endCor = c
    }


    /**
 * 
 * @returns 污染物质量边界数组  
 */
    _init(){
        if(this.massBounding){return}
        this._colors = color100[0].reverse();
        // this._lerp(10);
        let n = this._colors.length;
        let eachLength = this.allMass / n;
        let massBounding = [];
        for(let i = 0; i< n; i++){
            massBounding.push(this.allMass-(i+1)*eachLength);
        }
        this.massBounding = massBounding;
    }

    _lerp(n){
        const startCor = this.endColor;
        const endCor = this.startColor;

        let colors = [];
        for(let i = 0; i< n; i++){
            const fcc = Cesium.Color.lerp(startCor, endCor, i/(n-1), new Cesium.Color())
            colors.push(fcc);
        }
        this._colors = colors;
    }
    
    randomColor2(){
        this.randomColor();
        this._lerp(color100[this._r].length);
    }
    

    /**
     * 改变调色板
     */
     randomColor(){
        let r = Math.floor(Math.random() * 100)
        this._r = r
        this._startCor = Cesium.Color.fromCssColorString(color100[r][0])
        this._endCor = Cesium.Color.fromCssColorString(color100[r][4])
    }

    _computer(){
       
        let radio = this._computerRadioByDis()
        // let radio = this._currentVal / this._totalVal
        let sc = Cesium.Cartesian4.fromColor(this._startCor, new Cesium.Cartesian4()) 
        let ec = Cesium.Cartesian4.fromColor(this._endCor, new Cesium.Cartesian4()) 
        let fc = Cesium.Cartesian4.lerp(sc, ec, radio, new Cesium.Cartesian4())
        let fcc = Cesium.Color.fromCartesian4(fc, new Cesium.Color())
        return fcc
    }



    /**
     * 根据与污染源的坐标距离计算颜色插值
     * @returns 颜色插值点
     */
    _computerRadioByDis(){
        let xVal = Math.abs( this._currentVal[0] - this._totalVal[0])
        let yVal = Math.abs( this._currentVal[1] - this._totalVal[1])
        let xRadio = 1 - xVal / this._totalVal[0]
        let yRadio = 1 - yVal / this._totalVal[1]
        let radio = 0
        if (xRadio < yRadio) {
            radio = xRadio
        }else{
            radio = yRadio
        }   
        return radio
    }

    getColor(){
        return this._computer()
    }

    setAndGetColor(cv, tv){
        this._currentVal = cv
        this._totalVal = tv
        return this._computer()
    }


    /**
     * 根据浓度梯度插值出每个元胞的颜色
     * @param {被污染的元胞对象数组} spreadCells 
     */
    setColorToCell(spreadCells){
        Array.isArray(spreadCells)?true:spreadCells =[spreadCells];
        let sc = Cesium.Cartesian4.fromColor(this._startCor, new Cesium.Cartesian4()) 
        let ec = Cesium.Cartesian4.fromColor(this._endCor, new Cesium.Cartesian4()) 
        for (let i = 0; i < spreadCells.length; i++) {
            let radio = 1-(i +1 ) / spreadCells.length; 
            let fc = Cesium.Cartesian4.lerp(sc, ec, radio, new Cesium.Cartesian4())
            let fcc = Cesium.Color.fromCartesian4(fc, new Cesium.Color())
            spreadCells[i].color = fcc;
        }
    }


     /**
     * 耦合扩散
     * @param {被污染的元胞对象数组} spreadCells 
     */
    setColorToCellCoupling(surfaceCells, vadoseCells, gdwaterCells){
        const arr = [...surfaceCells, ... vadoseCells, ...gdwaterCells];
        arr.sort((a,b) => b.cellMass - a.cellMass);
        let sc = Cesium.Cartesian4.fromColor(this._startCor, new Cesium.Cartesian4()) 
        let ec = Cesium.Cartesian4.fromColor(this._endCor, new Cesium.Cartesian4()) 
        for (let i = 0; i < arr.length; i++) {
            let radio = 1- i  / (arr.length-1); 
            let fc = Cesium.Cartesian4.lerp(sc, ec, radio, new Cesium.Cartesian4())
            let fcc = Cesium.Color.fromCartesian4(fc, new Cesium.Color())
            arr[i].color = fcc;
        }
        return arr;
    }

    /**
     * 根据污染物质量划分成不同颜色
     * @param {被污染的元胞对象数组} spreadCells 
     */
    setColorToCellWhatever(spreadCells){
        this._init();
        const colors = this._colors;
        const massBounding = this.massBounding;
        for (let i = 0; i < spreadCells.length; i++) {
            for(let j = 0; j < massBounding.length; j++){
                // debugger;
                if(spreadCells[i].cellMass > massBounding[j]){
                    spreadCells[i].color = colors[j];
                    break;
                }
            }
        }
    }
}

export default ComputerColor