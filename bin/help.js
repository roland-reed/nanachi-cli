/* eslint no-console:off */
const chalk = require('chalk');
const { version } = require('../package.json');

const message = chalk`
  {bold.underline nanachi@v${version}}

  {bold nanachi} {green.bold init} 初始化新项目

  {bold nanachi} {green.bold start} 在当前目录启动开发服务器
            {green.bold [-u --force-update-library]} 强制拉取远程最新定制版 {green.bold React.js}
            {green.bold [-t --target]} 编译目标 {green.bold wx | ali | baidu} , 默认为 {green.bold wx}

  {bold nanachi} {green.bold build} 在当前目录构建项目
            {green.bold [-s --silent]} 静默编译
            {green.bold [-t --target]} 编译目标 {green.bold wx | ali | baidu} , 默认为 {green.bold wx}
            {green.bold [-u --force-update-library]} 强制拉取远程最新定制版 {green.bold React.js}`;

module.exports = function() {
  console.log(message);
};
