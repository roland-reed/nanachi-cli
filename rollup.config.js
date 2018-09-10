import rollupPluginBabel from 'rollup-plugin-babel';

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
    'chokidar'
  ],
  plugins: [
    rollupPluginBabel({
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 8
            }
          }
        ]
      ]
    })
  ]
};
