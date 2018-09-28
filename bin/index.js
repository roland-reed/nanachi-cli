#!/usr/bin/env node

const yargs = require('yargs');
const cli = require('./cli');

const argv = yargs
  .option('minify', {
    desc: '代码压缩',
    alias: 'm',
    default: false,
    boolean: true
  })
  .option('help', {
    desc: '显示帮助',
    alias: 'h',
    boolean: true
  })
  .option('force-update-library', {
    desc: '重新拉取定制版 React',
    boolean: true,
    default: false,
    alias: 'u'
  })
  .option('silent', {
    desc: '是否静默编译',
    boolean: true,
    default: false,
    alias: 's'
  })
  .option('target', {
    desc: '编译目标',
    boolean: false,
    alias: 't',
    default: 'wx'
  })
  .help(false).argv;

cli(argv);

module.exports = {
  target: argv.target
}