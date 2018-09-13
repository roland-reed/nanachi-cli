const { EventEmitter } = require('events');

const wxml = new EventEmitter();
wxml.setMaxListeners(0);

module.exports = {
  wxml
};
