import Build from '../build/Build';
import { InterfaceBuildOptions } from '../build/index';

async function start(options: InterfaceBuildOptions) {
  const build = new Build(options);
  await build.start();
}

export default start;
