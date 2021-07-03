import {Observable} from 'rxjs';
import {InjectionToken, Type} from '@angular/core';
import {Dependencies, ImmediateEffectDefinition, Instances, IsEffect, ObservableEffectDefinition, PromiseEffectDefinition} from './effect';

type DepExtras<T> = {
  [P in keyof T]?: DepExtras<T[P]>;
};

export function inject<T>(token: InjectionToken<any>): Type<T> {
  return (token as unknown) as Type<T>;
}

/* Observable */
export function createEffect<TParams, TDeps extends Dependencies, TResult>(
  type: string,
  config: {
    call: (...dep: Instances<TDeps>) => (params: TParams) => Observable<TResult>;
    using: readonly [...TDeps];
  }
): (params: TParams) => ObservableEffectDefinition<TDeps, TResult>;
export function createEffect<TDeps extends Dependencies, TResult>(
  type: string,
  config: {
    call: (...dep: Instances<TDeps>) => Observable<TResult>;
    using: readonly [...TDeps];
  }
): () => ObservableEffectDefinition<TDeps, TResult>;
export function createEffect<TParams, TResult>(
  type: string,
  config: {
    call: (params: TParams) => Observable<TResult>;
  }
): (params: TParams) => ObservableEffectDefinition<[], TResult>;

/* Promise */
export function createEffect<TParams, TDeps extends Dependencies, TResult>(
  type: string,
  config: {
    call: (...dep: Instances<TDeps>) => (params: TParams) => Promise<TResult>;
    using?: readonly [...TDeps];
  }
): (params: TParams) => PromiseEffectDefinition<TDeps, TResult>;
export function createEffect<TDeps extends Dependencies, TResult>(
  type: string,
  config: {
    call: (...dep: Instances<TDeps>) => Promise<TResult>;
    using?: readonly [...TDeps];
  }
): () => PromiseEffectDefinition<TDeps, TResult>;
export function createEffect<TParams, TResult>(
  type: string,
  config: {
    call: (params: TParams) => Promise<TResult>;
  }
): (params: TParams) => PromiseEffectDefinition<[], TResult>;

/* Immediate */
export function createEffect<TParams, TDeps extends Dependencies>(
  type: string,
  config: {
    call: (...dep: Instances<TDeps>) => (params: TParams) => void;
    using?: readonly [...TDeps];
  }
): (params: TParams) => ImmediateEffectDefinition<TDeps>;
export function createEffect<TDeps extends Dependencies>(
  type: string,
  config: {
    call: (...dep: Instances<TDeps>) => void;
    using?: readonly [...TDeps];
  }
): () => ImmediateEffectDefinition<TDeps>;
export function createEffect<TParams>(
  type: string,
  config: {
    call: (params: TParams) => void;
  }
): (params: TParams) => ImmediateEffectDefinition<[]>;

/* General */
export function createEffect<TParams, TDeps extends any[], TResult>(
  type: string,
  config: {
    call:
      | ((...dep: Instances<TDeps>) => (params?: TParams) => any)
      | ((params?: TParams) => any)
      | ((...dep: Instances<TDeps>) => any);
    using?: readonly [...TDeps];
  }
): (params?: TParams) => IsEffect {
  // tslint:disable-next-line:only-arrow-functions typedef
  return function(params?: TParams) {
    const hasParams = arguments.length > 0;
    const hasDependencies = config.using;
    if (hasParams && hasDependencies) {
      return {
        __isEffect: true,
        type,
        call: (...deps: Instances<TDeps>) =>
          (config.call as (...dep: Instances<TDeps>) => (params?: TParams) => any)(
            ...deps
          )(params),
        using: config.using,
        params
      };
    } else if (!hasParams) {
      return {
        __isEffect: true,
        type,
        call: (...deps: Instances<TDeps>) =>
          (config.call as (...dep: Instances<TDeps>) => any)(...deps),
        using: config.using,
        params
      };
    } else {
      return {
        __isEffect: true,
        type,
        call: () => (config.call as (params: TParams) => any)((params as TParams)),
        using: config.using,
        params
      };
    }
  };
}
