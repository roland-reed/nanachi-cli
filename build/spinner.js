const spinner = require('ora')();

module.exports = {
  start: function(message) {
    spinner.start(message);
  },
  stop: function(message) {
    if (message) this.log(message);
    spinner.stop();
  },
  log: function log(message) {
    spinner.stop();
    // eslint-disable-next-line
    console.log(message);
    spinner.start();
  },
  changeText: function(text) {
    spinner.text = text;
  }
};
