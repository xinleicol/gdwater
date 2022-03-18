//请求获取地下水位矩阵

import XLBox from "../XLBox.js"


class GdwaterLevelMatrix {

    constructor(cellDao, recDao, floatHeight = 10) {
        this._cd = cellDao
        this._rd = recDao
        this._m = this._initMatrix()
        this._xlbox = new XLBox()
        this._promises = []
        this._minDivide = 0.0001354515552520752
        this._floatHeight = floatHeight //水位的偏移值，默认向下偏移10米
        this._midValue = undefined //水位数组的中间值
    }

    _initMatrix() {
        let x = this._cd.xNumber - this._cd.ex
        let y = this._cd.yNumber - this._cd.ey
        if (x < 0 | y < 0) {
            return
        }
        let arr1 = new Array(x)
        for (let i = 0; i < x; i++) {
            arr1[i] = new Array(y)
        }
        return arr1
    }

    /**
     * 求二维数组的最大值最小值
     * @param 二维数组{} matrix
     * ，fun max || min 
     * @returns 最大小值
     */
    maxmin(matrix, fun = 'max') {
        let arr = matrix.map(element => {
            return Math[fun].apply(null, element)
        })
        let res = Math[fun].apply(null, arr)
        return res;
    }

    _extractArr(matrix) {
        let res = []
        matrix.map(element => {
            element.map(element2 => {
                res.push(element2[2])
            })
        })
        return res;
    }

    /**
     * 地下水位夸大
     * @param {角点地下水位值} matrix 
     * @param {放大因子} radio 
     * @returns 处理后的值
     */
    exaggerateWater(matrix, radio = 2) {
        if (!this._midValue) {
            let res = this._extractArr(matrix)
            let maxValue = Math.max(...res)
            let minValue = Math.min(...res)
            let midValue = (maxValue + minValue) / 2
            this._midValue = midValue
        }

        let res = matrix.map(element => {
            let arr1 = element.map(element2 => {
                let res = this._midValue + (element2[2] - this._midValue) * radio
                element2.splice(2, 1, res)
                return element2
            })
            return arr1
        })
        return res;
    }

    /**
     * 获取矩形角点矩阵
     * @returns 矩阵
     */
    getMatrixCorners() {
        return new Promise(resolve => {
            this._getValueCorners()
            Promise.all(this._promises).then((arrs) => {
                for (let i = 0; i < arrs.length; i++) {
                    let p = arrs[i][1]
                    let lon = arrs[i][2]
                    let lat = arrs[i][3]
                    this._m[p[0]][p[1]] = [lon, lat, arrs[i][0] - this._floatHeight]
                }
                resolve(this._m)
            })
        })
    }


    //赋值，角点
    _getValueCorners(resolve) {
        let n = 0
        for (let i = 0; i < this._m.length; i++) {
            let element = this._m[i]
            for (let j = 0; j < element.length; j++) {
                if (j === element.length - 1) {

                }
                let rectangle = this._rd[n].rectangle
                let west = rectangle.west
                let south = rectangle.south
                let [westLon, soutLat] = this._xlbox.radiansToDegree(west, south)
                this._promises.push(this._request(westLon, soutLat, [i, j]))
                n++
            }

        }
    }



    getMatrix() {
        return new Promise(resolve => {
            this._getValue()
            Promise.all(this._promises).then((arrs) => {
                for (let i = 0; i < arrs.length; i++) {
                    let p = arrs[i][1]
                    this._m[p[0]][p[1]] = arrs[i][0] - this._floatHeight
                }
                resolve(this._m)
            }, reason => {
                console.log(reason)
            })
        })
    }

    //赋值
    _getValue(resolve) {
        let n = 0
        for (let i = 0; i < this._m.length; i++) {
            let element = this._m[i]
            for (let j = 0; j < element.length; j++) {
                let carto = this._rd[n].centerCarto
                let degrees = this._xlbox.radiansToDegree(carto.longitude, carto.latitude)
                this._promises.push(this._request(degrees[0], degrees[1], [i, j]))
                n++
            }

        }
    }


    //发送请求
    _request(lon, lat, position) {
        let bbox = [lon - this._minDivide, lat - this._minDivide,
            lon + this._minDivide, lat + this._minDivide
        ]
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
                    let res = data.features[0] ? data.features[0].properties.GRAY_INDEX : 11
                    resolve([res, position, lon, lat])
                },
                error:function (error) {
                    // 数据量大会出错，未知，这里直接让返回结果为11
                    resolve([11, position, lon, lat])
                }

            });
        })
    }


}

export default GdwaterLevelMatrix