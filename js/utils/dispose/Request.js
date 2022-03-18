class GoeRequest {
    constructor() {
        this.minDivide = 0.0001354515552520752
    }

    requestWater(longitude, latitude) {
        if($) throw new Error('请使用jquery！')
        let bbox = [longitude - this.minDivide, latitude - this.minDivide, longitude + this.minDivide, latitude + this.minDivide]
        let url = 'http://localhost:8089/geoserver/water/wms?' +
            'request=GetFeatureInfo' +
            '&service=WMS' +
            '&version=1.1.1' +
            '&layers=water%3AIdw_shp91' +
            '&styles=' +
            '&format=image%2Fjpeg' +
            '&query_layers=water%3AIdw_shp91' +
            '&info_format=application%2Fjson' +
            '&exceptions=application%2Fvnd.ogc.se_xml' +
            'FEATURE_COUNT=50' +
            '&X=50' +
            '&Y=50' +
            '&SRS=EPSG%3A404000' +
            '&WIDTH=101' +
            '&HEIGHT=101' +
            '&bbox=' + bbox[0] + ',' + bbox[1] + ',' + bbox[2] + ',' + bbox[3]
        return new Promise(resolve => {
            $.ajax({
                url: url,
                contentType: 'text/json',
                success: function (data) {
                    resolve(data.features[0].properties.GRAY_INDEX)
                },

            });
        })
    }
}

export default GoeRequest