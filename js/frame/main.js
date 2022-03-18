//32.24897884,118.74469404
// 加载南京市建筑物
var njCityTiles = new Cesium.Cesium3DTileset({
    url: 'http://localhost:5500/resource/nj_building_tiles/tileset.json',
});
var njCity = scene.primitives.add(njCityTiles);
var heightStyle = new Cesium.Cesium3DTileStyle({
    color: {
        conditions: [
            ["Number(${Floor} )>= 15", "rgba(45, 0, 75, 0.5)"],
            ["Number(${Floor}) >= 11", "rgb(102, 71, 151)"],
            ["Number(${Floor}) >= 7", "rgb(224, 226, 238)"],
            ["Number(${Floor}) >= 3", "rgb(198, 106, 11)"],
            ["true", "rgb(127, 59, 8)"]
        ]
    }
});
njCity.style = heightStyle;

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(118.74469404, 32.24897884, 1500.0)
});