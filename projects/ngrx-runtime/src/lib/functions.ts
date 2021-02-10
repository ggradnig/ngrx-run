import { Observable, Subscription } from 'rxjs';
import { Action } from '@ngrx/store';

export type ObservableEffect<T> = {
  operation: () => Observable<T>;
  next: (value: T) => Action;
  error?: (err: any) => Action;
  complete?: () => Action;
  subscribe?: (token: SubscriptionToken) => Action;
};

export type PromiseEffect<T> = {
  operation: () => Promise<T>;
  resolve: (value: T) => Action;
  reject?: (err: any) => Action;
};

export type UnsubscriptionEffect<T> = {
  operation: SubscriptionToken;
  unsubscribe?: (token: CancellationToken) => Action;
};

export type Operand<T> = Observable<T> | Promise<T> | SubscriptionToken;

export type Effect<T> = ObservableEffect<T> | PromiseEffect<T> | UnsubscriptionEffect<T>;

const brand = 'StateWithEffects';
export type StateWithEffects<S, E> = {
  __brand: typeof brand;
  state: S;
  effects: Effect<E>[];
};

export type SubscriptionToken = number & { __brand: 'SubscriptionToken' };
export type CancellationToken = number & { __brand: 'CancellationToken' };

export type Cancellable<T> = Subscription | AbortController;

export function withEffects<S, E>(state: S, ...effects: Effect<E>[]): StateWithEffects<S, E> {
  return {
    __brand: brand,
    state,
    effects
  };
}
