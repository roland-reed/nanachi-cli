import chalk from 'chalk';
import less from 'less';
import nodeSass from 'node-sass';
import resolve from 'resolve';
import yargs from 'yargs';
import * as spinner from '../../shared/spinner';

let anujsPath: string;
const shouldWarn: boolean =
  yargs.argv._[0] === 'build' || yargs.argv._[0] === 'start';

export const getAnuPath = (): string => {
  if (anujsPath) {
    return anujsPath;
  } else {
    try {
      return (anujsPath = resolve.sync('anujs/dist/ReactWX.js', {
        basedir: process.cwd()
      }));
    } catch (error) {
      if (!shouldWarn) {
        spinner.warn(
          chalk`Cannot resolve {cyan anujs}
  if you are a app developer:
    a) execute {cyan npm install anujs}
    b) or, execute {cyan npm install}
  if you are a CLI developer:
    a) cd [PATH_OF_ANUJS]
    b) execute {cyan npm link} or {cyan yarn link}
    c) cd [PATH_OF_YOUR_APP]
    d) execute {cyan npm link anujs} or {cyan yarn link anujs}`
        );
        spinner.stop();
        process.exit(1);
      }
    }
  }
};

export const formatSize = (size: number): string => {
  switch (true) {
    case size < 0:
      return chalk`N/A`;

    case size === 0:
      return chalk`{gray copied directly}`;

    case size < 2 ** 10:
      return chalk`{green.bold ${size.toFixed(2).toString()}} Bytes`;

    case size < 2 ** 20:
      return chalk`{green.bold ${(size / 2 ** 10).toFixed(2).toString()}}  KiB`;

    case size < 2 ** 30:
      return chalk`${(size / 2 ** 20).toFixed(2).toString()} {green MiB}`;

    default:
      return chalk`${(size / 2 ** 30).toFixed(2).toString()} {green GiB}`;
  }
};

export const renderSass = (
  options: nodeSass.Options
): Promise<nodeSass.Result> =>
  new Promise((promiseResolve, reject) => {
    nodeSass.render(options, (err, res) => {
      if (err) {
        reject(err);
      } else {
        promiseResolve(res);
      }
    });
  });

export const renderLess = (input: string, options: { filename: string }) =>
  less.render(input, options);
