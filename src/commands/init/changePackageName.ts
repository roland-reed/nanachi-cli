import * as fs from 'fs-extra';
import * as path from 'path';

export default async (cwd: string, name: string) => {
  const filePath: string = path.resolve(cwd, name, 'package.json');
  try {
    const packageJson = JSON.parse(await fs.readFile(filePath, 'utf8'));
    packageJson.name = name;
    await fs.writeFile(filePath, JSON.stringify(packageJson));
  } catch (e) {
    // tslint:disable-next-line
    console.log(e);
  }
};
