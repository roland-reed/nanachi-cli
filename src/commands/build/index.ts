import Build from './Build';

async function start() {
  try {
    const build = new Build({
      cwd: process.cwd()
    });
    await build.build();
  } catch (error) {
    // tslint:disable
    console.log(error);
  }
}

export default start;