import customizedReactFileNames from '@shared/customizedReactFileNames';
import chalk from 'chalk';
import less from 'less';
import nodeSass from 'node-sass';
import resolve from 'resolve';

let anujsPath: string;

export const getAnuPath = (target: string): string => {
  if (anujsPath) {
    return anujsPath;
  } else {
    try {
      return (anujsPath = resolve.sync(`anujs/dist/${customizedReactFileNames[target].primary}`, {
        basedir: process.cwd()
      }));
    } catch (error) {
      return '';
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
