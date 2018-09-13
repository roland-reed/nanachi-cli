export const enum Registry {
  qunar = 'http://npmrepo.corp.qunar.com/',
  taobao = 'https://registry.npm.taobao.org/',
  cnpm = 'https://r.cnpmjs.org/',
  npm = 'https://registry.npmjs.org/'
}

export const registryName = (name: string, registry: string): string =>
  `${name} (${registry})`;

export const choices = [
  {
    name: registryName('qunar', Registry.qunar),
    value: Registry.qunar
  },
  {
    name: registryName('taobao', Registry.taobao),
    value: Registry.taobao
  },
  { name: registryName('cnpm', Registry.cnpm), value: Registry.cnpm },
  { name: registryName('npm', Registry.npm), value: Registry.npm }
];

export const defaultRegistry = registryName('qunar', Registry.qunar);
