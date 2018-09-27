const help = require('./help');
const { init, build, start } = require('../lib');

function cli(argv) {
  const {
    _,
    minify,
    h,
    help: _help,
    'force-update-library': forceUpdateLibrary,
    silent,
    target
  } = argv;

  switch (true) {
    case h || _help || _[0] === 'help':
      help();
      break;

    case _[0] === 'init':
      init();
      break;

    case _[0] === 'start':
      start({
        forceUpdateLibrary,
        target
      });
      break;

    case _[0] === 'build':
      build({
        minify,
        forceUpdateLibrary,
        silent,
        target
      });
      break;

    default:
      break;
  }
}

module.exports = cli;
