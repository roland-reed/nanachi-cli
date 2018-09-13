import fs from 'fs-extra';
import File from './File';
import path from 'path';
import rollup from 'rollup';
import * as t from 'babel-types';
import { getAlias } from './requireAlias';
import { getAnuPath } from './utils';
const alias = require('rollup-plugin-alias');
const rollupPluginBabel = require('rollup-plugin-babel');
const rollupPluginCommonJS = require('rollup-plugin-commonjs');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginNodeGlobals = require('rollup-plugin-node-globals');

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
    const bundle = await rollup.rollup({
      input: this.sourcePath,
      external: id => true,
      plugins: [
        rollupPluginBabel({
          plugins: [
            require('@babel/plugin-proposal-class-properties'),
            () => {
              return {
                visitor: {
                  CallExpression: (astPath: any) => {
                    if (astPath.node.callee.name === 'require') {
                      const id = astPath.node.arguments[0].value;
                      if (!id.startsWith('./')) {
                        const realPath = getAlias(id, this.cwd);
                        const relativePathFromNodeModules = path.relative(
                          path.resolve(this.cwd, 'node_modules'),
                          path.resolve(realPath)
                        );
                        const distPath = path.relative(
                          this.getDestinationPath(),
                          path.resolve(
                            this.getDestinationDir(),
                            relativePathFromNodeModules
                          )
                        );
                        astPath.node.arguments[0].value = distPath;
                      }
                    }
                  },
                  MemberExpression: (astPath: any) => {
                    if (
                      t.isMemberExpression(astPath.node) &&
                      astPath.node.property.name === 'NODE_ENV'
                    ) {
                      if (
                        t.isMemberExpression(astPath.node.object) &&
                        astPath.node.object.property.name === 'env'
                      ) {
                        if (
                          t.isIdentifier(astPath.node.object.object) &&
                          astPath.node.object.object.name === 'process'
                        ) {
                          astPath.replaceWith(t.stringLiteral('production'));
                        }
                      }
                    }
                  }
                }
              };
            }
          ],
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
        rollupPluginCommonJS(),
        alias({
          react: getAnuPath()
        })
      ]
    });

    const { code } = await bundle.generate({
      format: 'cjs',
      exports: 'named'
    });
    this.code = code;
  }
}
