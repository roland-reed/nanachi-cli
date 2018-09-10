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
  .help(false).argv;

cli(argv);
