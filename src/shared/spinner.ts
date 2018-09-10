import ora from 'ora';

const spinner = ora();

export function log(message?: string): void {
  spinner.stop();
  // tslint:disable-next-line
  if (message) console.log(message);
  spinner.start();
}

export function stop(message?: string): void {
  spinner.stop();
  // tslint:disable-next-line
  if (message) console.log(message);
}

export function start(message?: string): void {
  spinner.start(message);
}

export function info(message: string): void {
  spinner.info(message);
}

export function succeed(message: string): void {
  spinner.succeed(message);
}

export function fail(message: string): void {
  spinner.fail(message);
}

export function changeText(message: string): void {
  spinner.text = message;
}
