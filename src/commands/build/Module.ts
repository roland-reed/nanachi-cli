import babelCore from 'babel-core';
import fs from 'fs-extra';
import path from 'path';
import modulePlugin from '../../shared/modulePlugin';
import File from './File';

export interface IModule {
  sourcePath: string;
  destDir: string;
  destinationDirName: string;
  cwd: string;
}

export default class Module extends File {
  private cwd: string;
  private code: string;
  private destDir: string;
  private sourceDir: string;
  private sourcePath: string;
  private destinationPath: string;
  private destinationDir: string;
  private destinationDirName: string;
  constructor({ sourcePath, destinationDirName, cwd, destDir }: IModule) {
    super();
    this.cwd = cwd;
    this.destDir = destDir;
    this.sourcePath = sourcePath;
    this.destinationDirName = destinationDirName;
  }
  public getSourcePath() {
    return this.sourcePath;
  }
  public async process() {
    this.setDestinationPath();
    await this.loadCode();
    await this.build();
    await this.write({
      destinationPath: this.destinationPath,
      type: 'write',
      content: this.code
    });
    this.reset();
  }
  public reset() {
    this.code = '';
  }
  public async unlink() {
    if (await fs.pathExists(this.getDestinationPath())) {
      await fs.remove(this.getDestinationPath());
    }
  }
  public getDestinationPath() {
    return this.destinationPath;
  }
  private async loadCode() {
    this.code = await fs.readFile(this.sourcePath, 'utf8');
  }
  private getSourceDir() {
    if (!this.sourceDir) {
      this.sourceDir = path.parse(this.sourcePath).dir;
    }
    return this.sourceDir;
  }
  private getDestinationDir() {
    if (!this.destinationDir) {
      this.destinationDir = path.parse(this.destinationPath).dir;
    }
    return this.destinationDir;
  }
  private setDestinationPath() {
    const relativePathToNodeModules = path.relative(
      path.resolve(this.cwd, 'node_modules'),
      this.sourcePath
    );
    this.destinationDir = path.resolve(this.destDir, this.destinationDirName);
    this.destinationPath = path.resolve(
      this.destinationDir,
      relativePathToNodeModules
    );
  }
  private async build() {
    this.code = babelCore.transform(this.code, {
      babelrc: false,
      plugins: [require('babel-plugin-transform-commonjs-es2015-modules'), modulePlugin]
    }).code;
  }
}
