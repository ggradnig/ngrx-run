import { Observable } from 'rxjs';
import { InjectionToken, Type } from '@angular/core';
import {
  Dependencies,
  ImmediateEffectDefinition,
  Instances,
  IsEffect,
  ObservableEffectDefinition,
  PromiseEffectDefinition
} from './effect';

type DepExtras<T> = {
  [P in keyof T]?: DepExtras<T[P]>;
};

export function inject<T>(token: InjectionToken<any>): Type<T> {
  return (token as unknown) as Type<T>;
}

type HasType = { type?: string };

/* Observable */
export function effect<TDeps extends Dependencies, TResult>(
  config: HasType & {
    call: (params: unknown, ...dep: Instances<TDeps>) => Observable<TResult>;
    using?: readonly [...TDeps];
  }
): () => ObservableEffectDefinition<TDeps, TResult>;
export function effect<TParams, TDeps extends Dependencies, TResult>(
  config: HasType & {
    call: (params: TParams, ...dep: Instances<TDeps>) => Observable<TResult>;
    using?: readonly [...TDeps];
  }
): (params: TParams) => ObservableEffectDefinition<TDeps, TResult>;

/* Promise */
export function effect<TDeps extends Dependencies, TResult>(
  config: HasType & {
    call: (params: unknown, ...dep: Instances<TDeps>) => Promise<TResult>;
    using?: readonly [...TDeps];
  }
): () => PromiseEffectDefinition<TDeps, TResult>;
export function effect<TParams, TDeps extends Dependencies, TResult>(
  config: HasType & {
    call: (params: TParams, ...dep: Instances<TDeps>) => Promise<TResult>;
    using?: readonly [...TDeps];
  }
): (params: TParams) => PromiseEffectDefinition<TDeps, TResult>;

/* Immediate */
export function effect<TDeps extends Dependencies>(
  config: HasType & {
    call: (params: unknown, ...dep: Instances<TDeps>) => void;
    using?: readonly [...TDeps];
  }
): () => ImmediateEffectDefinition<TDeps>;
export function effect<TParams, TDeps extends any[]>(
  config: HasType & {
    call: (params: TParams, ...dep: Instances<TDeps>) => void;
    using?: readonly [...TDeps];
  }
): (params: TParams) => ImmediateEffectDefinition<TDeps>;

/* General */
export function effect<TParams, TDeps extends any[], TResult>(
  config: HasType & {
    call:
      | ((params: TParams, ...dep: Instances<TDeps>) => any)
      | ((params: TParams) => any);
    using?: readonly [...TDeps];
  }
): (params: TParams) => IsEffect {
  return (params) => ({
    __isEffect: true,
    type: config.type,
    call: (...dep: Instances<TDeps>) => config.call(params, ...dep),
    using: config.using,
    params
  });
}
