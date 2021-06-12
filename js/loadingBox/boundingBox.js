import XLBoundingBox from '../utils/computerBox/XLBoundingBox.js'
import XLGdwaterBox from '../utils/computerBox/XLGdwaterBox.js';
import XLSurfaceBox from '../utils/computerBox/XLSurfaceBox.js';
import XLVadoseBox from '../utils/computerBox/XLVadoseBox.js';
import XLInteract from '../utils/XLInteract.js';



// var lon1 = 118.774051666259766;
// var lat1 = 31.909913158302139;
// var lon2 = 118.791561126708984;
// var lat2 = 31.921570015932399;
var lon1 = 118.774051666258;
var lat1 = 31.9099131583018;
var lon2 = 118.791560791431;
var lat2 = 31.9215700159321;
var imageLocation = [lon1, lon2, lat1, lat2];

var surfaceLengthNum = 10; //地表网格长个数
var surfaceWidthNumSurface = 10 ; //地表网格宽个数
var vadoseLengthNum = 10 ; // 土壤网格长个数
var vadoseWidthNum = 10 ; //土壤网格宽个数
var vadoseHeigthNum = 10; //土壤层数
var vadoseDepth = 200 ; //土壤深度 （米）
var gdwaterLengthNum = 10; //潜水面网格长个数
var gdwaterWidthNum = 10 ; //潜水面网格宽个数
var gdwaterHeight = 20;// 潜水面网格高度

var boundingBoxEntity = undefined; //包围盒实体
var initCompleted = false;
var loadingBoxCompleted = false;

var offset = new Cesium.Cartesian3(0, 0, -20); //地表、土壤、潜水面网格模型原点偏移量，不偏移影像就看不见了
var xlSbo = undefined; //地表网格
var xlVob = undefined; //土壤网格
var xlGdb = undefined; //潜水面网格


//获取影像经纬度坐标
function getLocation(){
   
    $.ajax({
        type: "GET",
        url: imgUrl+"/meta.json",
        dataType: "json",
        success: function (response) {
            let boundArrs = response.bounds;
            lon1 = boundArrs.west;
            lon2 = boundArrs.east;
            lat1 = boundArrs.south;
            lat2 = boundArrs.north;            
        },
        error:function(){
            alert("经纬度坐标获取失败...")
        }
    });
}

//初始化
async function init(){
    let xlBbo = new XLBoundingBox(lon1, lat1, lon2 , lat2); //包围盒对象
    await xlBbo.showBoundingBox();
    boundingBoxEntity = xlBbo.entity;

    xlSbo = new XLSurfaceBox(xlBbo.center, xlBbo.dimensions, surfaceLengthNum, surfaceWidthNumSurface);
    xlVob = new XLVadoseBox(xlBbo.center, xlBbo.dimensions, vadoseDepth, vadoseLengthNum, vadoseWidthNum, vadoseHeigthNum);
    xlGdb = new XLGdwaterBox(xlBbo.center, xlBbo.dimensions, vadoseDepth, gdwaterLengthNum, gdwaterWidthNum, gdwaterHeight);
    
    initCompleted = true;
   // xlSbo.generate(offset);
    // xlVob.gennerate(offset);
    // xlGdb.gennerate(offset);

}
// init();

//生成网格
function main(){
  
    xlSbo.generate(offset);
  
    xlVob.gennerate(offset);
 
    xlGdb.gennerate(offset);

    loadingBoxCompleted = true;
}
// main();

//删除所有网格
function removeAllBoxs(){
    xlSbo.remove();
    xlVob.removeByEntity();
    xlGdb.remove();
}

//生成所有网格
function generateAllBoxs(offset){
    xlSbo.generate(offset);
    xlVob.gennerate(offset);
    xlGdb.gennerate(offset);
}

//更新所有网格
function updateAllBoxs(offset){
    removeAllBoxs();
    generateAllBoxs(offset);
}


//监听事件
//初始化
$("#init").click(function (e) { 
    e.preventDefault();
    initCompleted? true: init();
});

//加载网格
$("#loadingBox").click(function (e) { 
    e.preventDefault();
    loadingBoxCompleted ? true: main();
});


//追踪包围盒
$("#trackBox").click(function (e) { 
    if ($(this).prop('checked')) {
        boundingBoxEntity == undefined ? true: viewer.trackedEntity = boundingBoxEntity;
    }else{
        viewer.trackedEntity = undefined;    
    }
});

//深度检测
$("#isDepthTest").click(function (e) { 
    globe.depthTestAgainstTerrain = $(this).prop('checked');
});

//地表参数表单 获取参数
$("#surfaceBox").click(function (e) { 
    if ($(this).prop('checked')) {
        $("#surfaceDiv").show();  
        XLInteract.getPara("#surfaceDiv input", xlSbo);

    }else{
        $("#surfaceDiv").hide();
    }
});

//土壤参数表单 获取参数
$("#vadoseBox").click(function (e) { 
    if ($(this).prop('checked')) {
        $("#vadoseDiv").show();
        XLInteract.getPara("#vadoseDiv input", xlVob);
    }else{
        $("#vadoseDiv").hide();
    }
});

$("#gdwaterBox").click(function (e) { 
    if ($(this).prop('checked')) {
        $("#gdwaterDiv").show();
        XLInteract.getPara("#gdwaterDiv input", xlGdb);
    }else{
        $("#gdwaterDiv").hide();
    }
});

//提交修改地表参数
$("#sufaceCommit").click(function (e) { 
    let isChange = XLInteract.setPara("#surfaceDiv input", xlSbo);
    xlSbo.update(isChange);
    $("#surfaceDiv").hide();
    $('#surfaceBox').prop('checked', false);
});

//提交修改土壤层参数
$("#vadoseCommit").click(function (e) { 
    let isChange = XLInteract.setPara("#vadoseDiv input", xlVob);
    xlVob.update(isChange);
    //土壤深度改变，潜水面的高度也随之改变
    //更新潜水面网格
    let depthChange = XLInteract.valueIsChange("#_depth", xlVob, xlGdb); 
    if (depthChange) {
        xlGdb.update(depthChange);
    }
    $("#vadoseDiv").hide();
    $('#vadoseBox').prop('checked', false);
});

//提交修改潜水面参数
$("#gdwaterCommit").click(function (e) { 
    let isChange = XLInteract.setPara("#gdwaterDiv input", xlGdb);
    xlGdb.update(isChange);
    $("#gdwaterDiv").hide();
    $('#gdwaterBox').prop('checked', false);
});

//获取修改中心偏移量
$("#centerOffset").click(function (e) { 
    if ($(this).prop('checked')) {
        $("#offsetDiv").show();
        XLInteract.getParaCts("#offsetDiv input", offset);
    }else{
        $("#offsetDiv").hide();
    }
});

//提交修改中心偏移量
$("#offsetCommit").click(function (e) {  
    let changeObj = XLInteract.setParaCts("#offsetDiv input", offset);
    if (changeObj.isChange) {
        offset = changeObj.value;
        updateAllBoxs(changeObj.value)
    }
    $("#offsetDiv").hide();
    $('#centerOffset').prop('checked', false);
});

//经纬度读取
$("#location").click(function (e) { 
    if ($(this).prop('checked')) {
        $("#locationDiv").show();  
        $.each($("#locationDiv input"), function (indexInArray, valueOfElement) { 
             $(valueOfElement).val(imageLocation[indexInArray]);
        }); 
    }else{
        $("#locationDiv").hide();
    }
   
});

