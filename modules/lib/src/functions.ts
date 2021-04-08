import { Observable, Subscription } from 'rxjs';
import { Action } from '@ngrx/store';
import { InjectionToken, Type } from '@angular/core';

type Inject = <T>(token: Type<T> | InjectionToken<T>) => T;

type EffectDescription = {
  type: string;
  params?: any;
};

export type ObservableEffect<T> = {
  operation: (inject: Inject) => Observable<T>;
  next: (value: T) => Action;
  error?: (err: any) => Action;
  complete?: () => Action;
  subscribe?: (token: SubscriptionToken) => Action;
};

export type PromiseEffect<T> = {
  operation: (inject: Inject) => Promise<T>;
  resolve: (value: T) => Action;
  reject?: (err: any) => Action;
};

export type UnsubscriptionEffect<T> = {
  operation: (inject: Inject) => UnsubscribeOperation;
  unsubscribe?: (token: CancellationToken) => Action;
};

export type Operand<T> = Observable<T> | Promise<T> | UnsubscribeOperation;

export type EffectConfig<T> = (
  | ObservableEffect<T>
  | PromiseEffect<T>
  | UnsubscriptionEffect<T>
) &
  Partial<EffectDescription>;

export type EffectCreator<S> = <E>(state: S) => EffectConfig<E>;

export const stateWithEffectsBrand = 'StateWithEffects';
export type StateWithEffects<S, E> = {
  __brand: typeof stateWithEffectsBrand;
  state: S;
  effects: EffectConfig<E>[];
};

export type SubscriptionToken = number & { __brand: 'SubscriptionToken' };
export type CancellationToken = number & { __brand: 'CancellationToken' };

export type Cancellable<T> = Subscription | AbortController;

export function withEffects<S, E>(
  state: S,
  ...effects: Array<EffectConfig<E> | EffectCreator<S>>
): StateWithEffects<S, E> {
  return {
    __brand: stateWithEffectsBrand,
    state,
    effects: effects.map((effectConfig) =>
      typeof effectConfig === 'function' ? effectConfig(state) : effectConfig
    )
  };
}

export const unsubscribeBrand = 'Unsubscribe';

export type UnsubscribeOperation = {
  __brand: typeof unsubscribeBrand;
  subscriptionToken: SubscriptionToken;
};

export function unsubscribe(subscriptionToken: SubscriptionToken): UnsubscribeOperation {
  return {
    __brand: unsubscribeBrand,
    subscriptionToken
  };
}

export function createReducerEffect<TState, TParams>(
  effectCreator: (state: TState, params: TParams) => EffectConfig<any>
): (params: TParams) => EffectCreator<TState>;
export function createReducerEffect<TState>(
  effectCreator: (state: TState) => EffectConfig<any>
): () => EffectCreator<TState>;
export function createReducerEffect<TState, TParams>(
  effectCreator: (state: TState, params?: TParams) => EffectConfig<any>
): (params?: TParams) => EffectCreator<TState> {
  return (params?: TParams) => (state: TState) => Object.assign(effectCreator(state, params), {params});
}
