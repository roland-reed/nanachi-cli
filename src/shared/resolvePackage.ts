import * as spinner from '@shared/spinner';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import resolve from 'resolve';
import { getAnuPath } from '../commands/build/utils';

const alias: {
  [property: string]: string;
} = {};

export const resolvePackage = (
  name: string,
  basedir: string,
  target: string
) => {
  if (name === 'react') {
    alias[name] = getAnuPath(target);
  }
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
  // 缓存
  if (alias[name]) return alias[name];
  // 尝试解析
  let resolved;
  try {
    resolved = resolve.sync(name, { basedir });
  } catch (error) {
    if (name === 'regenerator-runtime/runtime') {
      spinner.info(chalk`missing {cyan regenerator-runtime}`);
      spinner.start(chalk`installing {cyan regenerator-runtime}`);
      execSync('npm install regenerator-runtime', { cwd: process.cwd() });
    } else {
      throw error;
    }
  }
  // cjs 解析结果
  alias[name] = resolved;

  const packageJsonPath = path.resolve(
    process.cwd(),
    'node_modules',
    name,
    'package.json'
  );
  let packageJson: any = {};

  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    // 解析失败的结果不会显示
  }
  // 如果该包存在 ESModule
  if (packageJson.module) {
    // 统一形式，./dist -> dist
    const normalize = (n: string) => n.replace(/^\.?[/\\]?/, '');
    const main = normalize(packageJson.main);
    const module = normalize(packageJson.module);
    // 将 cjs 的解析结果替换为 esm
    // main = dist/cjs; esm = dist/esm;
    // 比如 dist/cjs/index.js -> dist/esm/index.js
    let regex = new RegExp(`${main}`);

    // 若 module 是一个文件而 main 是一个目录
    // 需要将路径中 main 之后的字符串都替换掉
    // 如 main = dist/cjs; module = dist/esm/production.js; resolved = dist/cjs/index.js
    // 需要将 dist/cjs/index.js 替换为 dist/esm/production.js
    if (path.parse(module).ext) {
      regex = new RegExp(`${main}.*`);
    }

    alias[name] = resolved.replace(regex, module);
  }
  return alias[name];
};
