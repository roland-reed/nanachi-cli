/* eslint no-console:off */
const chalk = require('chalk');
const { version } = require('../package.json');

const message = chalk`
  anu@{bold v${version}}

  anu {green init} 初始化新项目

  anu {green start} 在当前目录启动开发服务器

  anu {green build} 在当前目录构建项目

            {blue [-m --minify]} 启用代码压缩
`;

module.exports = function() {
  console.log(message);
};
