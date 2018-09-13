import chalk from 'chalk';
import chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as path from 'path';
import rollup from 'rollup';
import * as spinner from '../../shared/spinner';
import AppEntry from './AppEntry';
import Entry from './Entry';
import inputOptions from './inputOptions';
import JSEntry from './JSEntry';
import Module from './Module';
import StyleEntry from './StyleEntry';
import { getAnuPath } from './utils';
export default class {
  private files: Map<string, Entry | JSEntry | Module>;
  private cwd: string;
  private srcDir: string;
  private destDir: string;
  private assetsDir: string;
  private watcher: chokidar.FSWatcher;
  private nodeModulesFiles: string[];
  constructor({
    cwd = process.cwd(),
    srcDir = 'src',
    destDir = 'dist',
    assetsDir = 'assets'
  }: {
    cwd?: string;
    srcDir?: string;
    destDir?: string;
    assetsDir?: string;
  }) {
    this.cwd = cwd;
    this.srcDir = srcDir;
    this.destDir = destDir;
    this.assetsDir = assetsDir;
    this.files = new Map();
    this.nodeModulesFiles = [];
  }
  public async build() {
    this.beforeStart();
    await this.collectDependencies();
    await this.process();
    spinner.stop();
  }
  public async start() {
    await this.build();
    this.watch();
    spinner.succeed(
      chalk`Starting incremental compilation at {cyan ${this.srcDir}}\n`
    );
  }
  private async copyStatics() {
    const sourceDir = path.resolve(this.cwd, this.srcDir, this.assetsDir);
    const destinationDir = path.resolve(this.cwd, this.destDir, this.assetsDir);
    const relativeSourceDir = path.relative(this.cwd, sourceDir);
    const relativeDestinationDir = path.relative(this.cwd, destinationDir);
    await fs.copy(sourceDir, destinationDir);
    spinner.succeed(
      chalk`Copied files from {cyan ${relativeSourceDir}} to {cyan ${relativeDestinationDir}}\n`
    );
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
    process.on('SIGINT', this.beforeExitLog);
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
      destDir: this.destDir
    });
    this.watcher.add(addedPath);
    const file = this.files.get(addedPath);
    if (file) {
      await this.files.get(addedPath).process();
    }
  }
  private beforeStart() {
    spinner.info(
      chalk`{bold.underline anu@${require('../package.json').version}}`
    );
  }
  private beforeExitLog() {
    spinner.stop(chalk`{green.bold \nBye!}`);
    process.exit(0);
  }
  private createModule(
    module: {
      sourcePath: string;
      cwd: string;
      code: string;
      srcDir: string;
      destDir: string;
      originalCode: string;
    },
    index?: number
  ) {
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
            destDir: this.destDir
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
    spinner.start('collecting dependencies...');
    const bundle = await rollup.rollup(inputOptions);
    const modules = bundle.modules.map(module => ({
      sourcePath: module.id,
      code: '',
      originalCode: module.originalCode,
      cwd: this.cwd,
      srcDir: this.srcDir,
      destDir: this.destDir
    }));
    modules.push({
      originalCode: '',
      code: '',
      sourcePath: getAnuPath(),
      cwd: this.cwd,
      srcDir: this.srcDir,
      destDir: this.destDir
    });
    this.files = new Map();
    // rollup 在使用了 rollup-plugin-commonjs 插件之后
    // 会存在以 commonjs-proxy: 开头的路径
    // 需要过滤掉
    modules
      .filter(module => path.isAbsolute(module.sourcePath))
      .forEach(this.createModule, this);
    spinner.succeed(
      chalk`dependencies collected, {cyan ${this.files.size.toString()}} entries total`
    );
  }
  private async emptyDir() {
    if (await fs.pathExists(this.destDir)) {
      await fs.emptyDir(this.destDir);
    } else {
      await fs.ensureDir(this.destDir);
    }
    spinner.succeed(chalk`{cyan ${this.destDir}} has been emptied`);
    spinner.start('compiling...');
  }
  private async process() {
    await this.emptyDir();
    await this.copyStatics();
    const processes: Array<Promise<void>> = [];
    this.files.forEach(file => processes.push(file.process()));
    await Promise.all(processes);
  }
}
