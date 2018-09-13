import resolve from 'resolve';
import chalk from 'chalk';
import nodeSass from 'node-sass';
import less from 'less';
import * as spinner from '../../shared/spinner';
import yargs from 'yargs';
import rollup from 'rollup';
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonjs = require('rollup-plugin-commonjs');

let anujsPath: string;
const isInit: boolean = yargs.argv[0] === 'init';

export const getAnuPath = (): string => {
  if (anujsPath) {
    return anujsPath;
  } else {
    try {
      return (anujsPath = resolve.sync('anujs/dist/ReactWX.js', {
        basedir: process.cwd()
      }));
    } catch (error) {
      if (!isInit) {
        spinner.warn(
          chalk`Cannot resolve {cyan anujs}, ` +
            chalk`if you haven't install {cyan anujs}, execute {cyan npm install anujs}, ` +
            chalk`if you forgot to execute {cyan npm install}, execute it. `
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
