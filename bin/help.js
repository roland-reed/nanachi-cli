/* eslint no-console:off */
const chalk = require('chalk');
const { version } = require('../package.json');

const message = chalk`
  {bold.underline nanachi@v${version}}

  {bold nanachi} {cyan.bold init} 初始化新项目

  {bold nanachi} {cyan.bold start} 在当前目录启动开发服务器

  {bold nanachi} {cyan.bold build} 在当前目录构建项目
            {cyan.bold [-m --minify]} 启用代码压缩`;

module.exports = function() {
  console.log(message);
};
