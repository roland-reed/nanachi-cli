let syntaxClassProperties = require('babel-plugin-syntax-class-properties');
let babel = require('babel-core');
let visitor = require('./jsTransformImpl');
let helpers = require('./helpers');
/**
 * 必须符合babel-transfrom-xxx的格式，使用declare声明
 */
function miniappPlugin() {
    return {
        inherits: syntaxClassProperties,
        visitor: visitor,
        manipulateOptions(opts) {
            //解析每个文件前执行一次
            var modules = (opts.anu = {
                thisMethods: [],
                staticMethods: [],
                thisProperties: [],
                importComponents: {}, //import xxx form path进来的组件
                usedComponents: {}, //在<wxml/>中使用<import src="path">的组件
                customComponents: [] //定义在page.json中usingComponents对象的自定义组件
            });
            modules.sourcePath = opts.filename;
            modules.current = opts.filename.replace(process.cwd(), '');
            if (/\/components\//.test(opts.filename)) {
                modules.componentType = 'Component';
            } else if (/\/pages\//.test(opts.filename)) {
                modules.componentType = 'Page';
            } else if (/app\.js/.test(opts.filename)) {
                modules.componentType = 'App';
            }
        }
    };
}

function transform(code, opts) {
    var result = babel.transform(code, Object.assign({}, opts, {
        babelrc: false,
        plugins: [
            require('babel-plugin-transform-es2015-template-literals'),
            require('babel-plugin-syntax-jsx'),
            require('babel-plugin-transform-decorators-legacy').default,
            require('babel-plugin-transform-object-rest-spread'),
            require('babel-plugin-transform-async-to-generator'),
            // 'transform-es2015-modules-commonjs',
            miniappPlugin
        ]
    }));
    return result.code;

    // return helpers.moduleToCjs.byCode(result.code).code;
}

// module.exports = transform;
module.exports = {
    transform,
    miniappPlugin
};

// https://github.com/NervJS/taro/tree/master/packages/taro-cli
// https://blog.csdn.net/liangklfang/article/details/54879672
// https://github.com/PepperYan/react-miniapp/blob/master/scripts/transform.js
// https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/README.md
