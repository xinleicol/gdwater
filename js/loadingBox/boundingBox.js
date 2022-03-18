import XLBoundingBox from '../utils/computer/XLBoundingBox.js'
import XLGdwaterBox from '../utils/computer/XLGdwaterBox.js';
import XLSurfaceBox from '../utils/computer/XLSurfaceBox.js';
import XLVadoseBox from '../utils/computer/XLVadoseBox.js';
import RectangleClip from '../utils/dispose/RectangleClip.js';
import XLInteract from '../utils/XLInteract.js';



// var lon1 = 118.764051666259766;
// var lat1 = 31.899913158302139;
// var lon2 = 118.801561126708984;
// var lat2 = 31.931570015932399;
let lon1 = 118.774051666258;
let lat1 = 31.9099131583018;
let lon2 = 118.791560791431;
let lat2 = 31.9215700159321;
let imageLocation = [lon1, lon2, lat1, lat2];

let surfaceLengthNum = 10; //地表网格长个数
let surfaceWidthNumSurface = 10 ; //地表网格宽个数
let vadoseLengthNum = 10 ; // 土壤网格长个数
let vadoseWidthNum = 10 ; //土壤网格宽个数
let vadoseHeigthNum = 10; //土壤层数
let vadoseDepth = 200 ; //土壤深度 （米）
let gdwaterLengthNum = 10; //潜水面网格长个数
let gdwaterWidthNum = 10 ; //潜水面网格宽个数
let gdwaterHeight = 20;// 潜水面网格高度

let boundingBoxEntity = undefined; //包围盒实体
let initCompleted = false;
let loadingBoxCompleted = false;

let offset = new Cesium.Cartesian3(0, 0, -20); //地表、土壤、潜水面网格模型原点偏移量，不偏移影像就看不见了
let xlBbo = undefined; //包围盒对象
let xlSbo = undefined; //地表网格
let xlVob = undefined; //土壤网格
let xlGdb = undefined; //潜水面网格

// 边界矩形
let rec = Cesium.Rectangle.fromDegrees(
    lon1,
    lat1,
    lon2,
    lat2
);
//填挖
let recClip = new RectangleClip(viewer, rec)

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
    xlBbo = new XLBoundingBox(lon1, lat1, lon2 , lat2); //包围盒对象
    await xlBbo.showBoundingBox();
    boundingBoxEntity = xlBbo.entity;

    xlSbo = new XLSurfaceBox(xlBbo.center, xlBbo.dimensions, surfaceLengthNum, surfaceWidthNumSurface);
    xlVob = new XLVadoseBox(xlBbo.center, xlBbo.dimensions, vadoseDepth, vadoseLengthNum, vadoseWidthNum, vadoseHeigthNum);
    xlGdb = new XLGdwaterBox(xlBbo.center, xlBbo.dimensions, vadoseDepth, gdwaterLengthNum, gdwaterWidthNum, gdwaterHeight);
    
    initCompleted = true;

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
    xlSbo.removeByEntity();
    xlVob.removeByEntity();
    xlGdb.removeByEntity();
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

//去除边框
function showBoxOutline(flag){
    xlSbo.showBoxOutline(flag);
    xlVob.showBoxOutline(flag);
    xlGdb.showBoxOutline(flag);
}
//是否填充
function isFilled(flag){
    xlSbo.isFilled(flag);
    xlVob.isFilled(flag);
    xlGdb.isFilled(flag);
}
//更改透明度
function changeBoxAlpha(value){
    xlSbo.changeBoxAlpha(value);
    xlVob.changeBoxAlpha(value);
    xlGdb.changeBoxAlpha(value);
}
//根据页面值更改
function beforeChangeBoxValue(filled, alpha, color,outline, outlineColor, isID, isChange){
    xlSbo.changeBoxValue(filled, alpha, color,outline, outlineColor, isID,isChange);
    xlVob.changeBoxValue(filled, alpha, color,outline, outlineColor, isID, isChange);
    xlGdb.changeBoxValue(filled, alpha, color,outline, outlineColor, undefined, isChange); //不需要id属性
}

