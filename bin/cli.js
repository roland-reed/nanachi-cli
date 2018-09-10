const chalk = require('chalk');
const help = require('./help');
const { init, build, start } = require('../lib');

function cli(argv) {
  const { _, minify, h, help: _help } = argv;

  switch (true) {
    case h || _help || _[0] === 'help':
      help();
      break;

    case _[0] === 'init':
      init();
      break;

    case _[0] === 'start':
      start();
      break;

    case _[0] === 'build':
      build({
        minify
      });
      break;

    default:
      // eslint-disable-next-line
      console.log(
        chalk`{red Error:} Arguments not recognized, see the help information below.`
      );
      help();
      break;
  }
}

module.exports = cli;
