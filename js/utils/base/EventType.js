const MouseEventType = {
    CLICK: Cesium.ScreenSpaceEventType.LEFT_CLICK,
    MOUSE_MOVE: Cesium.ScreenSpaceEventType.MOUSE_MOVE,
    RIGHT_CLICK: Cesium.ScreenSpaceEventType.RIGHT_CLICK,
};


const SceneEventType = {
    CAMERA_MOVE_END: 'cameraMoveEnd',
    CAMERA_CHANGED: 'cameraChanged',
    PRE_UPDATE: 'preUpdate',
    POST_UPDATE: 'postUpdate',
    PRE_RENDER: 'preRender',
    POST_RENDER: 'postRender',
    MORPH_COMPLETE: 'morphComplete',
    CLOCK_TICK: 'clockTick'
}

const ViewerEventType = {
    ADD_LAYER: 'addLayer',
    REMOVE_LAYER: 'removeLayer',
    ADD_EFFECT: 'addEffect',
    REMOVE_EFFECT: 'removeEffect',
    CLICK: Cesium.ScreenSpaceEventType.LEFT_CLICK,
    RIGHT_CLICK: Cesium.ScreenSpaceEventType.RIGHT_CLICK,
    DB_CLICK: Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    MOUSE_MOVE: Cesium.ScreenSpaceEventType.MOUSE_MOVE,
    WHEEL: Cesium.ScreenSpaceEventType.WHEEL
}


export{
    MouseEventType,
    SceneEventType,
    ViewerEventType
};