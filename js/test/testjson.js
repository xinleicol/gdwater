
$.ajax({
    type: "GET",
    url: "http://169.254.222.249:9000/wxl/hhu_dem4/layer.json",
    dataType: "json",
    success: function (response) {
        let boundArrs = response.bounds
    }
});