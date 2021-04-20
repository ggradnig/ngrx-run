import {CancellationToken, ObservableEffect, PromiseEffect, SubscriptionToken, UnsubscriptionEffect} from './effect';
import {EffectConfig} from './effect-config';

interface EffectDescription {
  type?: string;
  params?: any;
  nextAction?: string;
  errorAction?: string;
  completeAction?: string;
  subscribeAction?: string;
  unsubscribeAction?: string;
}

const handler = {
  get(): object {
    return proxy;
  }
};

const target = {};
const proxy = new Proxy(target, handler);

export function addEffectDescriptions<TState, TEffect>(state: TState, effects: EffectConfig<any>[]): any {
  const effectDescriptions: EffectDescription[] = effects.map((effect) => ({
    type: effect.type,
    params: effect.params,
    nextAction: hasNextAction(effect) ? effect.next(proxy).type : undefined,
    errorAction: hasErrorAction(effect) ? effect.error(proxy).type : undefined,
    completeAction: hasCompleteAction(effect) ? effect.complete().type : undefined,
    subscribeAction: hasSubscribeAction(effect)
      ? effect.subscribe(0 as SubscriptionToken).type
      : undefined,
    unsubscribeAction: hasUnsubscribeAction(effect)
      ? effect.unsubscribe(0 as CancellationToken).type
      : undefined
  }));
  return Object.assign(state, {__effects__: effectDescriptions});
}

function hasNextAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { next: NonNullable<ObservableEffect<T>['next']> } {
  return (effect as ObservableEffect<T>).next !== undefined;
}

function hasErrorAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { error: NonNullable<ObservableEffect<T>['error']> } {
  return (effect as ObservableEffect<T>).error !== undefined;
}

function hasCompleteAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { complete: NonNullable<ObservableEffect<T>['complete']> } {
  return (effect as ObservableEffect<T>).complete !== undefined;
}

function hasSubscribeAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { subscribe: NonNullable<ObservableEffect<T>['subscribe']> } {
  return (effect as ObservableEffect<T>).subscribe !== undefined;
}

function hasUnsubscribeAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { unsubscribe: NonNullable<UnsubscriptionEffect<T>['unsubscribe']> } {
  return (effect as UnsubscriptionEffect<T>).unsubscribe !== undefined;
}
