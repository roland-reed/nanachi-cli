import chalk from 'chalk';
import * as path from 'path';
import * as spinner from '../../shared/spinner';
import gitClone from './gitClone';
import install from './packageInstall';
import { choices as RegistryChoices, defaultRegistry } from './Registry';
import { choices as templateChoices, TEMPLATES } from './templates';
const inquirer = require('inquirer');
const validateNpmPackageName = require('validate-npm-package-name');

export interface InterfaceAnswers {
  name: string;
  template: string;
  registry: string;
  git: boolean;
}

export default async function init() {
  try {
    const {
      name,
      template,
      registry,
      git = false
    }: InterfaceAnswers = await inquirer.prompt([
      {
        message: 'Name your project',
        name: 'name',
        type: 'input',
        validate(v: string) {
          const validation = validateNpmPackageName(v);
          if (validation.validForNewPackages) return true;
          return validation.errors.join('. ');
        }
      },
      {
        choices: templateChoices,
        message: 'Choose a template',
        name: 'template',
        type: 'list'
      },
      {
        choices: RegistryChoices,
        default: defaultRegistry,
        message: 'Choose a registry',
        name: 'registry',
        type: 'list'
      },
      {
        message: 'Need a git repository?',
        type: 'confirm',
        name: 'git'
      }
    ]);

    spinner.start(`cloning into ${name}`);

    await gitClone({
      checkout: TEMPLATES[template].checkout,
      gitRepository: TEMPLATES[template].url,
      target: name,
      git
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
