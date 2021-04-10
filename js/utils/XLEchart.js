import xlType from './XLType.js'

class XlEchart{
    chart = undefined
    options = {
        grid3D: {},
        xAxis3D: {},
        yAxis3D: {},
        zAxis3D: {},
        grid3D: {
            axisLine : {
                lineStyle:{
                    color:'#fff'
                }
            },
            axisPointer:{
                lineStyle:{
                    color:'#ffbd67'
                }
            }
        },
        
        visualMap: {
            top: 10,
            calculable: true,
            dimension: 'z',
            max:9,
            text:['Z值'],
            inRange: {
                color: ['#1710c0', '#0b9df0', '#00fea8', '#00ff0d', '#f5f811', '#f09a09', '#fe0300'],
                opacity:[0.2,1.0],
                symbolSize: [8,20]
            },
            textStyle: {
                color: '#fff'
            }
        },
        tooltip: {},
        series: [{
            name:'属性',
            type: 'scatter3D',
            data:[],
            dimensions:['x','y','z','质量'],
            itemStyle: {
                // opacity: 1,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.8)'
            }
        }]
    }
    constructor(dom,maxX,maxY,maxZ){
        this.chart = echarts.init(dom)
        if (maxX ||maxY || maxZ) {
            this.options.zAxis3D.max = maxZ
            this.options.yAxis3D.max = maxY
            this.options.xAxis3D.max = maxX

            this.options.visualMap.max = maxZ
        }
    }

    generate(){
        this.chart.setOption(this.options)
    }

    setDataAndUpdate(position){
        xlType.determineArray(position)
        this.options.series[0].data.push(position)
        this.generate()
    }
}

export default XlEchart