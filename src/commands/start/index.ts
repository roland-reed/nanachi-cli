import Build from '../build/Build';
import { InterfaceBuildOptions } from '../build/index';

async function start(options: InterfaceBuildOptions) {
  try {
    const build = new Build(options);
    await build.start();
  } catch (error) {
    // tslint:disable
    console.log(error);
    process.exit(1);
  }
}

export default start;
