const rollupPluginBabel = require('rollup-plugin-babel');
const alias = require('rollup-plugin-alias');
const less = require('rollup-plugin-less');
const sass = require('rollup-plugin-sass');
const resolve = require('resolve');
import * as path from 'path';

export default {
  input: 'src/app.js',
  plugins: [
    rollupPluginBabel({
      plugins: [
        require('@babel/plugin-proposal-class-properties'),
        [
          require('@babel/plugin-transform-react-jsx'),
          {
            pragma: 'h'
          }
        ]
      ],
      presets: [
        [
          require('@babel/preset-env'),
          {
            targets: {
              node: 7
            }
          }
        ]
      ]
    }),
    alias({
      '@components': path.resolve(process.cwd(), './src/components'),
      '@react': resolve.sync('anujs/dist/ReactWX.js', {
        basedir: process.cwd()
      })
    }),
    less(),
    sass()
  ]
};
