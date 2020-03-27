import postcss from 'rollup-plugin-postcss';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

const babelConfig = require('./.babelrc.js');

module.exports = {
    input: 'src/app.js',
    output: {
      file: 'dist/app.js',
      format: 'iife',
      globals: {
      	'prop-types' : 'PropTypes'
      }
    },
    plugins: [
        postcss({
        	plugins: [],
        	extract: true,
        	use: ['less']
        }),
        babel(babelConfig),
        json({
        	exclude: 'node_modules/**'
        })
    ],
    external: ['prop-types']
}
