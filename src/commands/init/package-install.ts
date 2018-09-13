import { spawn } from 'child_process';
import chalk from 'chalk';
import * as spinner from '../../shared/spinner';

export default async function start(
  registry: string,
  cwd: string
): Promise<void> {
  try {
    await install(registry, cwd);
    spinner.succeed('Dependencies installed successfully.');
  } catch (error) {
    // tslint:disable-next-line
    console.log(error);
  } finally {
    spinner.stop();
  }
}

function install(registry: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['install', `--registry=${registry}`];
    spinner.start(chalk`{cyan npm} ${args.join(' ')} at {cyan ${cwd}}`);
    const cp = spawn('npm', args, { cwd });
    cp.on('error', reject);
    cp.on('close', (code: number) => {
      if (!code) resolve();
      reject(
        chalk`\`{cyan npm}\` ${args.join(
          ' '
        )} exit with code ${code.toString()}`
      );
    });
  });
}
