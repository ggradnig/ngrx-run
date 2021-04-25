import {Injector} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {ReducerResult} from './reducer';
import {addEffectDescriptions} from './effect-description';
import {
  Cancellable,
  Dependencies,
  hasDependencies,
  ImmediateEffect,
  isObservableEffect,
  isObservableOperand,
  isPromiseEffect,
  isPromiseOperand,
  isUnsubscriptionEffect,
  Operand,
  SubscriptionToken,
  UnsubscribeOperation,
} from './effect';
import {EffectConfig} from './effect-config';
import {StateWithEffect} from './state-with-effect';

export type Runtime = Map<SubscriptionToken, Cancellable<any>>;

export function handleEffects<T>(
  injector: Injector,
  runtime: Runtime
): (reduced: ReducerResult<T>) => T {
  return (reduced) => {
    let newState: T = handleSliceEffects(reduced);
    // tslint:disable-next-line:forin
    for (const key in newState) {
      newState = {...newState, [key]: handleSliceEffects(newState[key])};
    }
    return newState;
  };

  function handleSliceEffects<S>(slicedState: ReducerResult<S>): S {
    if (isStateWithEffects(slicedState)) {
      const [state, effect] = slicedState;
      handleStateWithEffect(effect, runtime, injector.get(Store), injector);
      return addEffectDescriptions(state, effect);
    } else {
      return slicedState as S;
    }
  }
}

function isStateWithEffects(
  state: any | [any, EffectConfig<any, any>]
): state is StateWithEffect<any, any, any> {
  return state[1] && state[1].__isEffect === true;
}

function handleStateWithEffect<TDeps extends Dependencies, TResult>(
  effect: EffectConfig<TDeps, TResult>,
  runtime: Runtime,
  store: Store,
  injector: Injector
): void {
  let operand: Operand<TResult>;
  const deps = hasDependencies(effect)
    ? effect.using.map((dep) => injector.get(dep))
    : [];
  try {
    // @ts-ignore
    operand = effect.call(...deps);
  } catch (err) {
    if (effect.error) {
      try {
        store.dispatch(effect.error(err));
      } catch (innerError) {
        console.error(
          `Unhandled error occurred when creating error action for effect "${effect.type}"`,
          innerError
        );
      }
    } else {
      console.error(
        `Unhandled error occurred when creating operation for effect "${effect.type}"`,
        err
      );
    }
  }

  if (isObservableEffect(effect, operand) && isObservableOperand(operand)) {
    const token = (Math.max(...runtime.keys()) + 1) as SubscriptionToken;
    const subscription = operand.subscribe({
      next: (value) => effect.next && store.dispatch(effect.next(value)),
      error: (err) => effect.error && store.dispatch(effect.error(err)),
      complete: () => effect.complete && store.dispatch(effect.complete())
    });
    runtime.set(token, subscription);
    if (effect.subscribed) {
      store.dispatch(effect.subscribed(token));
    }
  } else if (isPromiseEffect(effect, operand) && isPromiseOperand(operand)) {
    operand.then(
      (value) => effect.complete && store.dispatch(effect.complete(value)),
      (err) => effect.error && store.dispatch(effect.error(err))
    );
  } else if (isUnsubscriptionEffect(effect, operand)) {
    handleUnsubscribe(operand as UnsubscribeOperation, effect, runtime, store);
  } else {
    const complete = (effect as ImmediateEffect<any>).complete;
    if (complete) {
      store.dispatch(complete());
    }
  }
}

function handleUnsubscribe(
  operation: UnsubscribeOperation,
  effect: ImmediateEffect<any>,
  runtime: Runtime,
  store: Store
): void {
  const cancellable = runtime.get(operation.subscriptionToken);
  if (cancellable instanceof Subscription) {
    runtime.delete(operation.subscriptionToken);
    cancellable.unsubscribe();
  } else if (cancellable instanceof AbortController) {
    runtime.delete(operation.subscriptionToken);
    cancellable.abort();
  } else {
    console.warn(
      `SubscriptionToken ${operation.subscriptionToken} not recognized. Did you cancel this already?`
    );
  }
  if (effect.complete) {
    store.dispatch(effect.complete());
  }
}
