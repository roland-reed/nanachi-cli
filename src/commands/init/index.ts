import * as spinner from '@shared/spinner';
import chalk from 'chalk';
import * as path from 'path';
import changePackageName from './changePackageName';
import gitClone from './gitClone';
import install from './packageInstall';
import { choices as RegistryChoices, defaultRegistry } from './Registry';
import { getTemplatesData } from './templates';
const inquirer = require('inquirer');
const validateNpmPackageName = require('validate-npm-package-name');

export interface InterfaceAnswers {
  name: string;
  template: string;
  registry: string;
  git: boolean;
}

export default async function init() {
  const { templates, choices: templateChoices } = await getTemplatesData();
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

    const gitRepository = templates[template].url;

    spinner.start(
      chalk`cloning into {cyan ${name}} from {cyan ${gitRepository}}`
    );

    await gitClone({
      checkout: templates[template].checkout,
      gitRepository,
      target: name,
      git
    });

    spinner.succeed('Template cloned');

    await changePackageName(process.cwd(), name);

    await install(registry, path.resolve(process.cwd(), name));

    spinner.stop();

    // tslint:disable-next-line
    console.log(chalk`
      Template has been cloned to {cyan ${name}}.

      Start the project by executing the following commands:

      {cyan cd} ${name}
      {cyan nanachi} start
    `);
  } catch (error) {
    throw error;
  }
}
