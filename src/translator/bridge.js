const { EventEmitter } = require('events');

const wxml = new EventEmitter();
wxml.setMaxListeners(100);

module.exports = {
  wxml
};
