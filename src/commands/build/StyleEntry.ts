import * as path from 'path';
import Entry from './Entry';
import { IEntryOptions } from './Entry';
import { renderLess, renderSass } from './utils';

export default class StyleEntry extends Entry {
  private ext: string;
  constructor(options: IEntryOptions) {
    super(options);
    this.ext = path.parse(this.getSourcePath()).ext;
  }
  public async process() {
    await this.transform();
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
  private async transform() {
    switch (this.ext) {
      case '.sass':
      case '.scss':
        this.setCode(
          (await renderSass({
            data: this.getOriginalCode()
          })).css.toString()
        );
        break;

      case '.less':
        const css = (await renderLess(this.getOriginalCode(), {
          filename: this.getSourcePath()
        })).css;
        this.setCode(css);

      default:
        break;
    }
  }
}
