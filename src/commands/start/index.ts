import Build from '../build/Build';

async function start() {
  try {
    const build = new Build({
      cwd: process.cwd()
    });
    await build.start();
  } catch (error) {
    // tslint:disable
    console.log(error);
    process.exit(1);
  }
}

export default start;
