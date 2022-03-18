

const ImageryProvider = {

    getImageryProviderArr: function () {
        return [
            new Cesium.ProviderViewModel({
                //图层的名称。
                name: '天地图影像',
                //显示项目被隐藏的工具提示
                tooltip: '天地图影像底图',
                //代表图层的图标
                iconUrl: '../../image/td-icon.jpg',
                //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中。
                creationFunction: function () {
                    return new Cesium.UrlTemplateImageryProvider({
                        url: "https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=4d59f4ef142725ef8c409801fc86be8b",
                        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                        tilingScheme: new Cesium.WebMercatorTilingScheme(),
                        maximumLevel: 18,
                    });
                    
                }
            }),
            new Cesium.ProviderViewModel({
                name: '天地图矢量',
                tooltip: '天地图矢量底图',
                iconUrl: '../../image/td-vec-icon.png',
                creationFunction: function () {
                    return new Cesium.UrlTemplateImageryProvider({
                        url: "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=4d59f4ef142725ef8c409801fc86be8b",
                        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                        tilingScheme: new Cesium.WebMercatorTilingScheme(),
                        maximumLevel: 18,
                    });
                    
                }
            }),
            new Cesium.ProviderViewModel({
                //图层的名称。
                name: 'ArcGIS地图',
                //显示项目被隐藏的工具提示
                tooltip: 'ArcGIS地图',
                //代表图层的图标
                iconUrl: '../../image/ac-icon.jpg',
                //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中。
                creationFunction: function () {
                    var options = {
                        style: 'img', // style: img、elec、cva
                        crs: 'WGS84' // 使用84坐标系，默认为：GCJ02
                    }
                    return new Cesium.AmapImageryProvider(options);

                }
            }),
            new Cesium.ProviderViewModel({
                //图层的名称
                name: 'OSM',
                //显示项目被隐藏的工具提示
                tooltip: '开放街道地图',
                //代表图层的图标
                iconUrl: '../../image/osm-icon.png',
                //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中
                creationFunction: function () {
                    return new Cesium.OpenStreetMapImageryProvider({
                        url: 'https://a.tile.openstreetmap.org/'
                    });
                }
            })
        ]
    }
}

export default ImageryProvider