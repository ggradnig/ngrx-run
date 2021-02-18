import {Observable, Subscription} from 'rxjs';
import {Action} from '@ngrx/store';
import {inject as angularInject, InjectionToken, Type} from '@angular/core';

type Inject<T> = (token: Type<T> | InjectionToken<T>) => T;

export type ObservableEffect<T> = {
  operation: (inject: Inject<any>) => Observable<T>;
  next: (value: T) => Action;
  error?: (err: any) => Action;
  complete?: () => Action;
  subscribe?: (token: SubscriptionToken) => Action;
};

export type PromiseEffect<T> = {
  operation: (inject: Inject<any>) => Promise<T>;
  resolve: (value: T) => Action;
  reject?: (err: any) => Action;
};

export type UnsubscriptionEffect<T> = {
  operation: (inject: Inject<any>) => UnsubscribeOperation;
  unsubscribe?: (token: CancellationToken) => Action;
};

export type Operand<T> = Observable<T> | Promise<T> | UnsubscribeOperation;

export type Effect<T> = ObservableEffect<T> | PromiseEffect<T> | UnsubscriptionEffect<T>;

export const stateWithEffectsBrand = 'StateWithEffects';
export type StateWithEffects<S, E> = {
  __brand: typeof stateWithEffectsBrand;
  state: S;
  effects: Effect<E>[];
};

export type SubscriptionToken = number & { __brand: 'SubscriptionToken' };
export type CancellationToken = number & { __brand: 'CancellationToken' };

export type Cancellable<T> = Subscription | AbortController;

export function withEffects<S, E>(state: S, ...effects: Effect<E>[]): StateWithEffects<S, E> {
  return {
    __brand: stateWithEffectsBrand,
    state,
    effects
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
