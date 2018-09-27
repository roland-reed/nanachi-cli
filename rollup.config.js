import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginAlias from 'rollup-plugin-alias';
import * as path from 'path';

export default {
  input: 'es/index.js',
  output: {
    file: 'lib/index.js',
    format: 'cjs'
  },
  external: [
    'child_process',
    'fs-extra',
    'path',
    'validate-npm-package-name',
    'chalk',
    'rollup',
    'babylon',
    'babel-traverse',
    'ora',
    'babel-generator',
    'babel-types',
    'resolve',
    'chokidar',
    'yargs',
    'less',
    'node-sass',
    'babel-core',
    'axios',
    '@shared'
  ],
  plugins: [
    rollupPluginBabel({
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 6
            }
          }
        ]
      ]
    }),
    rollupPluginAlias({
      '@shared': path.join(__dirname, 'es', 'shared'),
      '@services': path.join(__dirname, 'es', 'services')
    })
  ]
};
