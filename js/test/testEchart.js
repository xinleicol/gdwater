import XLEchart from '../utils/XLEchart.js'




let xlEchart = new XLEchart(document.getElementById('echart'))
xlEchart.generate()


$('button').click(function () {
    let pos  = gridToEchartPosition([0,0,0])
    xlEchart.setDataAndUpdate(pos)
})


function gridToEchartPosition(position){
    let z = -position[2]+9
    return [position[0]+0.5,position[1]+0.5,z+0.5]
}
