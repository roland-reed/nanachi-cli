import JSEntry from './JSEntry';
import traverse from 'babel-traverse';
import fs from 'fs-extra';
import t from 'babel-types';
import * as path from 'path';
import generate from 'babel-generator';
import { IEntryOptions } from './Entry';

export default class AppEntry extends JSEntry {
  private appConfig: object;
  private pages: string[];
  private appJSON: string;
  constructor(options: IEntryOptions) {
    super(options);
    this.pages = [];
  }
  public async process() {
    this.parse();
    this.traverse();
    this.processPages();
    this.stringifyAppJSON();
    this.setAppJSON();
    await this.copyUserProjectConfig();
    await super.process();
    await this.reset();
  }
  private isPage(page: string) {
    if (!page.startsWith('./')) return false;
    if (page.startsWith('@')) return false;
    if (path.parse(page).ext) return false;
    return true;
  }
  private async copyUserProjectConfig() {
    const userProjectConfigPath = path.resolve(
      this.getSourceDir(),
      'project.config.json'
    );

    if (await fs.pathExists(userProjectConfigPath)) {
      this.appendExtraFile({
        sourcePath: path.resolve(this.getSourceDir(), 'project.config.json'),
        type: 'copy',
        destinationPath: path.resolve(
          this.getDestinationDir(),
          'project.config.json'
        )
      });
    }
  }
  private traverse() {
    traverse(this.ast, {
      ImportDeclaration: astPath => {
        this.pages.push(astPath.node.source.value);
        if (this.isPage(astPath.node.source.value)) astPath.remove();
      },
      ClassProperty: astPath => {
        if (
          t.isIdentifier(astPath.node.key, {
            name: 'config'
          })
        ) {
          // tslint:disable-next-line
          const userAppConfig = eval(
            `(${
              generate(astPath.node.value, {
                minified: false
              }).code
            })`
          );
          this.appConfig = userAppConfig;
        }
      }
    });
  }
  private stringifyAppJSON() {
    this.appJSON = JSON.stringify(
      { ...this.appConfig, pages: this.pages },
      null,
      4
    );
  }
  private processPages() {
    this.pages = this.pages.filter(this.isPage).map(page => page.slice(2));
  }
  private setAppJSON() {
    this.appendExtraFile({
      type: 'write',
      destinationPath: path.resolve(this.getDestinationDir(), 'app.json'),
      content: this.appJSON
    });
  }
}
