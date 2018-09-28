import Build from './Build';

export interface InterfaceBuildOptions {
  cwd: string;
  forceUpdateLibrary: boolean;
  minify: boolean;
}

async function start(options: InterfaceBuildOptions) {
  try {
    const build = new Build(options);
    await build.build();
  } catch (error) {
    // tslint:disable-next-line
    console.log(error);
    process.exit(1);
  }
}

export default start;
