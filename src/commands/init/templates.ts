import * as spinner from '@shared/spinner';
import axios from 'axios';
import chalk from 'chalk';

interface InterfaceTEMPLATE {
  [property: string]: {
    url: string;
    checkout: string;
    name: string;
    value: string;
  };
}

const DEFAULT_TEMPLATES: InterfaceTEMPLATE = {
  qunar: {
    value: 'qunar',
    name: '去哪儿网',
    checkout: 'qunar',
    url: 'https://github.com/YMFE/nanachi-template.git'
  },
  music: {
    value: 'music',
    name: '音乐 APP',
    checkout: 'music',
    url: 'https://github.com/YMFE/nanachi-template.git'
  },
  pdd: {
    value: 'pdd',
    name: '在线商城',
    checkout: 'pdd',
    url: 'https://github.com/YMFE/nanachi-template.git'
  }
};

const generateChoices = (templates: InterfaceTEMPLATE) =>
  Object.keys(templates).map(key => {
    return {
      name: templates[key].name,
      value: templates[key].value
    };
  });

const getRemoteTemplates = async () => {
  const remoteTemplatesUrl =
    'https://raw.githubusercontent.com/YMFE/nanachi-template/master/templates.json';
  const remoteTemplates = await axios.get(remoteTemplatesUrl);
  return { ...DEFAULT_TEMPLATES, ...remoteTemplates.data };
};

const returnDefaultTemplates = () =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(DEFAULT_TEMPLATES);
    }, 3000);
  });

export async function getTemplatesData() {
  spinner.start('fetching latest templates');

  const templates = await Promise.race([
    returnDefaultTemplates(),
    getRemoteTemplates()
  ]);

  if (templates === DEFAULT_TEMPLATES) {
    spinner.succeed(chalk`{bold Using offline templates}`);
  } else {
    spinner.succeed(chalk`{bold Using remote templates}`);
  }

  return {
    templates,
    choices: generateChoices(templates)
  };
}
