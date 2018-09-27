import * as spinner from '@shared/spinner';

interface InterfaceLog {
  silent: boolean;
}

export default class Log {
  private silent: boolean;
  constructor({ silent }: InterfaceLog) {
    this.silent = silent;
  }
  public log(message?: string): void {
    if (this.silent) return;
    spinner.stop();
    // tslint:disable-next-line
    if (message) console.log(message);
    spinner.start();
  }

  public stop(message?: string): void {
    if (this.silent) return;
    spinner.stop();
    // tslint:disable-next-line
    if (message) console.log(message);
  }

  public start(message?: string): void {
    if (this.silent) return;
    spinner.start(message);
  }

  public info(message: string): void {
    if (this.silent) return;
    spinner.info(message);
  }

  public succeed(message: string): void {
    if (this.silent) return;
    spinner.succeed(message);
  }

  public fail(message: string): void {
    if (this.silent) return;
    spinner.fail(message);
  }

  public warn(message: string): void {
    if (this.silent) return;
    spinner.warn(message);
  }

  public changeText(message: string): void {
    if (this.silent) return;
    spinner.changeText(message);
  }
}
