import fs from 'fs-extra';

export interface IFile {
  type: string;
  sourcePath?: string;
  content?: string;
  destinationPath: string;
}

export default class File {
  public async write({ content, destinationPath, type, sourcePath }: IFile) {
    await fs.ensureFile(destinationPath);
    switch (type) {
      case 'write':
        await fs.writeFile(destinationPath, content);
        break;

      case 'copy':
        await fs.copy(sourcePath, destinationPath);
        break;

      default:
        throw new Error(
          `No \`type\` provided, type: ${type} sourcePath: ${sourcePath} destinationPath: ${destinationPath} `
        );
    }
  }
}
