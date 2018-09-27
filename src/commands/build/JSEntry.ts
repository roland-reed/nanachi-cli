import customizedReactFileNames from '@shared/customizedReactFileNames';
import { resolvePackage } from '@shared/resolvePackage';
import targetExtensions from '@shared/targetExtensions';
import generate from 'babel-generator';
import traverse from 'babel-traverse';
import t from 'babel-types';
import babylon from 'babylon';
import chalk from 'chalk';
// treat as external dependency
const { transform } = require('../src/translator/jsTransform');
// treat as external dependency
const { template } = require('../src/translator/bridge');
import * as path from 'path';
import Entry from './Entry';
import { InterfaceEntryOptions } from './Entry';
import Module from './Module';
import { formatSize } from './utils';

export default class JSEntry extends Entry {
  public type: symbol;
  public ast: any;
  private listen: boolean;
  constructor(options: InterfaceEntryOptions) {
    super(options);
    this.listen = false;
    this.listenTemplate();
  }
  public parse() {
    if (this.ast) return;
    this.ast = babylon.parse(this.getOriginalCode(), {
      plugins: [
        'jsx',
        'objectRestSpread',
        'classProperties',
        'asyncGenerators'
      ],
      sourceType: 'module'
    });
  }
  public async process() {
    this.parse();
    this.addRegeneratorRuntime();
    this.replaceImport();
    this.transform();
    this.logFiles();
    await super.process();
    this.ast = null;
    await super.reset();
  }
  private getRelativePath(filePath: string) {
    return path.relative(this.getCwd(), filePath);
  }
  // 格式化输出当前 Entry 所产生的文件
  private logFiles() {
    if (this.silent) return;
    const emittedFiles = {
      originalFile: {
        path: this.getRelativePath(this.getSourcePath()),
        size: this.getOriginalCode().length
      },
      compiledFile: {
        path: this.getRelativePath(this.getDestinationPath()),
        size: this.getCode().length
      },
      generatedFiles: this.getExtraFiles()
        .filter(file => file.type === 'write')
        .map(file => ({
          path: this.getRelativePath(file.destinationPath),
          size: file.content.length
        })),
      copiedFiles: this.getExtraFiles()
        .filter(file => file.type === 'copy')
        .map(file => ({
          path: this.getRelativePath(file.destinationPath),
          size: 0
        }))
    };
    let logString: string = '';
    let indent: string = '';

    logString += chalk`{green.bold Entry:} {underline ${
      emittedFiles.originalFile.path
    }} ${formatSize(emittedFiles.originalFile.size)}`;
    indent += '  ';
    logString += '\n';

    logString += chalk`${indent}{blue.bold Output:} {underline ${
      emittedFiles.compiledFile.path
    }} ${formatSize(emittedFiles.compiledFile.size)}`;
    logString += '\n';

    emittedFiles.generatedFiles.forEach(
      ({ path: filePath, size }: { path: string; size: number }) => {
        logString += chalk`${indent}{magenta.bold Generate:} {underline ${filePath}} ${formatSize(
          size
        )}`;
        logString += '\n';
      }
    );

    emittedFiles.copiedFiles.forEach(
      ({ path: filePath, size }: { path: string; size: number }) => {
        logString += chalk`${indent}{cyan.bold Static:} {underline ${filePath}} ${formatSize(
          size
        )}`;
        logString += '\n';
      }
    );

    // tslint:disable-next-line
    console.log(logString);
  }
  private addRegeneratorRuntime() {
    traverse(this.ast, {
      ClassMethod: astPath => {
        // 使用了 async 函数
        if (astPath.node.async) {
          const program: any = astPath.findParent(t.isProgram);
          const hasRegenerator: boolean = program.node.body.some(
            (node: Node) => {
              if (t.isImportDeclaration(node)) {
                return node.specifiers.some(specifier =>
                  t.isIdentifier(specifier.local, {
                    name: 'regeneratorRuntime'
                  })
                );
              }
            }
          );

          // 使用了 async 函数却没有引用 regenerator-runtime
          if (!hasRegenerator) {
            program.node.body.unshift(
              t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier('regeneratorRuntime'))],
                t.stringLiteral('regenerator-runtime/runtime')
              )
            );

            const module = new Module({
              sourcePath: path.resolve(
                this.getCwd(),
                'node_modules',
                'regenerator-runtime',
                'runtime.js'
              ),
              cwd: this.getCwd(),
              destDir: this.getDestDir(),
              target: this.target
            });

            module.process();
          }
        }
      }
    });
  }
  private replaceImport() {
    traverse(this.ast, {
      ImportDeclaration: astPath => {
        const id = astPath.node.source.value;
        let relativePath = '';
        if (id === '@react') {
          relativePath = path.relative(
            path.parse(path.resolve(this.getCwd(), this.getDestinationPath()))
              .dir,
            path.resolve(
              this.getCwd(),
              this.getDestDir(),
              'npm',
              'anujs',
              'dist',
              customizedReactFileNames[this.build.target].primary
            )
          );
        }
        if (id.startsWith('.')) relativePath = id;
        if (!relativePath) {
          const relativePathToNodeModules = path.relative(
            path.resolve(this.getCwd(), 'node_modules'),
            resolvePackage(id, this.getSourceDir(), this.build.target)
          );
          const absolutePathOfDist = path.resolve(
            this.getCwd(),
            this.getDestDir(),
            'npm',
            relativePathToNodeModules
          );
          const destinationPath = path.resolve(
            this.getCwd(),
            this.getDestinationPath()
          );
          relativePath = path.relative(
            path.parse(destinationPath).dir,
            absolutePathOfDist
          );
        }
        // 假设从 /a/b -> /a/b/c/d
        // path.relative() 的结果是 c/d
        // 这种形式在百度智能小程序中会失败
        // 因此需要在前面加 ./
        if (relativePath && !relativePath.startsWith('./')) {
          relativePath = './' + relativePath;
        }
        astPath.node.source.value = relativePath;
      },
      JSXAttribute: astPath => {
        // 将以 ./ 或者 ../ 开头的 src 属性视为静态资源
        if (astPath.node.name.name === 'src') {
          if (t.isStringLiteral(astPath.node.value)) {
            const filePath = astPath.node.value.value;
            if (/^\.{0,2}\/.*/.test(filePath)) {
              const destinationPath = path.resolve(
                this.getDestinationDir(),
                astPath.node.value.value
              );
              this.appendExtraFile({
                sourcePath: path.resolve(
                  this.getSourceDir(),
                  astPath.node.value.value
                ),
                type: 'copy',
                destinationPath
              });
            }
          }
        }
      },
      ClassProperty: astPath => {
        const configPath: string = path.resolve(
          this.getDestinationDir(),
          `${path.parse(this.getSourcePath()).name}.json`
        );
        if (
          this.getExtraFiles().some(file => file.destinationPath === configPath)
        ) {
          return;
        }
        if (
          t.isIdentifier(astPath.node.key, {
            name: 'config'
          })
        ) {
          if (t.isClassProperty(astPath.node, { static: true })) {
            // tslint:disable-next-line
            const pageConfig = eval(
              `(${
                generate(astPath.node.value, {
                  minified: true
                }).code
              })`
            );
            this.appendExtraFile({
              type: 'write',
              destinationPath: configPath,
              content: JSON.stringify(pageConfig)
            });
          } else {
            const filePath = path.relative(this.getCwd(), this.getSourcePath());
            this.build.spinner.warn(
              chalk`Did you forget to add static before {cyan config} at {bold.underline ${filePath}} ?\n`
            );
          }
        }
      }
    });
    this.setOriginalCode(generate(this.ast).code);
  }
  private getTemplateFilename(): string {
    const { root, dir, name } = path.parse(this.getDestinationPath());
    return path.join(
      root,
      dir,
      name + targetExtensions[this.build.target].template
    );
  }
  private listenTemplate() {
    template.on('main', ({ content: code }: { content: string }) => {
      if (this.listen) {
        this.appendExtraFile({
          type: 'write',
          destinationPath: this.getTemplateFilename(),
          content: code
        });
      }
    });
  }
  private disableListen() {
    this.listen = false;
  }
  private enableListen() {
    this.listen = true;
  }
  private transform() {
    this.enableListen();
    this.setCode(
      transform(this.getOriginalCode(), {
        filename: this.getSourcePath()
      })
    );
    this.disableListen();
  }
}
