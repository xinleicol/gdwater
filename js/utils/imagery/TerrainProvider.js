

const TerrainProvider = {
    getTerrainProviderViewModelsArr: function () {
        return [
            new Cesium.ProviderViewModel({
                //图层的名称
                name: '无地形',
                //显示项目被隐藏的工具提示
                tooltip: 'WGS84标准球体',
                //代表图层的图标
                iconUrl: '../../image/tq-icon.png',
                //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中
                creationFunction: function () {
                    return new Cesium.EllipsoidTerrainProvider({
                        ellipsoid: Cesium.Ellipsoid.WGS84
                    })
                }
            }),
            new Cesium.ProviderViewModel({
                //图层的名称
                name: 'Cesium全球地形',
                //显示项目被隐藏的工具提示
                tooltip: 'Cesium在线地形',
                //代表图层的图标
                iconUrl: '../../image/cs-icon.jpg',
                //一个函数或命令，用于创建一个或多个提供程序，这些提供程序将在选择此项目时添加到地球仪中
                creationFunction: function () {
                    return Cesium.createWorldTerrain();
                }
            }),
            new Cesium.ProviderViewModel({
                name: '天地图全球地形',
                tooltip: '天地图在线地形',
                iconUrl: '../../image/td-dx-icon.jpg',
                creationFunction: function () {
                    TerrainProvider.getTdTerrainProvider()
                }
            })
        ]
    },


    getTdTerrainProvider: function(){
        var terrainUrls = new Array();
        var subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];
        var tdtUrl = 'https://t{s}.tianditu.gov.cn/';
        var token = '4d59f4ef142725ef8c409801fc86be8b'
        for (var i = 0; i < subdomains.length; i++) {
            var url = tdtUrl.replace('{s}', subdomains[i]) + 'mapservice/swdx?tk=' + token;
            terrainUrls.push(url);
        }
        return new Cesium.GeoTerrainProvider({
            urls: terrainUrls
        });
    }
}

export default TerrainProvider