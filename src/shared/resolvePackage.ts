import * as fs from 'fs-extra';
import * as path from 'path';
import resolve from 'resolve';

const alias: {
  [property: string]: string;
} = {};

export const resolvePackage = (name: string, basedir: string) => {
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
      // 针对 react-redux 以及 redux 的 hack
      // 由于 rollup 默认使用的是 react-redux 导出的 esm 模块而非 cjs 模块
      // 而 resolve 是 cjs 的实现，会导致复制到 dist 目录中的文件路径出错
      // 因此将路径中的 lib 替换为 es
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
