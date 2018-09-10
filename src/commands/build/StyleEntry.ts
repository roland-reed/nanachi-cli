import babylon from 'babylon';
import traverse from 'babel-traverse';
import * as path from 'path';
import Entry from './Entry';
import { FILE_TYPE_LESS } from './fileType';
import { IEntryOptions } from './Entry';

export default class StyleEntry extends Entry {
  public type: symbol;
  constructor(options: IEntryOptions) {
    super(options);
    this.type = FILE_TYPE_LESS;
  }
  public async process() {
    this.transform();
    this.modifyExt();
    super.process();
  }
  private modifyExt() {
    if (!this.getDestinationPath()) super.initializeDestination();
    const pathTokens = this.getDestinationPath().split(path.sep);
    const { name } = path.parse(this.getDestinationPath());
    pathTokens.splice(-1, 1, `${name}.wxss`);
    this.setDestinationPath(pathTokens.join(path.sep));
  }
  private transform() {
    const ast = babylon.parse(this.getCode(), { sourceType: 'module' });
    const self = this;
    traverse(ast, {
      StringLiteral(astPath) {
        self.setCode(astPath.node.value);
      }
    });
  }
}
