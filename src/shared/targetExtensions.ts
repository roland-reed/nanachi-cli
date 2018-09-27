interface InterfaceExtension {
  script: string;
  style: string;
  template: string;
}

interface InterfaceTargetExtensions {
  [property: string]: InterfaceExtension;
}

const wx: InterfaceExtension = {
  script: '.js',
  style: '.wxss',
  template: '.wxml'
};

const baidu: InterfaceExtension = {
  script: '.js',
  style: '.css',
  template: '.swan'
};

const ali: InterfaceExtension = {
  script: '.js',
  style: '.acss',
  template: '.axml'
};

const targetExtensions: InterfaceTargetExtensions = {
  wx,
  baidu,
  ali
};

export default targetExtensions;
