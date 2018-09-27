interface InterfaceCustomizedReactFileName {
  primary: string;
}

interface InterfaceCustomizedReactFileNames {
  [property: string]: InterfaceCustomizedReactFileName;
}

const wx: InterfaceCustomizedReactFileName = {
  primary: 'ReactWX.js'
};

const ali: InterfaceCustomizedReactFileName = {
  primary: 'ReactAli.js'
};

const baidu: InterfaceCustomizedReactFileName = {
  // 专门为百度定制的 library 还未开发完成
  // 暂时使用微信版
  primary: 'ReactWX.js'
};

const customizedReacts: InterfaceCustomizedReactFileNames = {
  wx,
  ali,
  baidu
};

export default customizedReacts;
