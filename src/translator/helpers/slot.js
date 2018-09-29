var path = require('path');
const jsx = require('./utils');
const generate = require('babel-generator').default;
const prettifyXml = require('prettify-xml');
const bridge = require('../bridge');
const queue = require('../queue');
/**
 * 用于生成组件标签的innerHTML中对应的Fragment
 * @param {*} children 
 * @param {*} fragmentUid 
 * @param {*} modules 
 * @param {*} wxmlHelper 
 */
module.exports = function slotHelper(
    children,
    fragmentUid,
    modules,
    wxmlHelper
) {
    var template = jsx.createElement(
        'template',
        [jsx.createAttribute('name', fragmentUid)],
        children
    );
    var wxml = wxmlHelper(generate(template).code, modules).replace(/;$/, '');
    if (!modules.fragmentPath) {
        modules.fragmentPath = path.join(process.cwd(), 'dist', 'components', 'Fragments');
    }
    bridge.template.emit('fragment', {
        content: wxml,
        id: fragmentUid
    })
    queue.push({
        type: 'wxml',
        path: path.join(modules.fragmentPath,  fragmentUid),
        code: wxml
    });
};
