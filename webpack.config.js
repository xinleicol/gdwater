const path = require('path');
const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './js/vadoseZone/entry.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean:true,
    },
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './')
        },
        fallback: {
            "https": false,
            "zlib": false,
            "http": false,
            "url": false,
        },
        mainFiles: ['index', 'Cesium']
    },
    module: {
        
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.(png|gif|jpg|jpeg|svg|xml)$/,
            use: ['url-loader']
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './html/vadoseZone/test.html'
        }),
        // Copy Cesium Assets, Widgets, and Workers to a static directory
        new CopyWebpackPlugin({
            patterns: [
                { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' },
                { from: path.join(cesiumSource, 'Assets'), to: 'Assets' },
                { from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }
            ]
        }),
        new webpack.DefinePlugin({
            // Define relative base path in cesium for loading assets
            CESIUM_BASE_URL: JSON.stringify('')
        })
    ],
};