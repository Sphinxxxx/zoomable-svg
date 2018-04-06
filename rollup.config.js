//https://github.com/rollup/rollup-plugin-node-resolve#rollup-plugin-node-resolve
//  - npm i -D rollup-plugin-node-resolve
import resolve from 'rollup-plugin-node-resolve';

//https://rollupjs.org/#babel
//  - npm i -D babel-core
//  - npm i -D rollup-plugin-babel
//  - npm i -D babel-preset-env babel-plugin-external-helpers
import babel from 'rollup-plugin-babel';

//https://github.com/TrySound/rollup-plugin-uglify
//  - npm i -D rollup-plugin-uglify
import uglify from 'rollup-plugin-uglify';

import * as pkg from './package.json';


const banner = `/*!
    ${pkg.name}  v${pkg.version} (${ (new Date()).toISOString().split('T')[0] })

    ${pkg.description}
    ${pkg.homepage}

    Copyright (c) 2018 ${pkg.author}
    Licensed under the ${pkg.license} license.
*/`;

export default {
    input: 'src/zoomable-svg.js',

    output: {
        name: 'zoomableSvg',
        file: 'dist/zoomable-svg.min.js',
        format: 'umd',
        banner: banner,
    },

    plugins: [
        resolve({
            module: true,
        }),
        
        babel({
            //Must transpile dragTracker module..
            //  exclude: 'node_modules/**', // only transpile our source code
        }),
        
        uglify({
            output: {
                //Preserve banner: https://github.com/mishoo/UglifyJS2#keeping-copyright-notices-or-other-comments
                comments: /^!/,
            },
        }),
    ],

};