// 入口函数
$(document).ready(function () {
    recClip.isFly = false; //关闭飞行
    recClip.clip();
    init().then(()=>{
        main();    
    });
});

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
        beforeChangeBoxValue($('#fillBox').prop('checked'), $('#model-translucency').val(), undefined, $('#showBoxOutline').prop('checked')
            , undefined, undefined, true);
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

//显示包围盒
$('#isShowBoundingBox').click(function (e) { 
    xlBbo.show($(this).prop('checked'))
});
$('#showBoxOutline').click(function (e) { 
    showBoxOutline($(this).prop('checked'));
});
$('#fillBox').click(function (e) { 
    isFilled($(this).prop('checked'));
});
$('#model-translucency').change(function (e) { 
    if ($('#model-translucency-check').prop('checked')) {
        $('#model-translucency-input').val($(this).val());  
        changeBoxAlpha($(this).val());
    }
});
// 地球透明
$('#global-Translucency-check').click(function (e) { 
    globe.translucency.enabled = $(this).prop('checked');  
    globe.translucency.frontFaceAlpha = 0.5 ;  
});
$('#global-Translucency').change(function (e) { 
    if ($('#global-Translucency-check').prop('checked')) {
        $('#global-Translucency-input').val($(this).val());  
        globe.translucency.frontFaceAlpha = parseFloat ($(this).val());
    }
});
//地球随距离透明
$('#distance-fade').click(function (e) { 
    if (!$('#global-Translucency-check').prop('checked')) {
        $('#global-Translucency-check').prop('checked', true);
        globe.translucency.enabled = true
    }
    globe.translucency.frontFaceAlphaByDistance =
        new Cesium.NearFarScalar(
            300.0,
            0.0,
            2000.0,
            1.0
        )
});
$('#min-distance-fade').change(function (e) { 
   if( $('#distance-fade').prop('checked')){
    globe.translucency.frontFaceAlphaByDistance.near = parseFloat ($(this).val())
   } 
});
// 页面加减号变化
$(".xl-icon-ion a").each((index, element) => {
    $(element).click(function (e) {
        let iNode = $(element).children("i")
        if (iNode.hasClass("ion-plus")) {
            iNode.addClass("ion-minus").removeClass("ion-plus")
            $(element).css("color","#ed7059")
        } else {
            iNode.addClass("ion-plus").removeClass("ion-minus")
            $(element).css("color","")
        }
    });
})
// 开挖
$('#outsideClip').click(function (e) {
    if (recClip.planes) {
        if (recClip.clipDirection != 'outside') {
            recClip.clipDirection = 'outside'
            recClip.enabled($(this).prop('checked'))
            recClip.clip();
        }else{
            recClip.enabled($(this).prop('checked'))
        }
    }else{
        if (recClip.clipDirection != 'outside') {
            recClip.clipDirection = 'outside'
        }
        recClip.clip();
    } 
});
$('#insideClip').click(function (e) {
    if (recClip.planes) {
        if (recClip.clipDirection != 'inside') {
            recClip.clipDirection = 'inside'
            recClip.enabled($(this).prop('checked'))
            recClip.clip();
        }else{
            recClip.enabled($(this).prop('checked'))
        }
    }else{
        if (recClip.clipDirection != 'inside') {
            recClip.clipDirection = 'inside'
        }
        recClip.enabled($(this).prop('checked'))
        recClip.clip();
    } 
});
// 地形夸张
$('#terrain-exaggerate-check').click(function (e) { 
    if($(this).prop('checked')){
        globe.terrainExaggeration = 2.0
    }else{
        globe.terrainExaggeration = 1.0
    }
    $('#terrain-exaggerate-input').val(globe.terrainExaggeration);     
    $('#terrain-exaggerate-range').val(globe.terrainExaggeration);     
});
$('#terrain-exaggerate-range').change(function (e) { 
    if ($('#terrain-exaggerate-check').prop('checked')) {
        $('#terrain-exaggerate-input').val($(this).val());  
        globe.terrainExaggeration = $(this).val()
    }
});

