const help = require('./help');
const { init, build, start } = require('../lib');

function cli(argv) {
  const { _, minify, h, help: _help, 'force-update-library': forceUpdateLibrary } = argv;

  switch (true) {
    case h || _help || _[0] === 'help':
      help();
      break;

    case _[0] === 'init':
      init();
      break;

    case _[0] === 'start':
      start({
        forceUpdateLibrary
      });
      break;

    case _[0] === 'build':
      build({
        minify,
        forceUpdateLibrary
      });
      break;

    default:
      help();
      break;
  }
}

module.exports = cli;
