import * as fs from 'fs-extra';
import * as path from 'path';
import resolve from 'resolve';

const alias: {
  [property: string]: string;
} = {};

export const getAlias = (name: string, basedir: string) => {
  if (name.startsWith('@components')) {
    return path.resolve(
      process.cwd(),
      'components',
      name
        .split('/')
        .slice(1)
        .join('/')
    );
  }
  if (alias[name]) return alias[name];
  const resolved = resolve.sync(name, { basedir });
  alias[name] = resolved;
  try {
    const packageJsonPath = path.resolve(
      process.cwd(),
      'node_modules',
      name,
      'package.json'
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.module) {
      alias[name] = resolved
        .split('/')
        .map(v => (v === 'lib' ? 'es' : v))
        .join('/');
    }
  } catch (error) {
    // noop
  }
  return alias[name];
};
