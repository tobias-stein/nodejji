const path = require('path');
const dotenv = require('dotenv-webpack');

module.exports = function(env, argv) {
    
    return {
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
        plugins: [
            new dotenv({ path: path.resolve(__dirname, `.env.${argv.mode}`) })
        ],
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
    }
};