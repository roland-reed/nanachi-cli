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
  }
}

export default start;
