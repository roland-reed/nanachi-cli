import fs from 'fs-extra';
import File from './File';
import path from 'path';
import rollup from 'rollup';
const rollupPluginBabel = require('rollup-plugin-babel');
const rollupPluginCommonJS = require('rollup-plugin-commonjs');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');

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
    const bundle = await rollup.rollup({
      input: this.sourcePath,
      plugins: [
        rollupPluginBabel({
          plugins: [require('@babel/plugin-proposal-class-properties')],
          presets: [
            [
              require('@babel/preset-env'),
              {
                targets: {
                  node: 6
                }
              }
            ]
          ]
        }),
        rollupPluginNodeResolve(),
        rollupPluginCommonJS()
      ]
    });
    const { code } = await bundle.generate({
      format: 'cjs'
    });
    this.code = code;
  }
}
