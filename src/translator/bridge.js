const { EventEmitter } = require('events');

const template = new EventEmitter();
template.setMaxListeners(0);

module.exports = {
  template
};
