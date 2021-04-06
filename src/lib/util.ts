export type ActionsOf<T extends { [key: string]: (...args: any) => any }> = ReturnType<T[keyof T]>;

export enum StatusTypes {
  loading = 'loading',
  loaded = 'loaded',
  failed = 'failed'
}

export interface Either<T> {
  orElse<U>(other: U): T | U;
}

export class Loading<T> implements Either<T> {
  type = StatusTypes.loading;

  orElse<U>(other: U): U {
    // @ts-ignore
    return undefined;
  }

  map<U>(f: (a: T) => U): Status<U> {
    return (this as unknown) as Status<U>;
  }
}

export class Loaded<T> implements Either<T> {
  type = StatusTypes.loaded;

  constructor(public value: T) {}

  orElse<U>(other: U): T | U {
    return this.value ?? other;
  }

  map<U>(f: (a: T) => U): Status<U> {
    return new Loaded(f(this.value)) as Status<U>;
  }
}

export class Failed<T> implements Either<T> {
  type = StatusTypes.failed;

  constructor(public error: string) {}

  orElse<U>(other: U): U {
    // @ts-ignore
    return undefined;
  }

  map<U>(f: (a: T) => U): Status<U> {
    return (this as unknown) as Status<U>;
  }
}

export type Status<T> = Loading<T> | Loaded<T> | Failed<T>;
