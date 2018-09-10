import chalk from 'chalk';
import * as path from 'path';
import * as spinner from '../../shared/spinner';
import gitClone from './git-clone';
import install from './package-install';
const inquirer = require('inquirer');
const validateNpmPackageName = require('validate-npm-package-name');

const enum Registry {
  qunar = 'http://npmrepo.corp.qunar.com/',
  taobao = 'https://registry.npm.taobao.org/',
  cnpm = 'https://r.cnpmjs.org/',
  npm = 'https://registry.npmjs.org/'
}

const TEMPLATES: {
  [property: string]: {
    url: string;
    checkout: string;
  };
} = {
  qunar: {
    checkout: 'gaoxiaolin',
    url: 'git@gitlab.corp.qunar.com:qincheng.zhong/anuwx.git'
  }
};

const registryName = (name: string, registry: string): string =>
  `${name} (${registry})`;

export default async function init(): Promise<void> {
  try {
    const {
      name,
      template,
      registry
    }: {
      name: string;
      template: string;
      registry: string;
    } = await inquirer.prompt([
      {
        message: 'Project name',
        name: 'name',
        type: 'input',
        validate(v: string) {
          const validation = validateNpmPackageName(v);
          if (validation.validForNewPackages) return true;
          return validation.errors.join('. ');
        }
      },
      {
        choices: ['qunar'],
        message: 'Choose a template',
        name: 'template',
        type: 'list'
      },
      {
        choices: [
          registryName('qunar', Registry.qunar),
          registryName('taobao', Registry.taobao),
          registryName('cnpm', Registry.cnpm),
          registryName('npm', Registry.npm)
        ],
        default: Registry.npm,
        message: 'Choose a registry to use',
        name: 'registry',
        type: 'list'
      }
    ]);

    spinner.start(`cloning into ${name}`);

    await gitClone({
      checkout: TEMPLATES[template].checkout,
      gitRepository: TEMPLATES[template].url,
      target: name
    });

    spinner.succeed('template cloned');

    await install(registry, path.resolve(process.cwd(), name));

    spinner.stop();

    // tslint:disable-next-line
    console.log(chalk`
      Template has been cloned to {cyan ${name}}.

      Start the project by executing the following commands:

      {cyan cd} ${name}
      {cyan anu} start
    `);
  } catch (error) {
    throw error;
  }
}
