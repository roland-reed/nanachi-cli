import Build from './Build';

interface InterfaceBuildOptions {
  cwd: string;
  forceUpdateLibrary: boolean;
  minify: boolean;
}

async function start(options: InterfaceBuildOptions) {
  try {
    const build = new Build(options);
    await build.build();
  } catch (error) {
    // tslint:disable
    console.log(error);
  }
}

export default start;
