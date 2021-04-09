import { unsubscribeBrand } from './functions';
import { isObservable, Observable, Subscription } from 'rxjs';
import { Action } from '@ngrx/store';
import { InjectionToken, Type } from '@angular/core';
import {EffectConfig} from './effect-config';

export type Inject = <T>(token: Type<T> | InjectionToken<T>) => T;

export type Operand<T> = Observable<T> | Promise<T> | UnsubscribeOperation;

export type SubscriptionToken = number & { __brand: 'SubscriptionToken' };

export type Cancellable<T> = Subscription | AbortController;
export type CancellationToken = number & { __brand: 'CancellationToken' };
export type UnsubscribeOperation = {
  __brand: typeof unsubscribeBrand;
  subscriptionToken: SubscriptionToken;
};

export type ObservableEffect<T> = {
  operation: (inject: Inject) => Observable<T>;
  next?: (value: T) => Action;
  error?: (err: any) => Action;
  complete?: () => Action;
  subscribe?: (token: SubscriptionToken) => Action;
};

export type PromiseEffect<T> = {
  operation: (inject: Inject) => Promise<T>;
  resolve?: (value: T) => Action;
  reject?: (err: any) => Action;
};

export type UnsubscriptionEffect<T> = {
  operation: (inject: Inject) => UnsubscribeOperation;
  unsubscribe?: (token: CancellationToken) => Action;
};

export function isObservableEffect<E>(
  effect: EffectConfig<E>,
  operand: Operand<E>
): effect is ObservableEffect<E> {
  return isObservable(operand);
}

export function isPromiseEffect<E>(
  effect: EffectConfig<E>,
  operand: Operand<E>
): effect is PromiseEffect<E> {
  return operand instanceof Promise;
}

export function isUnsubscriptionEffect<E>(
  effect: EffectConfig<E>,
  operand: Operand<E>
): effect is UnsubscriptionEffect<E> {
  return (operand as UnsubscribeOperation).__brand === 'Unsubscribe';
}
