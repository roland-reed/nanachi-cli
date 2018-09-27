import { resolvePackage } from '@shared/resolvePackage';
import babelCore from 'babel-core';
import * as t from 'babel-types';
import fs from 'fs-extra';
import * as path from 'path';
import File from './File';

export interface IModule {
  sourcePath: string;
  destDir: string;
  destinationDirName?: string;
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
  constructor({
    sourcePath,
    destinationDirName = 'npm',
    cwd,
    destDir
  }: IModule) {
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
      plugins: [
        () => {
          return {
            visitor: {
              CallExpression: (astPath: any) => {
                if (astPath.node.callee.name === 'require') {
                  const id = astPath.node.arguments[0].value;
                  if (!id.startsWith('./')) {
                    const realPath = resolvePackage(id, this.cwd);
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
              ImportDeclaration: (astPath: any) => {
                const id = astPath.node.source.value;
                if (!id.startsWith('./')) {
                  const realPath = resolvePackage(
                    id,
                    path.parse(this.getSourcePath()).dir
                  );
                  const relativePathFromNodeModules = path.relative(
                    path.resolve(this.cwd, 'node_modules'),
                    path.resolve(realPath)
                  );
                  const distPath = path.relative(
                    path.parse(this.getDestinationPath()).dir,
                    path.resolve(
                      this.getDestinationDir(),
                      relativePathFromNodeModules
                    )
                  );
                  astPath.node.source.value = distPath;
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
      ]
    }).code;
  }
}
