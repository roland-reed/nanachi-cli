# [nanchi](https://github.com/RubyLouvre/anu/) 脚手架

`nanachi` 是一个可以将 React 代码转译成微信小程序的一个转译器。

## 使用

执行 `npm i -g nanachi` 以全局安装 `nanachi`。

执行 `nanachi init` 初始化一个项目。

在项目根目录执行 `nanachi start` 开发应用程序。

在项目根目录执行 `nanachi build` 编译项目。

## 开发

在项目目录依次执行以下命令：

```sh
npm i
npm link

# or if you use yarn
yarn
yarn link

npm run dev:ts

# open another terminal
npm run dev:js
```

这些命令会在本地启动一个自动 `typescript` 编译器以及一个自动的 `rollup` 编译器，将代码编译至 `lib/index.js` 文件中，在任何目录下执行 `nanachi` 即可使用最新编译的代码。

## Credit

此项目中的转译代码来自 [anujs](https://github.com/RubyLouvre/anu/)。