const rollup = require('rollup');
const rollupPluginBabel = require('rollup-plugin-babel');
const spinner = require('./spinner');

const inputOptions = {
  input: 'es/index.js',
  plugins: [rollupPluginBabel()]
};

const outputOptions = {
  file: 'lib/index.js',
  format: 'esm'
};

const EVENT_HANDLER = {
  START: () => spinner.start('Starting...'),
  BUNDLE_START: () => spinner.changeText('Bundle started'),
  BUNDLE_END: () => spinner.changeText('Bundle ended'),
  END: () => {
    spinner.stop('Waiting for changes...');
  },
  ERROR: e => spinner.log(e),
  FATAL: e => spinner.log(e)
};

class DevService {
  watch() {
    this.watcher = rollup.watch({
      ...inputOptions,
      output: outputOptions
    });
    this.watcher.on('event', this.dispatchEvent);
  }

  close() {
    this.watcher.close();
  }

  dispatchEvent(event) {
    EVENT_HANDLER[event.code](event);
  }
}

new DevService().watch();
