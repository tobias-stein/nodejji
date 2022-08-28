const path = require('path');

module.exports = {
    entry: 
    {
        'nodejji': './src/index.ts',
        'nodejji.min': './src/index.ts'
    },
    output: 
    {
        path: path.resolve(__dirname, 'umd'),
        filename: '[name].js',
        library: 'nodejji',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    resolve: 
    {
        extensions: ['.ts', '.tsx', '.js'],
        mainFields: ['module', 'browser', 'main'],
        alias: {
            '@': path.resolve(__dirname, 'src/')
        }
    },
    devtool: 'source-map',
    plugins: [],
    module: 
    {
        rules: 
        [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]  
    }
};