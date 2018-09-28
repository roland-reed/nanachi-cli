import fs from 'fs-extra';

export interface InterfaceWriteFile {
  type: 'write';
  sourcePath?: string;
  content: string;
  destinationPath: string;
}

export interface InterfaceCopyFile {
  type: 'copy';
  sourcePath: string;
  content?: string;
  destinationPath: string;
}

export default class File {
  public async write({
    content,
    destinationPath,
    type,
    sourcePath
  }: InterfaceWriteFile | InterfaceCopyFile) {
    switch (type) {
      case 'write':
        await fs.ensureFile(destinationPath);
        await fs.writeFile(destinationPath, content);
        break;

      case 'copy':
        if (!(await fs.pathExists(destinationPath))) {
          await fs.copy(sourcePath, destinationPath);
        }
        break;

      default:
        throw new Error(
          `No \`type\` provided, type: ${type} sourcePath: ${sourcePath} destinationPath: ${destinationPath} `
        );
    }
  }
}
