import yargs from 'yargs';
import build from '../commands/build/index';
import help from '../commands/help/index';
import init from '../commands/init/index';
import start from '../commands/start/index';

function cli() {
  const { _, m, h, s, u, t } = yargs
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

  switch (true) {
    case h || _[0] === 'help':
      help();
      break;

    case _[0] === 'init':
      init();
      break;

    case _[0] === 'start':
      start({
        forceUpdateLibrary: u,
        target: t
      });
      break;

    case _[0] === 'build':
      build({
        minify: m,
        forceUpdateLibrary: u,
        silent: s,
        target: t
      });
      break;

    default:
      help();
      break;
  }
}

export default cli;
