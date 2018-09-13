import resolve from 'resolve';
import * as path from 'path';

const alias: {
  [property: string]: string;
} = {};

export const getAlias = (name: string, basedir: string) => {
  if (name.startsWith('@components')) {
    return path.resolve(process.cwd(), 'components', name.split('/').slice(1).join('/'));
  }
  if (alias[name]) return alias[name];
  return (alias[name] = resolve.sync(name, { basedir }));
};
