import { unsubscribeBrand } from './unsubscribe';
import { isObservable, Observable, Subscription } from 'rxjs';
import { Action } from '@ngrx/store';
import { InjectionToken, Type } from '@angular/core';
import { EffectConfig } from './effect-config';

export type Inject = <T>(token: Type<T> | InjectionToken<T>) => T;

export type Operand<T> = Observable<T> | Promise<T> | UnsubscribeOperation | void;

/* Dependencies */
export type Dependencies = Dependency[];
export type Dependency = any;
export type Instance<T> = T extends new (...args: any[]) => InstanceType<any>
  ? InstanceType<T>
  : T extends InjectionToken<infer U>
  ? U
  : T;
export type Instances<T> = {
  [P in keyof T]: Instance<T[P]>;
};

export function hasDependencies(
  effectLike: any
): effectLike is Required<HasDependencies<any>> {
  return (effectLike as HasDependencies<any>).using != null;
}

/* Base */
export type IsEffect = {
  __isEffect: true;
  type?: string;
};
type HasDependencies<TDeps extends Dependencies> = {
  using?: readonly [...TDeps];
};

/* Observable */
export type SubscriptionToken = number & { __brand: 'SubscriptionToken' };
export type ObservableEffectDefinition<TDeps extends Dependencies, TResult> = IsEffect &
  HasDependencies<TDeps> & {
    call: (...deps: Instances<TDeps>) => Observable<TResult>;
  };

export type ObservableEffectHandler<TResult> = {
  next: (value: TResult) => Action;
  error?: (err: any) => Action;
  complete?: () => Action;
  subscribed?: (token: SubscriptionToken) => Action;
};

export type ObservableEffect<
  TDeps extends Dependencies,
  TResult
> = ObservableEffectDefinition<TDeps, TResult> & ObservableEffectHandler<TResult>;

export function isObservableEffect<TDeps extends Dependencies, TResult>(
  effect: EffectConfig<TDeps, TResult>,
  operand: Operand<TResult>
): effect is ObservableEffect<TDeps, TResult> {
  return isObservable(operand);
}

export function isObservableOperand<TResult>(
  operand: Operand<TResult>
): operand is Observable<TResult> {
  return isObservable(operand);
}

/* Promise */
export type PromiseEffectDefinition<TDeps extends Dependencies, TResult> = IsEffect &
  HasDependencies<TDeps> & {
    call: (...deps: Instances<TDeps>) => Promise<TResult>;
  };

export type PromiseEffectHandler<TResult> = {
  error?: (err: any) => Action;
  complete?: (value: TResult) => Action;
};

export type PromiseEffect<TDeps extends Dependencies, TResult> = PromiseEffectDefinition<
  TDeps,
  TResult
> &
  PromiseEffectHandler<TResult>;

export function isPromiseEffect<TDeps extends Dependencies, TResult>(
  effect: EffectConfig<TDeps, TResult>,
  operand: Operand<TResult>
): effect is PromiseEffect<TDeps, TResult> {
  return operand instanceof Promise;
}

export function isPromiseOperand<TResult>(
  operand: Operand<TResult>
): operand is Promise<TResult> {
  return operand instanceof Promise;
}

/* Immediate */
export type ImmediateEffectDefinition<TDeps extends Dependencies> = IsEffect &
  HasDependencies<TDeps> & {
    call: (...deps: Instances<TDeps>) => void;
  };
export type ImmediateEffectHandler = {
  error?: (err: any) => Action;
  complete?: () => Action;
};
export type ImmediateEffect<
  TDeps extends Dependencies
> = ImmediateEffectDefinition<TDeps> & ImmediateEffectHandler;

/* Unsubscribe */
export type Cancellable<T> = Subscription | AbortController;
export type UnsubscribeOperation = {
  __brand: typeof unsubscribeBrand;
  subscriptionToken: SubscriptionToken;
};

export function isUnsubscriptionEffect(
  effect: EffectConfig<any, any>,
  operand: Operand<any>
): effect is ImmediateEffect<any> {
  return (operand as UnsubscribeOperation).__brand === 'Unsubscribe';
}
