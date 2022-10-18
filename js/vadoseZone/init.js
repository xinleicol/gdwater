
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import "@/css/vadoseZone.css"
import lsData from '@/dist/Public/lsData.json'

window.Cesium = Cesium;
import $, { data } from 'jquery';  //  引入 Query
window.$ = $;  //  挂载 jQuery

Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZTBhNGQ4MS0wY2M5LTQzYWEtYTMwOS1iMGJiYjNkZmNhZjEiLCJpZCI6MzI1MjYsImlhdCI6MTY2NTg5MTQzN30.kMKEXbemrN_Wywxz5MAl7eZAoaXqiz3STKZ5Ipuep7A';
const bingMap = new Cesium.IonImageryProvider({
    assetId: 2
})
const viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: bingMap,
    terrainProvider: undefined, //Cesium.createWorldTerrain(),
    baseLayerPicker: false,
    shouldAnimate: false,
    animation: false,
    timeline: false,
});
viewer._cesiumWidget._creditContainer.style.display = "none";
window.viewer =viewer;

// init localstorage
function setLocalStorage() {
    let m = 55;
    let radio = 'radio';
    let corner = 'corner';
    let wM = m+'waterMatrix';
    let exaggerateMatrix = 'exaggerateMatrix';
    let waterCornerMatrix = 'waterCornerMatrix';
    let data = lsData;
    localStorage.setItem(m, data.m);
    localStorage.setItem(radio, data.radio);
    localStorage.setItem(corner, data.corner);
    localStorage.setItem(wM, data.wM);
    localStorage.setItem(exaggerateMatrix, data.exaggerateMatrix);
    localStorage.setItem(waterCornerMatrix, data.waterCornerMatrix);
}
setLocalStorage();