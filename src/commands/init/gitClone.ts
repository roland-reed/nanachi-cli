import chalk from 'chalk';
import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as spinner from '../../shared/spinner';

export interface InterfaceGitClone {
  gitRepository: string;
  checkout?: string;
  target: string;
  git?: boolean;
}

function clone({
  gitRepository,
  checkout,
  target
}: InterfaceGitClone): Promise<undefined> {
  return new Promise((resolve, reject) => {
    const commands = ['git', 'clone', gitRepository];
    if (checkout) commands.push('-b', checkout);
    commands.push(target);
    exec(commands.join(' '), err => {
      if (err) reject(err);
      resolve();
    });
  });
}

async function initGitRepository(target: string) {
  return new Promise((resolve, reject) => {
    const commands = ['git', 'init'];
    exec(
      commands.join(' '),
      {
        cwd: target
      },
      err => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

async function init({
  gitRepository,
  checkout,
  target,
  git
}: InterfaceGitClone) {
  const targetPath = path.resolve(process.cwd(), target);

  if (await fs.pathExists(targetPath)) {
    spinner.stop(
      chalk`{cyan ${targetPath}} is already existed, please try another name`
    );
    process.exit(0);
  }

  try {
    await clone({
      checkout,
      gitRepository,
      target,
      git
    });
    await fs.remove(path.resolve(targetPath, '.git'));
    if (git) await initGitRepository(targetPath);
  } catch (error) {
    spinner.stop();
    /* tslint:disable */
    console.log(error.message || error);
    /* tslint:enable */
    process.exit(1);
  }
}

export default init;
