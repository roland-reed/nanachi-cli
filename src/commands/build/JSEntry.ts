const { transform } = require('../src/translator/jsTransform');
const { wxml } = require('../src/translator/bridge');
import * as path from 'path';
import t from 'babel-types';
import traverse from 'babel-traverse';
import Entry from './Entry';
import { FILE_TYPE_JS } from './fileType';
import { IEntryOptions } from './Entry';
import babylon from 'babylon';
import generate from 'babel-generator';

export default class JSEntry extends Entry {
  public type: symbol;
  public ast: any;
  private listen: boolean;
  constructor(options: IEntryOptions) {
    super(options);
    this.type = FILE_TYPE_JS;
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
    await super.process();
    this.ast = null;
    await super.reset();
  }
  private replaceImport() {
    traverse(this.ast, {
      ImportDeclaration: astPath => {
        const id = astPath.node.source.value;
        if (id.startsWith('@')) {
          let relativePath = path.relative(
            path.parse(path.resolve(this.getCwd(), this.getDestinationPath()))
              .dir,
            path.resolve(
              this.getCwd(),
              this.getDestDir(),
              'npm',
              'anujs/dist/ReactWX.js'
            )
          );
          if (!relativePath.startsWith('./')) {
            relativePath = './' + relativePath;
          }
          astPath.node.source.value = relativePath;
        }
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
            sourcePath: '',
            type: 'write',
            destinationPath: path.resolve(
              this.getDestinationDir(),
              `${path.parse(this.getSourcePath()).name}.json`
            ),
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
