import rollup from 'rollup';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import chokidar from 'chokidar';
import inputOptions from './inputOptions';
import Entry from './Entry';
import AppEntry from './AppEntry';
import JSEntry from './JSEntry';
import StyleEntry from './StyleEntry';
import * as spinner from '../../shared/spinner';
import Module from './Module';
import resolve from 'resolve';

const resolveAsynchronously = (id: string, opts: object): Promise<string> =>
  new Promise((r, reject) => {
    resolve(id, opts, (err, res) => {
      if (err) reject(err);
      r(res);
    });
  });

export default class {
  private files: Map<string, Entry | JSEntry | Module>;
  private cwd: string;
  private srcDir: string;
  private destDir: string;
  private watcher: chokidar.FSWatcher;
  constructor({
    cwd = process.cwd(),
    srcDir = 'src',
    destDir = 'dist'
  }: {
    cwd?: string;
    srcDir?: string;
    destDir?: string;
  }) {
    this.cwd = cwd;
    this.srcDir = srcDir;
    this.destDir = destDir;
    this.files = new Map();
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
    spinner.succeed(
      chalk`Starting incremental compilation at {cyan ${this.srcDir}}`
    );
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
    spinner.stop('Bye!');
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
      code: module.code,
      originalCode: module.originalCode,
      cwd: this.cwd,
      srcDir: this.srcDir,
      destDir: this.destDir
    }));
    modules.push({
      originalCode: '',
      code: '',
      sourcePath: await resolveAsynchronously('anujs/dist/ReactWX.js', {
        basedir: this.cwd
      }),
      cwd: this.cwd,
      srcDir: this.srcDir,
      destDir: this.destDir
    });
    this.files = new Map();
    modules.forEach(this.createModule, this);
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
    const processes: Array<Promise<void>> = [];
    this.files.forEach(file => processes.push(file.process()));
    await Promise.all(processes);
  }
}
