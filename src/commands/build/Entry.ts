import * as fs from 'fs-extra';
import * as path from 'path';
import File, { IFile } from './File';

export interface IEntryOptions {
  sourcePath: string;
  code: string;
  originalCode: string;
  cwd: string;
  destDir: string;
  srcDir: string;
}

export default class Entry extends File {
  private sourcePath: string;
  private originalCode: string;
  private destinationPath: string;
  private extraFiles: IFile[];
  private code: string;
  private cwd: string;
  private destDir: string;
  private sourceDir: string;
  private destinationDir: string;
  constructor({
    sourcePath,
    originalCode = '',
    code = '',
    cwd,
    destDir
  }: IEntryOptions) {
    super();
    this.cwd = cwd;
    this.sourceDir = path.parse(sourcePath).dir;
    this.code = code;
    this.destDir = destDir;
    this.sourcePath = sourcePath;
    this.originalCode = originalCode;
    this.extraFiles = [];
  }
  public getSourceDir() {
    return this.sourceDir;
  }
  public getDestinationDir() {
    if (!this.destinationDir) this.getDestinationPath();
    return this.destinationDir;
  }
  public getCwd() {
    return this.cwd;
  }
  public async reset() {
    this.code = '';
    this.extraFiles = [];
    await this.loadContent();
  }
  public getDestDir() {
    return this.destDir;
  }
  public getSourcePath() {
    return this.sourcePath;
  }
  public getOriginalCode() {
    return this.originalCode;
  }
  public setOriginalCode(code: string) {
    this.originalCode = code;
  }
  public appendExtraFile(file: IFile) {
    // 如果已存在相同目标路径的文件
    // 则先将其移除
    const possibleFileIndex = this.extraFiles.findIndex(
      v => file.destinationPath === v.destinationPath
    );
    if (possibleFileIndex > -1) {
      this.extraFiles.splice(possibleFileIndex, 1);
    }
    this.extraFiles.push(file);
  }
  public getCode() {
    return this.code;
  }
  public setCode(code: string) {
    return (this.code = code);
  }
  public async process() {
    await this.writeAllFiles();
    this.resetExtraFiles();
  }
  public getDestinationPath() {
    if (!this.destinationPath) this.initializeDestination();
    this.destinationDir = path.parse(this.destinationPath).dir;
    return this.destinationPath;
  }
  public setDestinationPath(destinationPath: string) {
    this.destinationPath = destinationPath;
  }
  public initializeDestination() {
    const relativePath = path.relative(this.cwd, this.sourcePath);
    const pathTokens = relativePath.split(path.sep);
    pathTokens.splice(0, 1, this.destDir);
    this.destinationPath = pathTokens.join(path.sep);
  }
  public async unlink() {
    const files = [
      this.getDestinationPath(),
      ...this.getExtraFiles().map(file => file.destinationPath)
    ];
    await Promise.all(
      files.map(async file => {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
        }
      })
    );
  }
  public getExtraFiles() {
    return this.extraFiles;
  }
  private async loadContent() {
    this.originalCode = await fs.readFile(this.getSourcePath(), 'utf8');
  }
  private resetExtraFiles() {
    this.extraFiles = [];
  }
  private async writeAllFiles() {
    await this.write({
      type: 'write',
      destinationPath: this.getDestinationPath(),
      content: this.getCode()
    });
    await Promise.all(this.getExtraFiles().map(this.write));
  }
}
