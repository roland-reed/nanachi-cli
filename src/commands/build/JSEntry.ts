import generate from 'babel-generator';
import traverse from 'babel-traverse';
import t from 'babel-types';
import babylon from 'babylon';
import chalk from 'chalk';
const { transform } = require('../src/translator/jsTransform');
const { wxml } = require('../src/translator/bridge');
import * as path from 'path';
import { resolvePackage } from '../../shared/resolvePackage';
import * as spinner from '../../shared/spinner';
import Entry from './Entry';
import { IEntryOptions } from './Entry';
import { formatSize } from './utils';

export default class JSEntry extends Entry {
  public type: symbol;
  public ast: any;
  private listen: boolean;
  constructor(options: IEntryOptions) {
    super(options);
    this.listen = false;
    this.listenWxml();
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
  private logFiles() {
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

    spinner.stop();
    // tslint:disable-next-line
    console.log(logString);
  }
  private replaceImport() {
    traverse(this.ast, {
      ImportDeclaration: astPath => {
        const id = astPath.node.source.value;
        let relativePath = '';
        if (id === '@react') {
          // debugger
          relativePath = path.relative(
            path.parse(path.resolve(this.getCwd(), this.getDestinationPath()))
              .dir,
            path.resolve(
              this.getCwd(),
              this.getDestDir(),
              'npm',
              'anujs/dist/ReactWX.js'
            )
          );
        }
        if (id.startsWith('.')) relativePath = id;
        if (!relativePath) {
          const relativePathToNodeModules = path.relative(
            path.resolve(this.getCwd(), 'node_modules'),
            resolvePackage(id, this.getSourceDir())
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
          if (!relativePath && !relativePath.startsWith('./')) {
            relativePath = './' + relativePath;
          }
        }
        astPath.node.source.value = relativePath;
      },
      JSXAttribute: astPath => {
        if (astPath.node.name.name === 'src') {
          if (t.isStringLiteral(astPath.node.value)) {
            const filePath = astPath.node.value.value;
            if (!/^https?:\/\//.test(filePath)) {
              this.appendExtraFile({
                sourcePath: path.resolve(
                  this.getSourceDir(),
                  astPath.node.value.value
                ),
                type: 'copy',
                destinationPath: path.resolve(
                  this.getDestinationDir(),
                  astPath.node.value.value
                )
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
        }
      }
    });
    this.setOriginalCode(generate(this.ast).code);
  }
  private getWxmlFilename(): string {
    const { root, dir, name } = path.parse(this.getDestinationPath());
    return path.join(root, dir, name + '.wxml');
  }
  private listenWxml() {
    wxml.on('wxml', (code: string) => {
      if (this.listen) {
        this.appendExtraFile({
          type: 'write',
          destinationPath: this.getWxmlFilename(),
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
