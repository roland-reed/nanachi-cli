interface InterfaceTEMPLATE {
  [property: string]: {
    url: string;
    checkout: string;
    name: string;
    value: string;
  };
}

export const TEMPLATES: InterfaceTEMPLATE = {
  mall: {
    value: 'mall',
    name: 'mall demo',
    checkout: 'gaoxiaolin',
    url: 'git@gitlab.corp.qunar.com:qincheng.zhong/anuwx.git'
  }
};

export const choices = Object.keys(TEMPLATES).map(key => {
  return {
    name: TEMPLATES[key].name,
    value: TEMPLATES[key].value
  };
});
