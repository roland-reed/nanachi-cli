const rollupPluginBabel = require('rollup-plugin-babel');
const alias = require('rollup-plugin-alias');
const less = require('rollup-plugin-less');
const sass = require('rollup-plugin-sass');
import * as path from 'path';
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonjs = require('rollup-plugin-commonjs');
import { getAnuPath } from './utils';

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
              node: 6
            }
          }
        ]
      ]
    }),
    alias({
      '@components': path.resolve(process.cwd(), './src/components'),
      '@react': getAnuPath()
    }),
    less(),
    sass(),
    rollupPluginNodeResolve(),
    rollupPluginCommonjs({})
  ]
};
