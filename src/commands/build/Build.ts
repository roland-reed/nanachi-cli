import LogService from '@services/Log';
import customizedReactFileNames from '@shared/customizedReactFileNames';
import targetExtensions from '@shared/targetExtensions';
import axios from 'axios';
import chalk from 'chalk';
import chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as path from 'path';
import rollup from 'rollup';
import AppEntry from './AppEntry';
import Entry, { InterfaceEntryOptions } from './Entry';
import inputOptions from './inputOptions';
import JSEntry from './JSEntry';
import Module from './Module';
import StyleEntry from './StyleEntry';
import { getAnuPath } from './utils';
const alias = require('rollup-plugin-alias');
// treat as external dependency
const { template } = require('../src/translator/bridge');

interface InterfaceFragment {
  id: string;
  content: string;
}

type BuildTarget = 'wx' | 'baidu' | 'ali';

interface InterfaceBuild {
  cwd?: string;
  minify?: boolean;
  srcDir?: string;
  target?: BuildTarget;
  destDir?: string;
  assetsDir?: string;
  silent?: boolean;
  forceUpdateLibrary?: boolean;
}
export default class Build {
  // 静默编译
  public readonly silent: boolean;
  // 编译目标
  public readonly target: string;
  // 是否压缩
  public readonly minify: boolean;
  private files: Map<string, Entry | JSEntry | Module>;
  private cwd: string;
  private srcDir: string;
  private destDir: string;
  private assetsDir: string;
  private watcher: chokidar.FSWatcher;
  // 是否强制拉取最新定制版 React
  private forceUpdateLibrary: boolean;
  private nodeModulesFiles: string[];
  private logService: LogService;
  private fragments: {
    [property: string]: string;
  };
  constructor({
    cwd = process.cwd(),
    minify = false,
    target = 'wx',
    srcDir = 'src',
    destDir = 'dist',
    assetsDir = 'assets',
    forceUpdateLibrary = false,
    silent = false
  }: InterfaceBuild) {
    this.cwd = cwd;
    this.minify = minify;
    this.srcDir = srcDir;
    this.target = target;
    this.destDir = destDir;
    this.assetsDir = assetsDir;
    this.silent = silent;
    this.forceUpdateLibrary = forceUpdateLibrary;
    this.files = new Map();
    this.nodeModulesFiles = [];
    this.fragments = {};
    this.logService = new LogService({ silent });
  }
  public get spinner() {
    return this.logService;
  }
  public async build() {
    this.beforeStart();
    if (!getAnuPath(this.target) || this.forceUpdateLibrary) {
      await this.fetchLatestReact();
    }
    this.listeningFragments();
    await this.collectDependencies();
    await this.process();
    this.spinner.stop();
  }
  public async start() {
    await this.build();
    this.watch();
    this.spinner.succeed(
      chalk`Starting incremental compilation at {cyan ${this.srcDir}}\n`
    );
  }
  private async copyStatics() {
    const sourceDir = path.resolve(this.cwd, this.srcDir, this.assetsDir);
    const destinationDir = path.resolve(this.cwd, this.destDir, this.assetsDir);
    const relativeSourceDir = path.relative(this.cwd, sourceDir);
    const relativeDestinationDir = path.relative(this.cwd, destinationDir);
    await fs.copy(sourceDir, destinationDir);
    this.spinner.succeed(
      chalk`Copied files from {cyan ${relativeSourceDir}} to {cyan ${relativeDestinationDir}}\n`
    );
  }
  private listeningFragments() {
    template.on('fragment', (fragment: InterfaceFragment) => {
      const { id, content } = fragment;
      if (!this.fragments[id]) {
        this.fragments[id] = content;
      }
    });
  }
  private async writeFragments() {
    const destDir = path.join(
      this.cwd,
      this.destDir,
      'components',
      'Fragments'
    );
    await Object.keys(this.fragments).map(async id => {
      const filePath =
        destDir + '/' + id + targetExtensions[this.target].template;
      await fs.ensureFile(filePath);
      await this.writeFile(filePath, this.fragments[id]);
    });
  }
  private async writeFile(filePath: string, content: string) {
    try {
      await fs.writeFile(filePath, content);
    } catch (error) {
      // tslint:disable-next-line
      console.log(error);
    }
  }
  private watch() {
    this.watcher = chokidar.watch(path.resolve(this.cwd, this.srcDir));
    const eventHandler: {
      [property: string]: (filePath: string) => Promise<void>;
    } = {
      add: this.watchAdd,
      change: this.watchChange,
      unlink: this.watchUnlink
    };
    const createEventHandler = (type: string) => {
      this.watcher.on(type, (relatedPath: string) => {
        eventHandler[type].call(this, relatedPath).catch((error: Error) => {
          // tslint:disable-next-line
          console.log(error);
        });
      });
    };
    createEventHandler('add');
    createEventHandler('change');
    createEventHandler('unlink');
    process.on('SIGINT', () => this.beforeExitLog());
    process.on('uncaughtException', () => process.exit(1));
    process.on('unhandledRejection', () => process.exit(1));
  }
  private async fetchLatestReact() {
    this.spinner.start(
      chalk`fetching latest customized {cyan React} library from GitHub`
    );

    const libraryName = customizedReactFileNames[this.target].primary;
    const libraryRemoteUri = `https://raw.githubusercontent.com/RubyLouvre/anu/master/dist/${libraryName}`;

    try {
      const lib = await axios.get(libraryRemoteUri);
      const filePath = path.resolve(
        this.cwd,
        `node_modules/anujs/dist/${
          customizedReactFileNames[this.target].primary
        }`
      );

      await fs.ensureFile(filePath);
      await fs.writeFile(filePath, lib.data, {
        encoding: 'utf8'
      });
      this.spinner.succeed(
        chalk`latest customized {cyan React} library fetched from GitHub`
      );
    } catch (error) {
      this.spinner.stop(
        chalk`Cannot retrieve latest customized {cyan React} library` +
          chalk` from {cyan ${libraryRemoteUri}}, make sure you can access GitHub`
      );
      process.exit(1);
    }
  }
  private async watchChange(changedPath: string) {
    const file = this.files.get(changedPath);
    if (file) {
      await file.process();
    }
  }
  private async watchUnlink(unlinkedPath: string) {
    const file = this.files.get(unlinkedPath);
    if (file) {
      await file.unlink();
      this.files.delete(unlinkedPath);
    }
  }
  private async watchAdd(addedPath: string) {
    if (this.files.has(addedPath)) return;
    if (path.parse(addedPath).ext !== '.js') return;
    this.createModule({
      sourcePath: addedPath,
      cwd: this.cwd,
      code: '',
      originalCode: await fs.readFile(addedPath, 'utf8'),
      srcDir: this.srcDir,
      destDir: this.destDir,
      silent: this.silent,
      build: this,
      target: this.target
    });
    this.watcher.add(addedPath);
    const file = this.files.get(addedPath);
    if (file) {
      await this.files.get(addedPath).process();
    }
  }
  private beforeStart() {
    this.spinner.info(
      chalk`{bold.underline nanachi@${require('../package.json').version}}`
    );
  }
  private beforeExitLog() {
    this.spinner.stop(chalk`{green.bold \nBye!}`);
    process.exit(0);
  }
  private createModule(module: InterfaceEntryOptions, index?: number) {
    const ext = path.parse(module.sourcePath).ext;
    switch (true) {
      case index === 0:
        this.files.set(module.sourcePath, new AppEntry(module));
        break;
      case /node_modules/.test(module.sourcePath):
        this.nodeModulesFiles.push(module.sourcePath);
        this.files.set(
          module.sourcePath,
          new Module({
            cwd: module.cwd,
            sourcePath: module.sourcePath,
            destinationDirName: 'npm',
            destDir: this.destDir,
            target: this.target
          })
        );
        break;
      case ext === '.js':
        this.files.set(module.sourcePath, new JSEntry(module));
        break;
      case ext === '.sass':
      case ext === '.scss':
      case ext === '.less':
        this.files.set(module.sourcePath, new StyleEntry(module));
        break;

      default:
        break;
    }
  }
  private async collectDependencies() {
    this.spinner.start('collecting dependencies...');
    // 如果本地没有定制版 React 的话，alias 中的 @react 和 react 将会是空字符
    // 因此在获取到定制版 React 之后再解析
    inputOptions.plugins.push(
      alias({
        '@components': path.resolve(process.cwd(), './src/components'),
        '@react': getAnuPath(this.target),
        react: getAnuPath(this.target)
      })
    );
    const bundle = await rollup.rollup(inputOptions);
    const modules = bundle.modules.map(module => ({
      sourcePath: module.id,
      code: '',
      originalCode: module.originalCode,
      cwd: this.cwd,
      srcDir: this.srcDir,
      destDir: this.destDir,
      silent: this.silent,
      build: this,
      target: this.target
    }));
    modules.push({
      originalCode: '',
      code: '',
      sourcePath: getAnuPath(this.target),
      cwd: this.cwd,
      srcDir: this.srcDir,
      destDir: this.destDir,
      silent: this.silent,
      build: this,
      target: this.target
    });
    this.files = new Map();
    // rollup 在使用了 rollup-plugin-commonjs 插件之后
    // 会存在以 commonjs-proxy: 开头的路径
    // 需要过滤掉
    modules
      .filter(module => path.isAbsolute(module.sourcePath))
      .forEach(this.createModule, this);
    this.spinner.succeed(
      chalk`dependencies collected, {cyan ${this.files.size.toString()}} entries total`
    );
  }
  private async emptyDir() {
    if (await fs.pathExists(this.destDir)) {
      await fs.emptyDir(this.destDir);
    } else {
      await fs.ensureDir(this.destDir);
    }
    this.spinner.succeed(chalk`{cyan ${this.destDir}} has been emptied`);
    this.spinner.start('compiling...');
  }
  private async process() {
    await this.emptyDir();
    await this.copyStatics();
    const processes: Array<Promise<void>> = [];
    this.files.forEach(file => processes.push(file.process()));
    await Promise.all(processes);
    await this.writeFragments();
  }
}
