//https://rollupjs.org/#babel
//  - npm i -D babel-core
//  - npm i -D rollup-plugin-babel
//  - npm i -D babel-preset-env babel-plugin-external-helpers
import babel from 'rollup-plugin-babel';

//https://github.com/TrySound/rollup-plugin-uglify
//  - npm i -D rollup-plugin-uglify
import uglify from 'rollup-plugin-uglify';


export default {
    input: 'src/zoomable-svg.js',

    output: {
        name: 'zoomableSvg',
        file: 'dist/zoomable-svg.min.js',
        format: 'umd',
    },

    plugins: [
        babel({
            exclude: 'node_modules/**', // only transpile our source code
        }),
        
        uglify(),
    ],

};