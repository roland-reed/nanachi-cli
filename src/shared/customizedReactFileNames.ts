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
  primary: 'ReactBu.js'
};

const customizedReacts: InterfaceCustomizedReactFileNames = {
  wx,
  ali,
  baidu
};

export default customizedReacts;
